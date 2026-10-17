"""Compile the typed core and embed it before the app; generated copies stay offline."""
from pathlib import Path
import re
import hashlib
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
subprocess.run(['node', str(root / 'node_modules/typescript/bin/tsc'), '-p', str(root / 'tsconfig.json')], cwd=root, check=True)
subprocess.run(['node', str(root / 'scripts/build_cat.cjs')], cwd=root, check=True)
subprocess.run(['node', str(root / 'scripts/build_cloud.cjs')], cwd=root, check=True)
app = root / 'Application.html'
source = app.read_text(encoding='utf-8')
javascript = (root / 'build/study-core.js').read_text(encoding='utf-8')
block = '<!-- Generated from src/study-core.ts; run npm run build:core. -->\n<script id="study-core">\n' + javascript + '\n</script>'
pattern = r'<!-- Generated from src/study-core.ts; run npm run build:core\. -->\s*<script id="study-core">.*?</script>'
if re.search(pattern, source, re.S):
    source = re.sub(pattern, lambda _: block, source, flags=re.S)
else:
    source = source.replace('    <script>\n', block + '\n    <script>\n', 1)
cat = (root / 'build/orbiter-cat.js').read_text(encoding='utf-8')
cat_block = '<!-- Generated 3D cat from src/mascot/cat.js. -->\n<script id="orbiter-cats">\n' + cat + '\n</script>'
if '<script id="orbiter-cats">' in source:
    source = re.sub(r'<!-- Generated 3D cat from src/mascot/cat.js\. -->\s*<script id="orbiter-cats">.*?</script>', lambda _: cat_block, source, flags=re.S)
else:
    source = source.replace('<!-- Generated from src/study-core.ts;', cat_block + '\n<!-- Generated from src/study-core.ts;', 1)
reward_css = '<style id="orbiter-reward-styles">\n' + (root / 'web/rewards.css').read_text(encoding='utf-8') + '\n</style>'
if '<style id="orbiter-reward-styles">' in source:
    source = re.sub(r'<style id="orbiter-reward-styles">.*?</style>', lambda _: reward_css, source, flags=re.S)
else:
    source = source.replace('</head>', reward_css + '\n</head>', 1)
glass_css = '<style id="orbiter-glass-styles">\n' + (root / 'web/glass.css').read_text(encoding='utf-8') + '\n</style>'
if '<style id="orbiter-glass-styles">' in source:
    source = re.sub(r'<style id="orbiter-glass-styles">.*?</style>', lambda _: glass_css, source, flags=re.S)
else:
    source = source.replace('</head>', glass_css + '\n</head>', 1)
celestial_css = '<style id="orbiter-celestial-styles">\n' + (root / 'web/celestial.css').read_text(encoding='utf-8') + '\n</style>'
if '<style id="orbiter-celestial-styles">' in source:
    source = re.sub(r'<style id="orbiter-celestial-styles">.*?</style>', lambda _: celestial_css, source, flags=re.S)
else:
    source = source.replace('</head>', celestial_css + '\n</head>', 1)
scene_script = '<script id="orbiter-scene-controller">\n' + (root / 'web/celestial.js').read_text(encoding='utf-8') + '\n</script>'
if '<script id="orbiter-scene-controller">' in source:
    source = re.sub(r'<script id="orbiter-scene-controller">.*?</script>', lambda _: scene_script, source, flags=re.S)
else:
    source = source.replace('<!-- Generated 3D cat', scene_script + '\n<!-- Generated 3D cat', 1)
scene_art = '<div class="orbital-backdrop" aria-hidden="true">\n' + (root / 'web/celestial.svg').read_text(encoding='utf-8') + '\n</div>'
source = re.sub(r'<div class="orbital-backdrop" aria-hidden="true">.*?</div>', lambda _: scene_art, source, count=1, flags=re.S)
for resource, tag, label in [('web/refinement.css','style','orbiter-refinement-styles'),('web/cosmic.css','style','orbiter-cosmic-styles')]:
    extra = '<'+tag+' id="'+label+'">\n'+(root/resource).read_text(encoding='utf-8')+'\n</'+tag+'>'
    if 'id="'+label+'"' in source:
        source = re.sub(r'<'+tag+' id="'+label+'">.*?</'+tag+'>',lambda _:extra,source,flags=re.S)
    else: source = source.replace('</head>',extra+'\n</head>',1)
# Pond fallbacks are bundled data assets: native, browser and offline copies agree.
import base64
pond_css=(root/'web/pond.css').read_text(encoding='utf-8')
for token,name in [('TIDAL','tidal-night'),('LUNAR','lunar-mist'),('OPAL','opal-dawn')]:
    data=base64.b64encode((root/f'web/pond/{name}.jpg').read_bytes()).decode('ascii')
    pond_css=pond_css.replace('POND_STILL_'+token,'data:image/jpeg;base64,'+data)
pond_block='<style id="orbiter-pond-styles">\n'+pond_css+'\n</style>'
if 'id="orbiter-pond-styles"' in source:
    source=re.sub(r'<style id="orbiter-pond-styles">.*?</style>',lambda _:pond_block,source,flags=re.S)
else:source=source.replace('</head>',pond_block+'\n</head>',1)
app.write_text(source, encoding='utf-8')
for name in ['sync_app.py', 'sync_preview.py']:
    subprocess.run([sys.executable, str(root / 'scripts' / name)], cwd=root, check=True)

# A content-based shell version lets hosted offline clients discover each build.
worker = root / 'sw.js'
if worker.exists():
    digest = hashlib.sha256(app.read_bytes() + (root / 'web/cloud-sync.js').read_bytes() + (root / 'web/account.css').read_bytes() + (root / 'web/account-sync.js').read_bytes() + (root / 'web/study-companion.html').read_bytes() + (root / 'web/study-companion.js').read_bytes()).hexdigest()[:16]
    text = worker.read_text(encoding='utf-8')
    text = re.sub(r'const SHELL_VERSION = "[^"]*";', 'const SHELL_VERSION = "' + digest + '";', text)
    worker.write_text(text, encoding='utf-8')
