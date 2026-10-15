"""Create an allowlisted static Pages deployment. No database, backups or repo files."""
from pathlib import Path
import shutil,zipfile,re,json
root=Path(__file__).resolve().parent.parent
output=root/'build/cloud-site'
output.mkdir(parents=True,exist_ok=True)
allowed=['Application.html','manifest.webmanifest','sw.js','web/auth-redirect.js','web/account-sync.js','web/cloud-sync.js','web/account.css','web/glass.css','web/study-companion.html','web/study-companion.js','web/icons/orbit-192.png','web/icons/orbit-512.png','web/icons/orbit-180.png']
for name in allowed:
    target=output/name
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(root/name,target)
(output/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Orbiter</title><script src="/web/auth-redirect.js"></script><a href="/Application.html">Open Orbiter</a></html>')
config=json.loads((root/'web/cloud-config.json').read_text())
host=config['url'].removeprefix('https://')
(output/'_headers').write_text(f'''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://{host} wss://{host}; worker-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
/sw.js
  Cache-Control: no-cache
/web/cloud-sync.js
  Cache-Control: no-cache
/Application.html
  Cache-Control: no-cache
''')
# A clean archive uses only the explicit list, even if output holds an old artifact.
with zipfile.ZipFile(root/'build/Orbiter-private-beta.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in allowed+['index.html','_headers']:archive.write(output/name,name)
print('Prepared build/Orbiter-private-beta.zip for Cloudflare Pages direct upload.')
