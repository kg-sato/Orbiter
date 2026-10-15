"""Local-development account server. Loopback only; use a reviewed HTTPS deployment for devices."""
import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from http.cookies import SimpleCookie
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from serve_local import AppHandler, ROOT

DATA_DIR = Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'Scheduler' / 'server'
DB_PATH = DATA_DIR / 'accounts.sqlite3'
SESSION_SECONDS = 12 * 60 * 60
MAX_BODY = 2 * 1024 * 1024
AUTH_LOCK = threading.Lock()
ATTEMPTS = {}
HASH_LOCK = threading.Semaphore(2)


def connect():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db


def initialize():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE,
          salt BLOB NOT NULL, password_hash BLOB NOT NULL, created INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          csrf TEXT NOT NULL, expires INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workspaces (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          payload TEXT NOT NULL, revision INTEGER NOT NULL, updated INTEGER NOT NULL
        );
        ''')


def password_hash(password, salt):
    with HASH_LOCK:
        return hashlib.scrypt(password.encode('utf-8'), salt=salt,
                              n=131072, r=8, p=1, maxmem=256 * 1024 * 1024)


def digest(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


CSP_LOCK = threading.Lock()
CSP_CACHE = None


def current_script_policy():
    """Refresh approved inline hashes when public HTML changes during development."""
    global CSP_CACHE
    pages = (ROOT / 'Application.html', ROOT / 'design/scheduler-ui-preview/index.html')
    signature = tuple((page.stat().st_mtime_ns, page.stat().st_size) for page in pages)
    with CSP_LOCK:
        if CSP_CACHE and CSP_CACHE[0] == signature:
            return CSP_CACHE[1]
        hashes = set()
        for page in pages:
            for script in re.findall(r'<script\b[^>]*>(.*?)</script>', page.read_text(encoding='utf-8'), re.S):
                hashes.add("'sha256-" + base64.b64encode(hashlib.sha256(script.encode()).digest()).decode() + "'")
        policy = ("default-src 'self'; script-src 'self' " + ' '.join(sorted(hashes)) +
                  "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://oymssinpmiqzyyuiwjpn.supabase.co wss://oymssinpmiqzyyuiwjpn.supabase.co; "
                  "object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        CSP_CACHE = (signature, policy)
        return policy


class AccountHandler(AppHandler):
    server_version = 'Scheduler'
    sys_version = ''

    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def end_headers(self):
        # Inline scripts are authorized by content hash; event-handler attributes remain blocked.
        self.send_header('Content-Security-Policy', current_script_policy())
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        super().end_headers()

    def host_ok(self):
        return self.headers.get('Host', '') in self.server.hosts

    def reply(self, code, data, cookie=None):
        encoded = json.dumps(data, ensure_ascii=True).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(encoded)

    def session(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
            token = cookie['scheduler_session'].value
            if len(token) > 128:
                return None
        except (KeyError, ValueError):
            return None
        with connect() as db:
            row = db.execute('''SELECT sessions.*, users.username FROM sessions
              JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?''',
              (digest(token), int(time.time()))).fetchone()
        return row

    def new_session(self, user_id):
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        now = int(time.time())
        with connect() as db:
            db.execute('DELETE FROM sessions WHERE expires<=?', (now,))
            db.execute('INSERT INTO sessions VALUES (?,?,?,?)',
                       (digest(token), user_id, csrf, now + SESSION_SECONDS))
        # HTTP is permitted exclusively on loopback. Production must use HTTPS + Secure cookies.
        return csrf, f'scheduler_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_SECONDS}'

    def do_HEAD(self):
        if not self.host_ok():
            self.send_error(403)
            return
        super().do_HEAD()

    def do_GET(self):
        if not self.host_ok():
            self.reply(403, {'error': 'Unrecognized host.'})
            return
        route = urlsplit(self.path).path
        if not route.startswith('/api/'):
            super().do_GET()
            return
        session = self.session()
        if route == '/api/session':
            self.reply(200, {'username': session['username'] if session else None,
                             'csrf': session['csrf'] if session else None})
        elif route == '/api/workspace':
            if not session:
                self.reply(401, {'error': 'Sign in to continue.'})
                return
            with connect() as db:
                row = db.execute('SELECT * FROM workspaces WHERE user_id=?', (session['user_id'],)).fetchone()
            self.reply(200, {'revision': row['revision'] if row else 0,
                             'data': json.loads(row['payload']) if row else None,
                             'updated': row['updated'] if row else None})
        else:
            self.reply(404, {'error': 'Not found.'})

    def do_POST(self):
        origin = self.headers.get('Origin', '')
        if not self.host_ok() or origin != 'http://' + self.headers.get('Host', ''):
            self.reply(403, {'error': 'Request origin rejected.'})
            return
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            self.reply(415, {'error': 'JSON is required.'})
            return
        if self.headers.get('Transfer-Encoding'):
            self.reply(400, {'error': 'Unsupported request encoding.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 2 or length > MAX_BODY:
                self.reply(413, {'error': 'Request must be smaller than 2 MB.'})
                return
            data = json.loads(self.rfile.read(length), parse_constant=lambda value: (_ for _ in ()).throw(ValueError()))
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, UnicodeError, RecursionError):
            self.reply(400, {'error': 'Invalid request.'})
            return
        route = urlsplit(self.path).path
        try:
            if route in ('/api/register', '/api/login'):
                self.authenticate(route, data)
                return
            session = self.session()
            if not session:
                self.reply(401, {'error': 'Sign in to continue.'})
                return
            if not hmac.compare_digest(self.headers.get('X-CSRF-Token', ''), session['csrf']):
                self.reply(403, {'error': 'Reload your account session and try again.'})
                return
            if route == '/api/logout':
                with connect() as db:
                    db.execute('DELETE FROM sessions WHERE token_hash=?', (session['token_hash'],))
                self.reply(200, {'ok': True}, 'scheduler_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
            elif route == '/api/workspace':
                self.save_workspace(session, data)
            else:
                self.reply(404, {'error': 'Not found.'})
        except sqlite3.Error:
            self.reply(503, {'error': 'Account storage is unavailable. Your local schedule is unchanged.'})

    def authenticate(self, route, data):
        username, password = data.get('username'), data.get('password')
        if not isinstance(username, str) or not re.fullmatch(r'[a-zA-Z0-9_.-]{3,40}', username):
            self.reply(400, {'error': 'Use a username of 3-40 letters, numbers, dots, dashes or underscores.'})
            return
        if not isinstance(password, str) or not 15 <= len(password) <= 128:
            self.reply(400, {'error': 'Use a password or passphrase of 15-128 characters.'})
            return
        username = username.lower()
        now = time.time()
        # Local development gate: bounded requests before expensive password work.
        with AUTH_LOCK:
            recent = [t for t in ATTEMPTS.get(self.client_address[0], []) if now-t < 300]
            if len(recent) >= 10:
                self.reply(429, {'error': 'Too many sign-in attempts. Wait five minutes.'})
                return
            recent.append(now)
            ATTEMPTS[self.client_address[0]] = recent
        with connect() as db:
            user = db.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
            salt = user['salt'] if user else secrets.token_bytes(32)
            hashed = password_hash(password, salt)
            if route == '/api/register':
                if user:
                    self.reply(409, {'error': 'Unable to create this account. Try another username or sign in.'})
                    return
                cursor = db.execute('INSERT INTO users(username,salt,password_hash,created) VALUES (?,?,?,?)',
                                    (username, salt, hashed, int(now)))
                user_id = cursor.lastrowid
            else:
                if not user or not hmac.compare_digest(hashed, user['password_hash']):
                    self.reply(401, {'error': 'Username or password was not accepted.'})
                    return
                user_id = user['id']
        # Rotate the current browser session when signing into another account.
        previous = self.session()
        if previous:
            with connect() as db:
                db.execute('DELETE FROM sessions WHERE token_hash=?', (previous['token_hash'],))
        csrf, cookie = self.new_session(user_id)
        self.reply(200, {'username': username, 'csrf': csrf}, cookie)

    def save_workspace(self, session, data):
        workspace, revision = data.get('data'), data.get('revision')
        if (not isinstance(workspace, dict) or not isinstance(workspace.get('template'), list)
                or not isinstance(workspace.get('weeks'), dict) or type(revision) is not int or revision < 0):
            self.reply(400, {'error': 'Invalid workspace or revision.'})
            return
        payload = json.dumps(workspace, ensure_ascii=True, allow_nan=False)
        if len(payload.encode()) > MAX_BODY:
            self.reply(413, {'error': 'Workspace exceeds the 2 MB limit.'})
            return
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT revision FROM workspaces WHERE user_id=?', (session['user_id'],)).fetchone()
            current = old['revision'] if old else 0
            if revision != current:
                self.reply(409, {'error': 'Another device saved a newer version. Load that account version before saving again.'})
                return
            db.execute('''INSERT INTO workspaces VALUES (?,?,?,?) ON CONFLICT(user_id)
              DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated=excluded.updated''',
              (session['user_id'], payload, current+1, int(time.time())))
        self.reply(200, {'revision': current+1})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8003)
    args = parser.parse_args()
    initialize()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), AccountHandler)
    server.hosts = {f'127.0.0.1:{args.port}', f'localhost:{args.port}'}
    print(f'Scheduler accounts: http://127.0.0.1:{args.port}/Application.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
