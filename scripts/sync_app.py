"""Generate the self-contained offline iPhone beta from canonical HTML.

Windows/browser accounts remain unchanged. iPhone authentication needs a separate
reviewed callback flow before cloud code can be included in this bundle.
"""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'Application.html').read_text(encoding='utf-8')
source = re.sub(r'<link\s+rel="(?:manifest|apple-touch-icon)"[^>]*>\s*', '', source)
for script in ('cloud-sync.js', 'account-sync.js'):
    tag = f'<script src="./web/{script}" defer></script>'
    if source.count(tag) != 1:
        raise ValueError(f'Expected one canonical {script} reference')
    source = re.sub(r'(?m)^[ \t]*' + re.escape(tag) + r'[ \t]*\n?', '', source)
css_tag = '<link rel="stylesheet" href="./web/account.css">'
if source.count(css_tag) != 1:
    raise ValueError('Expected one canonical account stylesheet reference')
source = source.replace(css_tag, '<style>' + (root / 'web/account.css').read_text(encoding='utf-8') + '</style>')
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
offline_section = f'''<section class="account-entry" aria-label="iPhone storage and privacy">
        <p><strong>Orbiter {version} · Offline iPhone beta</strong></p>
        <p>Your study data stays on this iPhone. Account sync is unavailable in this beta.
        Use Export and Import in the workspace menu to transfer a JSON copy with Files.</p>
        <details id="iphone-privacy"><summary>Privacy and your data</summary>
        <p>This iPhone build sends no study data to the developer and includes no analytics,
        advertising or tracking. Your schedule, notes, focus history and preferences are stored
        locally. iOS device backups may include app data according to your device settings.</p>
        <p>Files exports go only to the location you choose, which may be iCloud Drive or another
        provider. Import replaces your workspace after validation; export a backup first.
        Deleting the app can delete its local data. Keep a separate JSON backup.</p>
        <p>Optional focus reminders use local iOS notifications, with your permission.
        Notification permission can be changed in iPhone Settings. No account is required.</p>
        </details></section>'''
source, count = re.subn(r'<section class="account-entry" aria-label="Account sync">.*?</section>',
                       lambda _: offline_section, source, count=1, flags=re.S)
if count != 1:
    raise ValueError('Expected canonical account entry')
# Deny network connections independently of UI state. Embedded GLB loading uses
# data/blob fetches, so those local schemes remain available to the renderer.
policy = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
          "img-src data: blob:; font-src data:; connect-src data: blob:; "
          "base-uri 'none'; form-action 'none'")
source = source.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="' + policy + '">', 1)
(root / 'Scheduler' / 'Application.html').write_text(source, encoding='utf-8')
print(f'Generated offline iPhone bundle {version}; accounts excluded, network denied.')
