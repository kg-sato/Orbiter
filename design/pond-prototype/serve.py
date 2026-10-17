"""Serve only the review prototype on loopback. No application/data endpoints."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parent
class Preview(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        relative=unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        target=(ROOT/relative).resolve()
        if not target.is_relative_to(ROOT) or target.suffix not in {'.html','.js','.css','.png','.webm','.md'} or not target.is_file():
            self.send_error(404);return
        super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
if __name__=='__main__':
    try:
        server=ThreadingHTTPServer(('127.0.0.1',18865),Preview)
        print('Orbiter pond review: http://127.0.0.1:18865/\nClose this window to stop. Production Orbiter is unchanged.',flush=True)
        server.serve_forever()
    except OSError as error:print(f'Could not start the local preview on port 18865: {error}',flush=True)
