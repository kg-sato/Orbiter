"""Serve only Scheduler's public UI for devices on the same local network."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = {
    "Application.html", "manifest.webmanifest", "sw.js",
    "design/scheduler-ui-preview/index.html", "web/account-sync.js", "web/cloud-sync.js", "web/account.css",
    "web/study-companion.html", "web/study-companion.js", "web/glass.css",
    "web/lake-transitions.js", "web/lake-transitions.css",
    "design/lake-transitions/index.html", "design/lake-transitions/scene.js",
    "web/pond/tidal-night.jpg", "web/pond/lunar-mist.jpg", "web/pond/opal-dawn.jpg",
}

class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        requested = unquote(urlsplit(self.path).path).lstrip("/")
        if not requested:
            requested = "Application.html"
        elif requested == "design/scheduler-ui-preview/":
            requested += "index.html"
        target = (ROOT / requested).resolve()
        # Restrict both URL names and resolved paths; never expose repository files.
        allowed = requested in PUBLIC_FILES or (
            requested.startswith("web/icons/") and target.suffix in {".png", ".svg", ".ico"}
        )
        if not allowed or not target.is_relative_to(ROOT) or not target.is_file():
            self.send_error(404, "Not found")
            return None
        self.path = "/" + requested
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8003)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), AppHandler)
    print(f"Scheduler local preview on port {args.port}. Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
