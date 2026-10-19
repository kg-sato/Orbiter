"""Loopback-only review server; preserve the production server's exact file allowlist."""
import sys
from pathlib import Path
from http.server import ThreadingHTTPServer

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root))
from scripts.serve_local import AppHandler, PUBLIC_FILES

PUBLIC_FILES.update('design/living-pond/' + name for name in [
    'index.html', 'bundle.js', 'preview.css', 'transitions.css',
    'stills/tidal-night.jpg', 'stills/lunar-mist.jpg', 'stills/opal-dawn.jpg',
])
if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 18868
    with ThreadingHTTPServer(('127.0.0.1', port), AppHandler) as server:
        print(f'Living pond review: http://127.0.0.1:{port}/design/living-pond/index.html', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
