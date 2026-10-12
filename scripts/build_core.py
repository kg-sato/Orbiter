"""Compile the typed core and embed it before the app; generated copies stay offline."""
from pathlib import Path
import re
import hashlib
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
subprocess.run(['node', str(root / 'node_modules/typescript/bin/tsc'), '-p', str(root / 'tsconfig.json')], cwd=root, check=True)
app = root / 'Application.html'
source = app.read_text(encoding='utf-8')
javascript = (root / 'build/study-core.js').read_text(encoding='utf-8')
block = '<!-- Generated from src/study-core.ts; run npm run build:core. -->\n<script id="study-core">\n' + javascript + '\n</script>'
pattern = r'<!-- Generated from src/study-core.ts; run npm run build:core\. -->\s*<script id="study-core">.*?</script>'
if re.search(pattern, source, re.S):
    source = re.sub(pattern, lambda _: block, source, flags=re.S)
else:
    source = source.replace('    <script>\n', block + '\n    <script>\n', 1)
app.write_text(source, encoding='utf-8')
for name in ['sync_app.py', 'sync_preview.py']:
    subprocess.run([sys.executable, str(root / 'scripts' / name)], cwd=root, check=True)

# A content-based shell version lets hosted offline clients discover each build.
worker = root / 'sw.js'
if worker.exists():
    digest = hashlib.sha256(app.read_bytes() + (root / 'web/account-sync.js').read_bytes() + (root / 'web/study-companion.html').read_bytes() + (root / 'web/study-companion.js').read_bytes()).hexdigest()[:16]
    text = worker.read_text(encoding='utf-8')
    text = re.sub(r'const SHELL_VERSION = "[^"]*";', 'const SHELL_VERSION = "' + digest + '";', text)
    worker.write_text(text, encoding='utf-8')
