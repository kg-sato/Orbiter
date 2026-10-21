"""Validate source/bundle readiness on Windows or macOS; never signs or uploads."""
from html.parser import HTMLParser
import json
from pathlib import Path
import plistlib
import re
import subprocess
import sys
import tomllib

ROOT = Path(__file__).resolve().parent.parent


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.external = []
        self.policy = ''

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'img', 'iframe', 'source', 'video', 'audio', 'link'):
            value = attrs.get('src') or (attrs.get('href') if tag == 'link' else None)
            if value and not value.startswith(('data:', 'blob:', '#')):
                self.external.append(value)
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'content-security-policy':
            self.policy = attrs.get('content', '')


def check_bundle(source):
    parser = Resources()
    parser.feed(source)
    if parser.external:
        raise ValueError(f'iPhone bundle has external/missing resources: {parser.external}')
    if "connect-src data: blob:" not in parser.policy:
        raise ValueError('Offline network policy missing')
    for token in ('id="iphone-privacy"', 'Account sync is unavailable', 'id="study-core"', 'id="orbiter-cats"'):
        if token not in source:
            raise ValueError(f'iPhone content missing: {token}')
    if 'id="open-account"' in source or 'createClient(' in source:
        raise ValueError('Unsupported account entry/controller included')


def check_sdk():
    if sys.platform != 'darwin':
        raise RuntimeError('Apple SDK validation requires macOS and Xcode')
    sdk = subprocess.check_output(['xcrun', '--sdk', 'iphoneos', '--show-sdk-version'], text=True).strip()
    xcode = subprocess.check_output(['xcodebuild', '-version'], text=True).strip()
    if int(sdk.split('.')[0]) < 26:
        raise ValueError(f'Apple uploads require iOS SDK 26 or later, found {sdk}')
    print(f'Apple toolchain: {xcode}; iOS SDK {sdk}')


def main():
    package = json.loads((ROOT / 'package.json').read_text())
    version = package['version']
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    versions = [lock['version'], lock['packages']['']['version'],
                json.loads((ROOT / 'desktop/src-tauri/tauri.conf.json').read_text())['version'],
                tomllib.loads((ROOT / 'desktop/src-tauri/Cargo.toml').read_text())['package']['version']]
    cargo = tomllib.loads((ROOT / 'desktop/src-tauri/Cargo.lock').read_text())
    versions += [p['version'] for p in cargo['package'] if p['name'] == 'orbit-companion']
    project = (ROOT / 'Scheduler.xcodeproj/project.pbxproj').read_text()
    versions += re.findall(r'MARKETING_VERSION = ([\d.]+);', project)
    if len(versions) != 7 or any(v != version for v in versions):
        raise ValueError(f'Version mismatch: package={version}; manifests={versions}')
    privacy = plistlib.loads((ROOT / 'Scheduler/PrivacyInfo.xcprivacy').read_bytes())
    reasons = {r['NSPrivacyAccessedAPIType']: r['NSPrivacyAccessedAPITypeReasons']
               for r in privacy['NSPrivacyAccessedAPITypes']}
    if 'CA92.1' not in reasons.get('NSPrivacyAccessedAPICategoryUserDefaults', []):
        raise ValueError('App-only UserDefaults reason CA92.1 missing')
    if privacy['NSPrivacyTracking'] or privacy['NSPrivacyCollectedDataTypes']:
        raise ValueError('Offline privacy declarations do not match this beta')
    check_bundle((ROOT / 'Scheduler/Application.html').read_text(encoding='utf-8'))
    if '--sdk' in sys.argv:
        check_sdk()
    print(f'iPhone source/bundle checks passed; all version manifests agree on {version}.')
    print('Native compilation, device behavior, signing and Apple review are separate checks.')


if __name__ == '__main__':
    main()
