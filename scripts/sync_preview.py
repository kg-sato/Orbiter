"""Generate the isolated student design preview from the canonical application."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'Application.html').read_text(encoding='utf-8')
source = re.sub(r'<link\s+rel="(?:manifest|apple-touch-icon)"[^>]*>\s*', '', source)
preview = source.replace('<html lang="en">', '<html lang="en" data-preview="true">', 1)
preview = preview.replace('<title>Scheduler</title>', '<title>Scheduler · Study edition preview</title>', 1)
# The preview lives two levels below the canonical page. Keep every external
# web resource rooted at the shared production assets, including cloud and CSS.
preview = re.sub(r'((?:src|href)=["\'])\./web/', r'\1../../web/', preview)

target = root / 'design' / 'scheduler-ui-preview' / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(preview, encoding='utf-8')
print('Synced the isolated, fictional student preview.')
