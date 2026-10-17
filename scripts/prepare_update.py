"""Stage signed updater assets locally. Never publishes or reads a private key."""
from pathlib import Path
import datetime
import hashlib
import json
import shutil

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'desktop/src-tauri/tauri.conf.json').read_text())['version']
name = f'Orbiter_{version}_x64-setup.exe'
bundle = root / 'build/desktop-target-040/release/bundle/nsis'
installer = bundle / name
signature = bundle / (name + '.sig')
if not installer.is_file() or not signature.is_file():
    raise SystemExit('Missing installer/signature. Run scripts/build_update.ps1 with the original signing key.')
out = root / 'build/release'
out.mkdir(parents=True, exist_ok=True)
for source in (installer, signature):
    shutil.copyfile(source, out / source.name)
shutil.copyfile(installer, out / 'Orbiter Setup.exe')
notes_path = root / f'docs/RELEASE-{version}.md'
notes = notes_path.read_text(encoding='utf-8') if notes_path.exists() else f'Orbiter {version}'
manifest = {'version': version, 'notes': notes,
            'pub_date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'platforms': {'windows-x86_64': {
                'url': f'https://github.com/kg-sato/Orbiter/releases/download/v{version}/{name}',
                'signature': signature.read_text().strip()}}}
(out / 'latest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
(out / 'SHA256SUMS.txt').write_text('\n'.join(f'{hashlib.sha256((out / file).read_bytes()).hexdigest()}  {file}' for file in [name, name+'.sig', 'latest.json'])+'\n')
print(f'Staged Orbiter {version} installer, updater signature, latest.json and checksums in build/release. Nothing published.')
