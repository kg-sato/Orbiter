"""Build an isolated moving study from the already bundled original pond and cat."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
app=(root/'Application.html').read_text(encoding='utf-8')
parts=[]
for identifier in ['orbiter-scene-controller','orbiter-cats']:
    match=re.search(r'<script id="'+identifier+r'">(.*?)</script>',app,re.S)
    if not match: raise SystemExit('Missing bundled scene: '+identifier)
    parts.append(match.group(1))
(Path(__file__).parent/'scene.js').write_text('\n'.join(parts),encoding='utf-8')
print('Prepared original pond and cat for isolated transition preview.')
