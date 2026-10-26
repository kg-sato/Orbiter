"""Prepare the exact current production renderer for an isolated art comparison."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
source = (ROOT / 'Application.html').read_text(encoding='utf-8')
match = re.search(r'<script id="orbiter-cats">\s*(.*?)\s*</script>', source, re.S)
if not match:
    raise ValueError('Canonical embedded kitten renderer is missing')
# Keep the experimental view from rotating the real application's saved last-cat key.
code = match.group(1).replace('orbiter.last-cat', 'orbiter.trial.last-cat')
target = ROOT / 'build/companion-lite/live-cat.js'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(code, encoding='utf-8')
print('Prepared isolated production renderer under build/companion-lite/.')
