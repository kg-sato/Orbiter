//! Authenticated loopback workspace. This is never a LAN server or a native-command gateway.
use crate::engine::Backend;
use axum::{
    body::Body,
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Response,
    },
    routing::{get, post},
    Json, Router,
};
use futures_util::StreamExt;
use rand::RngCore;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio_stream::wrappers::BroadcastStream;
pub const ORIGIN: &str = "http://127.0.0.1:18743";
pub struct Access {
    pub backend: Arc<Backend>,
    grants: Mutex<HashMap<String, Instant>>,
    sessions: Mutex<HashMap<String, (String, Instant)>>,
    attempts: Mutex<(Instant, u32)>,
}
pub fn token() -> String {
    let mut b = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut b);
    b.iter().map(|b| format!("{b:02x}")).collect()
}
impl Access {
    pub fn new(backend: Arc<Backend>) -> Arc<Self> {
        Arc::new(Self {
            backend,
            grants: Mutex::new(HashMap::new()),
            sessions: Mutex::new(HashMap::new()),
            attempts: Mutex::new((Instant::now(), 0)),
        })
    }
    pub fn link(&self) -> String {
        let t = token();
        let mut g = self.grants.lock().unwrap();
        g.retain(|_, at| at.elapsed() < Duration::from_secs(60));
        g.insert(t.clone(), Instant::now());
        format!("{ORIGIN}/#pair={t}")
    }
}
fn failure(status: StatusCode, message: &str) -> Response {
    (status, Json(json!({"error":message}))).into_response()
}
async fn guard(State(access): State<Arc<Access>>, req: Request<Body>, next: Next) -> Response {
    let host = req.headers().get("host").and_then(|v| v.to_str().ok());
    if host != Some("127.0.0.1:18743") {
        return failure(StatusCode::FORBIDDEN, "Invalid host");
    }
    let path = req.uri().path();
    let api = path.starts_with("/api/");
    let write = req.method() != axum::http::Method::GET;
    if api {
        if req.headers().get("origin").is_some_and(|v| v != ORIGIN)
            || (write && req.headers().get("origin").and_then(|v| v.to_str().ok()) != Some(ORIGIN))
        {
            return failure(StatusCode::FORBIDDEN, "Invalid origin");
        }
        let mut rate = access.attempts.lock().unwrap();
        if rate.0.elapsed() > Duration::from_secs(60) {
            *rate = (Instant::now(), 0)
        }
        rate.1 += 1;
        if rate.1 > 600 {
            return failure(StatusCode::TOO_MANY_REQUESTS, "Too many requests");
        };
        drop(rate);
        if path != "/api/pair" {
            let cookie = req
                .headers()
                .get("cookie")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| {
                    s.split(';')
                        .find_map(|c| c.trim().strip_prefix("orbit_local="))
                });
            let mut sessions = access.sessions.lock().unwrap();
            sessions.retain(|_, (_, t)| t.elapsed() < Duration::from_secs(43200));
            let Some((csrf, _)) = cookie.and_then(|c| sessions.get(c)) else {
                return failure(
                    StatusCode::UNAUTHORIZED,
                    "Open Scheduler from the companion tray to pair this browser.",
                );
            };
            if write
                && req
                    .headers()
                    .get("x-orbit-csrf")
                    .and_then(|v| v.to_str().ok())
                    != Some(csrf.as_str())
            {
                return failure(StatusCode::FORBIDDEN, "Invalid request token");
            }
        }
        if write
            && !req
                .headers()
                .get("content-type")
                .and_then(|v| v.to_str().ok())
                .is_some_and(|v| v.starts_with("application/json"))
        {
            return failure(StatusCode::UNSUPPORTED_MEDIA_TYPE, "JSON required");
        }
    }
    let mut response = next.run(req).await;
    let h = response.headers_mut();
    h.insert("cache-control", HeaderValue::from_static("no-store"));
    h.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    h.insert("x-frame-options", HeaderValue::from_static("DENY"));
    h.insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    response
}
async fn pair(State(a): State<Arc<Access>>, Json(v): Json<Value>) -> Response {
    let grant = v["token"].as_str().unwrap_or("");
    let valid = a
        .grants
        .lock()
        .unwrap()
        .remove(grant)
        .is_some_and(|at| at.elapsed() < Duration::from_secs(60));
    if !valid {
        return failure(
            StatusCode::UNAUTHORIZED,
            "Pairing link expired. Open Scheduler from the tray again.",
        );
    }
    let session = token();
    let csrf = token();
    a.sessions
        .lock()
        .unwrap()
        .insert(session.clone(), (csrf.clone(), Instant::now()));
    let mut r = Json(json!({"csrf":csrf})).into_response();
    r.headers_mut().insert(
        "set-cookie",
        HeaderValue::from_str(&format!(
            "orbit_local={session}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200"
        ))
        .unwrap(),
    );
    r
}
async fn snapshot(State(a): State<Arc<Access>>, h: HeaderMap) -> Json<Value> {
    let mut v = a.backend.snapshot();
    let session = h.get("cookie").and_then(|v| v.to_str().ok()).and_then(|s| {
        s.split(';')
            .find_map(|c| c.trim().strip_prefix("orbit_local="))
    });
    v["csrf"] = json!(session.and_then(|c| a.sessions.lock().unwrap().get(c).map(|s| s.0.clone())));
    Json(v)
}
async fn save(State(a): State<Arc<Access>>, Json(v): Json<Value>) -> Response {
    match v["revision"]
        .as_u64()
        .ok_or("Missing revision".to_string())
        .and_then(|r| {
            a.backend
                .save_workspace(v["workspace"].clone(), r, v["import"] == true)
        }) {
        Ok(s) => Json(s).into_response(),
        Err(e) => failure(
            if e.starts_with("Conflict") {
                StatusCode::CONFLICT
            } else {
                StatusCode::BAD_REQUEST
            },
            &e,
        ),
    }
}
async fn action(State(a): State<Arc<Access>>, Json(v): Json<Value>) -> Response {
    let action = v["action"].as_str().unwrap_or("");
    if action == "show-buddy" {
        let app = a.backend.app.lock().unwrap().clone();
        return match app
            .ok_or("Orbit is unavailable".to_string())
            .and_then(|app| crate::show_buddy(&app))
        {
            Ok(()) => Json(a.backend.snapshot()).into_response(),
            Err(e) => failure(StatusCode::BAD_REQUEST, &e),
        };
    }
    if !["start", "pause", "toggle", "finish", "configure"].contains(&action) {
        return failure(
            StatusCode::FORBIDDEN,
            "Action is unavailable to browser clients",
        );
    };
    match a.backend.action(action, v["args"].clone()) {
        Ok(s) => Json(s).into_response(),
        Err(e) => failure(StatusCode::BAD_REQUEST, &e),
    }
}
async fn events(State(a): State<Arc<Access>>) -> impl IntoResponse {
    let stream = BroadcastStream::new(a.backend.changes.subscribe()).map(|v| {
        Ok::<_, std::convert::Infallible>(
            Event::default().data(v.map_or("refresh".to_string(), |r| r.to_string())),
        )
    });
    Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(30)))
}
const APP: &str = include_str!("../assets/Application.html");
async fn asset(req: Request<Body>) -> Response {
    let (content, kind) = match req.uri().path() {
        "/" | "/Application.html" => (APP.as_bytes(), "text/html; charset=utf-8"),
        "/desktop-sync.js" => (
            include_bytes!("../assets/desktop-sync.js").as_slice(),
            "text/javascript",
        ),
        "/web/account-sync.js" => (
            b"/* Desktop workspace is local, not a cloud account. */".as_slice(),
            "text/javascript",
        ),
        "/web/icons/orbit-192.png" => (
            include_bytes!("../../../web/icons/orbit-192.png").as_slice(),
            "image/png",
        ),
        "/web/icons/orbit-512.png" => (
            include_bytes!("../../../web/icons/orbit-512.png").as_slice(),
            "image/png",
        ),
        "/favicon.ico" => (
            include_bytes!("../icons/icon.ico").as_slice(),
            "image/x-icon",
        ),
        "/web/icons/orbit-180.png" => (
            include_bytes!("../../../web/icons/orbit-180.png").as_slice(),
            "image/png",
        ),
        _ => return failure(StatusCode::NOT_FOUND, "Not found"),
    };
    let mut response = ([("content-type", kind)], content.to_vec()).into_response();
    if kind.starts_with("text/html") {
        use std::sync::OnceLock;
        static CSP: OnceLock<String> = OnceLock::new();
        let policy=CSP.get_or_init(||{
            // Authorize only the bundled inline scripts, never user-supplied markup.
            let mut hashes=String::new();let mut rest=APP;
            while let Some(start)=rest.find("<script") {rest=&rest[start..];let Some(end)=rest.find('>') else{break};let tag=&rest[..end];rest=&rest[end+1..];let Some(close)=rest.find("</script>") else{break};if !tag.contains("src="){let normalized=rest[..close].replace("\r\n","\n").replace('\r',"\n");let digest=Sha256::digest(normalized.as_bytes());hashes.push_str(&format!(" 'sha256-{}'",base64(&digest)));}rest=&rest[close+9..];}
            format!("default-src 'self'; script-src 'self'{hashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'")
        });
        response.headers_mut().insert(
            "content-security-policy",
            HeaderValue::from_str(policy).unwrap(),
        );
    }
    response
}
fn base64(bytes: &[u8]) -> String {
    const A: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for c in bytes.chunks(3) {
        let n = ((c[0] as u32) << 16)
            | ((c.get(1).copied().unwrap_or(0) as u32) << 8)
            | c.get(2).copied().unwrap_or(0) as u32;
        for (i, shift) in [18, 12, 6, 0].iter().enumerate() {
            out.push(if i > c.len() {
                '='
            } else {
                A[((n >> shift) & 63) as usize] as char
            });
        }
    }
    out
}
fn router(access: Arc<Access>) -> Router {
    let app = Router::new()
        .route("/api/pair", post(pair))
        .route("/api/state", get(snapshot))
        .route("/api/workspace", post(save))
        .route("/api/action", post(action))
        .route("/api/events", get(events))
        .fallback(asset)
        .layer(DefaultBodyLimit::max(2 * 1024 * 1024 + 1024))
        .layer(middleware::from_fn_with_state(access.clone(), guard))
        .with_state(access.clone());
    app
}
pub async fn serve(access: Arc<Access>) {
    let app = router(access.clone());
    match tokio::net::TcpListener::bind("127.0.0.1:18743").await {
        Ok(listener) => {
            if let Err(e) = axum::serve(listener, app).await {
                *access.backend.local_error.lock().unwrap() = Some(e.to_string());
                access.backend.changed();
            }
        }
        Err(e) => {
            *access.backend.local_error.lock().unwrap()=Some(format!("Local website unavailable: port 18743 could not open ({e}). The buddy still works offline."));
            access.backend.changed();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tower::ServiceExt;
    async fn call(
        app: &Router,
        path: &str,
        body: Option<Value>,
        cookie: Option<&str>,
        csrf: Option<&str>,
        origin: Option<&str>,
    ) -> Response {
        let mut req = Request::builder()
            .uri(path)
            .header("Host", "127.0.0.1:18743");
        if let Some(v) = cookie {
            req = req.header("Cookie", v)
        }
        if let Some(v) = csrf {
            req = req.header("X-Orbit-CSRF", v)
        }
        if let Some(v) = origin {
            req = req.header("Origin", v)
        }
        let req = if let Some(b) = body {
            req.method("POST")
                .header("Content-Type", "application/json")
                .body(Body::from(b.to_string()))
                .unwrap()
        } else {
            req.body(Body::empty()).unwrap()
        };
        app.clone().oneshot(req).await.unwrap()
    }
    #[tokio::test]
    async fn pairing_csrf_and_asset_boundary() {
        let b = Backend::open(std::env::temp_dir().join(format!("orbit-test-server-{}", token())))
            .unwrap();
        let a = Access::new(b);
        let app = router(a.clone());
        assert_eq!(
            call(&app, "/api/state", None, None, None, None)
                .await
                .status(),
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            call(&app, "/orbit.sqlite3", None, None, None, None)
                .await
                .status(),
            StatusCode::NOT_FOUND
        );
        let link = a.link();
        let grant = link.split("#pair=").nth(1).unwrap();
        assert_eq!(
            call(
                &app,
                "/api/pair",
                Some(json!({"token":grant})),
                None,
                None,
                Some("https://evil.example")
            )
            .await
            .status(),
            StatusCode::FORBIDDEN
        );
        let paired = call(
            &app,
            "/api/pair",
            Some(json!({"token":grant})),
            None,
            None,
            Some(ORIGIN),
        )
        .await;
        assert_eq!(paired.status(), StatusCode::OK);
        let cookie = paired.headers()["set-cookie"]
            .to_str()
            .unwrap()
            .split(';')
            .next()
            .unwrap()
            .to_owned();
        let body: Value = serde_json::from_slice(
            &axum::body::to_bytes(paired.into_body(), 1024)
                .await
                .unwrap(),
        )
        .unwrap();
        let csrf = body["csrf"].as_str().unwrap();
        assert_eq!(
            call(
                &app,
                "/api/pair",
                Some(json!({"token":grant})),
                None,
                None,
                Some(ORIGIN)
            )
            .await
            .status(),
            StatusCode::UNAUTHORIZED
        );
        assert_eq!(
            call(&app, "/api/state", None, Some(&cookie), None, None)
                .await
                .status(),
            StatusCode::OK
        );
        assert_eq!(
            call(
                &app,
                "/api/action",
                Some(json!({"action":"start","args":{}})),
                Some(&cookie),
                None,
                Some(ORIGIN)
            )
            .await
            .status(),
            StatusCode::FORBIDDEN
        );
        assert_eq!(
            call(
                &app,
                "/api/action",
                Some(json!({"action":"chest","args":{}})),
                Some(&cookie),
                Some(csrf),
                Some(ORIGIN)
            )
            .await
            .status(),
            StatusCode::FORBIDDEN
        );
        assert_eq!(
            call(
                &app,
                "/api/action",
                Some(json!({"action":"start","args":{}})),
                Some(&cookie),
                Some(csrf),
                Some(ORIGIN)
            )
            .await
            .status(),
            StatusCode::OK
        );
    }
}
