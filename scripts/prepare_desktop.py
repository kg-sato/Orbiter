"""Embed only approved Scheduler assets; generate the Windows icon without new dependencies."""
from pathlib import Path
import struct
import shutil
import re

root = Path(__file__).resolve().parent.parent
desktop = root / 'desktop/src-tauri'
(desktop / 'assets').mkdir(parents=True, exist_ok=True)
(desktop / 'icons').mkdir(parents=True, exist_ok=True)
source = (root / 'Application.html').read_text(encoding='utf-8')
source = source.replace('<head>', '<head>\n<script src="/desktop-sync.js"></script>', 1)
(desktop / 'assets/Application.html').write_text(source, encoding='utf-8')
(desktop / 'assets/desktop-sync.js').write_bytes((root / 'web/desktop-sync.js').read_bytes())
# The native window serves local bundled assets, independently of the loopback server.
native = root / 'build/native'
native.mkdir(parents=True, exist_ok=True)
(native / 'web/icons').mkdir(parents=True, exist_ok=True)
html = (root / 'Application.html').read_text(encoding='utf-8')
html = re.sub(r'<link\s+rel="(?:manifest|apple-touch-icon)"[^>]*>\s*', '', html)
html = html.replace('<head>', '<head>\n<script src="./native-adapter.js"></script>', 1)
html = html.replace('<body>', '<body data-native-mode="buddy">\n<div id="native-planner" hidden inert>', 1)
html = html.replace('</body>', '</div><orbiter-buddy></orbiter-buddy><script src="./native-shell.js"></script></body>')
html = html.replace('</head>', '<style>body[data-native-mode="buddy"]{margin:0;overflow:hidden;background:transparent!important}html:has(body[data-native-mode="buddy"]){background:transparent!important}#native-planner[hidden]{display:none!important}body[data-native-mode="buddy"] #native-planner *{animation-play-state:paused!important}</style></head>')
(native / 'Application.html').write_bytes(html.replace('\r\n','\n').replace('\r','\n').encode('utf-8'))
for name in ('native-adapter.js','native-shell.js','buddy.css'):
    shutil.copyfile(root / 'desktop/ui' / name,native / name)
shutil.copyfile(root / 'web/account-sync.js',native / 'web/account-sync.js')
shutil.copyfile(root / 'web/rewards.css',native / 'web/rewards.css')
shutil.copyfile(root / 'web/glass.css',native / 'web/glass.css')
for icon in (root / 'web/icons').glob('*'):
    shutil.copyfile(icon,native / 'web/icons' / icon.name)
png = (root / 'web/icons/orbit-192.png').read_bytes()
(desktop / 'icons/icon.png').write_bytes(png)
(desktop / 'icons/icon.ico').write_bytes(struct.pack('<HHH', 0, 1, 1) + struct.pack('<BBBBHHII', 192, 192, 0, 0, 1, 32, len(png), 22) + png)
print('Prepared bundled desktop assets and Windows icon.')
