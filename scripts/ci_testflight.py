"""Sign and upload on an ephemeral GitHub-hosted macOS runner. No dependencies."""
import base64
import datetime
import os
from pathlib import Path
import plistlib
import re
import secrets
import subprocess
import sys
import tempfile


def run(*args, quiet=False):
    return subprocess.run(args, check=True, text=True, capture_output=quiet)


def main():
    if sys.platform != 'darwin' or os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Run this script through the supplied GitHub macOS workflow.')
    run(sys.executable, 'scripts/sync_app.py')
    run(sys.executable, 'scripts/check_iphone.py', '--sdk')
    required = ['TEAM_ID', 'BUNDLE_ID', 'BUILD_CERTIFICATE_BASE64', 'P12_PASSWORD',
                'BUILD_PROVISION_PROFILE_BASE64', 'ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY']
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError('Configure these GitHub repository variables/secrets: ' + ', '.join(missing))
    env = os.environ
    team, bundle = env['TEAM_ID'], env['BUNDLE_ID']
    if not re.fullmatch(r'[A-Z0-9]{10}', team):
        raise RuntimeError('APPLE_TEAM_ID must contain your 10-character Apple Developer team ID.')
    if not re.fullmatch(r'[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+', bundle) or bundle == 'com.example.scheduler':
        raise RuntimeError('APPLE_BUNDLE_ID must be your registered application identifier.')
    profile_copies = []
    with tempfile.TemporaryDirectory(prefix='weekbyweek-', dir=env['RUNNER_TEMP']) as temporary:
        temp = Path(temporary)
        keychain = temp / 'signing.keychain-db'
        keychain_password = secrets.token_urlsafe(32)
        try:
            certificate = temp / 'distribution.p12'
            certificate.write_bytes(base64.b64decode(env['BUILD_CERTIFICATE_BASE64']))
            profile_file = temp / 'distribution.mobileprovision'
            profile_file.write_bytes(base64.b64decode(env['BUILD_PROVISION_PROFILE_BASE64']))
            profile = plistlib.loads(run('security', 'cms', '-D', '-i', str(profile_file), quiet=True).stdout.encode())
            entitlements = profile.get('Entitlements', {})
            if team not in profile.get('TeamIdentifier', []) or entitlements.get('application-identifier') != f'{team}.{bundle}':
                raise RuntimeError('Provisioning profile does not match this team and bundle ID.')
            if entitlements.get('get-task-allow') or profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices'):
                raise RuntimeError('Use an App Store distribution profile, not a development, ad-hoc or enterprise profile.')
            if profile['ExpirationDate'].replace(tzinfo=datetime.timezone.utc) <= datetime.datetime.now(datetime.timezone.utc):
                raise RuntimeError('The provisioning profile has expired.')
            uuid = profile['UUID']
            if not re.fullmatch(r'[A-Fa-f0-9-]+', uuid):
                raise RuntimeError('Invalid provisioning profile UUID.')
            run('security', 'create-keychain', '-p', keychain_password, str(keychain), quiet=True)
            run('security', 'set-keychain-settings', '-lut', '21600', str(keychain), quiet=True)
            run('security', 'unlock-keychain', '-p', keychain_password, str(keychain), quiet=True)
            run('security', 'import', str(certificate), '-P', env['P12_PASSWORD'],
                '-A', '-t', 'cert', '-f', 'pkcs12', '-k', str(keychain), quiet=True)
            run('security', 'set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:',
                '-s', '-k', keychain_password, str(keychain), quiet=True)
            run('security', 'list-keychains', '-d', 'user', '-s', str(keychain), quiet=True)
            identities = run('security', 'find-identity', '-v', '-p', 'codesigning', str(keychain), quiet=True).stdout
            identity = re.search(r'([A-F0-9]{40})\s+"Apple Distribution:', identities)
            if not identity:
                raise RuntimeError('The P12 must include a valid Apple Distribution certificate and its private key.')
            # Support both legacy and current Xcode provisioning-profile locations.
            for directory in [Path.home() / 'Library/MobileDevice/Provisioning Profiles',
                              Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles']:
                directory.mkdir(parents=True, exist_ok=True)
                destination = directory / f'{uuid}.mobileprovision'
                if destination.exists():
                    raise RuntimeError('Unexpected existing profile; use a fresh hosted runner.')
                destination.write_bytes(profile_file.read_bytes())
                profile_copies.append(destination)
            key_file = temp / 'AuthKey.p8'
            key_file.write_text(env['ASC_PRIVATE_KEY'])
            key_file.chmod(0o600)
            archive = temp / 'Scheduler.xcarchive'
            options = temp / 'ExportOptions.plist'
            options.write_bytes(plistlib.dumps({
                'method': 'app-store-connect', 'destination': 'upload', 'signingStyle': 'manual',
                'teamID': team, 'signingCertificate': identity.group(1),
                'provisioningProfiles': {bundle: uuid}, 'uploadSymbols': True,
                'manageAppVersionAndBuildNumber': True,
            }))
            build = f"{int(env['GITHUB_RUN_NUMBER'])}.{int(env['GITHUB_RUN_ATTEMPT'])}.0"
            run('xcodebuild', '-project', 'Scheduler.xcodeproj', '-scheme', 'Scheduler',
                '-configuration', 'Release', '-destination', 'generic/platform=iOS',
                '-archivePath', str(archive), 'CODE_SIGN_STYLE=Manual',
                f'DEVELOPMENT_TEAM={team}', f'PRODUCT_BUNDLE_IDENTIFIER={bundle}',
                f'CURRENT_PROJECT_VERSION={build}', f'CODE_SIGN_IDENTITY={identity.group(1)}',
                f'PROVISIONING_PROFILE_SPECIFIER={uuid}', 'archive')
            run('xcodebuild', '-exportArchive', '-archivePath', str(archive),
                '-exportOptionsPlist', str(options), '-exportPath', str(temp / 'export'),
                '-authenticationKeyPath', str(key_file), '-authenticationKeyID', env['ASC_KEY_ID'],
                '-authenticationKeyIssuerID', env['ASC_ISSUER_ID'])
            print('Upload command completed. Check App Store Connect for build processing and TestFlight availability.')
        finally:
            for path in profile_copies:
                path.unlink(missing_ok=True)
            if keychain.exists():
                subprocess.run(['security', 'delete-keychain', str(keychain)], capture_output=True)


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        # Do not print a subprocess command: it may contain signing passwords.
        print(f'A signing/build/upload command failed (exit {error.returncode}). Review the preceding build log and configured signing materials.', file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
