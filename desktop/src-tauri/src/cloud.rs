//! Account-owned durable sync. Native refresh credentials never enter the webview.
use crate::{
    engine::Backend,
    model::{empty_workspace, validate_workspace},
};
use rusqlite::{params, Connection};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tauri::Emitter;
type Records = BTreeMap<String, Value>;
fn key(mut parts: Value) -> String {
    if let Some(a) = parts.as_array_mut() {
        for v in a {
            if let Some(n) = v.as_f64() {
                if n.fract() == 0.0 && n.abs() < 9007199254740992.0 {
                    *v = json!(n as i64);
                }
            }
        }
    }
    parts.to_string()
}
pub fn encode(w: &Value) -> Records {
    let mut r = Records::new();
    let mut add = |parts: Value, v: &Value| {
        r.insert(key(parts), v.clone());
    };
    if let Some(a) = w["template"].as_array() {
        for v in a {
            add(json!(["template", v["id"]]), v);
        }
    }
    if let Some(o) = w["weeks"].as_object() {
        for (date, a) in o {
            add(json!(["week", date]), &json!(true));
            if let Some(a) = a.as_array() {
                for v in a {
                    add(json!(["event", date, v["id"]]), v);
                }
            }
        }
    }
    for (bucket, field, id) in [
        ("task", "tasks", "id"),
        ("course", "courses", "name"),
        ("reflection", "reflections", "week"),
    ] {
        if let Some(a) = w["study"][field].as_array() {
            for v in a {
                add(json!([bucket, v[id]]), v);
            }
        }
    }
    for (bucket, field) in [("profile", "catProfiles"), ("preference", "preferences")] {
        if let Some(o) = w["study"][field].as_object() {
            for (k, v) in o {
                add(json!([bucket, k]), v);
            }
        }
    }
    if let Some(a) = w["study"]["sessions"].as_array() {
        for (i, v) in a.iter().enumerate() {
            let p = if v.get("orbitSession").is_some() {
                json!(["session", v["orbitSession"], v["date"]])
            } else if v.get("id").is_some() {
                json!(["session", v["id"]])
            } else {
                json!([
                    "session-legacy",
                    v["date"],
                    v["minutes"],
                    v["title"],
                    v.get("taskId").unwrap_or(&Value::Null),
                    i
                ])
            };
            add(p, v);
        }
    }
    r
}
pub fn decode(r: &Records, local: &Value) -> Result<Value, String> {
    let mut w = empty_workspace();
    w["study"]["courses"] = json!([]);
    w["study"]["reflections"] = json!([]);
    w["study"]["catProfiles"] = json!({});
    w["study"]["timer"] = local["study"]["timer"].clone();
    for (k, v) in r {
        if v.is_null() {
            continue;
        }
        let p: Value = serde_json::from_str(k).map_err(|_| "Invalid cloud record")?;
        let id = p[1].as_str().unwrap_or("");
        match p[0].as_str().unwrap_or("") {
            "template" => w["template"].as_array_mut().unwrap().push(v.clone()),
            "week" => {
                if w["weeks"].get(id).is_none() {
                    w["weeks"][id] = json!([]);
                }
            }
            "event" => {
                if w["weeks"].get(id).is_none() {
                    w["weeks"][id] = json!([]);
                }
                w["weeks"][id].as_array_mut().unwrap().push(v.clone());
            }
            "task" => w["study"]["tasks"].as_array_mut().unwrap().push(v.clone()),
            "course" => w["study"]["courses"]
                .as_array_mut()
                .unwrap()
                .push(v.clone()),
            "reflection" => w["study"]["reflections"]
                .as_array_mut()
                .unwrap()
                .push(v.clone()),
            "profile" => w["study"]["catProfiles"][id] = v.clone(),
            "preference" => w["study"]["preferences"][id] = v.clone(),
            "session" | "session-legacy" => w["study"]["sessions"]
                .as_array_mut()
                .unwrap()
                .push(v.clone()),
            _ => return Err("Unsupported cloud record".into()),
        }
    }
    validate_workspace(&w)?;
    Ok(w)
}
pub fn merge(b: &Value, l: &Value, r: &Value) -> Option<Value> {
    if l == b {
        return Some(r.clone());
    }
    if r == b || l == r {
        return Some(l.clone());
    }
    if let (Some(b), Some(l), Some(r)) = (b.as_object(), l.as_object(), r.as_object()) {
        let mut out = serde_json::Map::new();
        let keys: std::collections::BTreeSet<_> =
            b.keys().chain(l.keys()).chain(r.keys()).collect();
        for k in keys {
            let v = merge(
                b.get(k).unwrap_or(&Value::Null),
                l.get(k).unwrap_or(&Value::Null),
                r.get(k).unwrap_or(&Value::Null),
            )?;
            if !v.is_null() {
                out.insert(k.clone(), v);
            }
        }
        return Some(Value::Object(out));
    }
    None
}
fn id() -> String {
    let bytes: [u8; 16] = rand::random();
    format!(
        "{:08x}-{:04x}-4{:03x}-a{:03x}-{:012x}",
        u32::from_be_bytes(bytes[0..4].try_into().unwrap()),
        u16::from_be_bytes(bytes[4..6].try_into().unwrap()),
        u16::from_be_bytes(bytes[6..8].try_into().unwrap()) & 0xfff,
        u16::from_be_bytes(bytes[8..10].try_into().unwrap()) & 0xfff,
        u64::from_be_bytes([
            0, 0, bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
        ])
    )
}

#[cfg(windows)]
fn protect(bytes: &[u8], decrypt: bool) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::{
        Foundation::LocalFree,
        Security::Cryptography::{
            CryptProtectData, CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        },
    };
    let input = CRYPT_INTEGER_BLOB {
        cbData: bytes.len() as u32,
        pbData: bytes.as_ptr() as *mut u8,
    };
    let mut out = CRYPT_INTEGER_BLOB {
        cbData: 0,
        pbData: std::ptr::null_mut(),
    };
    let ok = unsafe {
        if decrypt {
            CryptUnprotectData(
                &input,
                std::ptr::null_mut(),
                std::ptr::null(),
                std::ptr::null_mut(),
                std::ptr::null(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut out,
            )
        } else {
            CryptProtectData(
                &input,
                std::ptr::null(),
                std::ptr::null(),
                std::ptr::null_mut(),
                std::ptr::null(),
                CRYPTPROTECT_UI_FORBIDDEN,
                &mut out,
            )
        }
    };
    if ok == 0 {
        return Err("Windows could not unlock the saved account credential".into());
    }
    let result = unsafe { std::slice::from_raw_parts(out.pbData, out.cbData as usize).to_vec() };
    unsafe {
        LocalFree(out.pbData as *mut _);
    }
    Ok(result)
}
#[cfg(not(windows))]
fn protect(_: &[u8], _: bool) -> Result<Vec<u8>, String> {
    Err("Native account credentials require Windows protection".into())
}
struct CloudStore {
    db: Connection,
    session: Option<Value>,
    cache: Value,
    enabled: bool,
    message: String,
    last_send: Option<Instant>,
}
pub struct Cloud {
    backend: Arc<Backend>,
    store: Mutex<CloudStore>,
    client: reqwest::blocking::Client,
    url: String,
    api_key: String,
}
impl Cloud {
    pub fn open(backend: Arc<Backend>) -> Result<Arc<Self>, String> {
        let config: Value = serde_json::from_str(include_str!("../../../web/cloud-config.json"))
            .map_err(|e| e.to_string())?;
        let db = Connection::open(backend.dir.join("cloud.sqlite3")).map_err(|e| e.to_string())?;
        db.execute_batch("PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;CREATE TABLE IF NOT EXISTS account_cache(owner TEXT PRIMARY KEY,data TEXT NOT NULL);CREATE TABLE IF NOT EXISTS credential(id INTEGER PRIMARY KEY CHECK(id=1),cipher BLOB NOT NULL);CREATE TABLE IF NOT EXISTS device_credential(owner TEXT PRIMARY KEY,cipher BLOB NOT NULL);CREATE TABLE IF NOT EXISTS login_pending(id INTEGER PRIMARY KEY CHECK(id=1),cipher BLOB NOT NULL);").map_err(|e|e.to_string())?;
        let session = db
            .query_row("SELECT cipher FROM credential WHERE id=1", [], |r| {
                r.get::<_, Vec<u8>>(0)
            })
            .ok()
            .and_then(|b| protect(&b, true).ok())
            .and_then(|b| serde_json::from_slice::<Value>(&b).ok());
        let cache = session
            .as_ref()
            .and_then(|s| s["user"]["id"].as_str())
            .and_then(|u| {
                db.query_row("SELECT data FROM account_cache WHERE owner=?1", [u], |r| {
                    r.get::<_, String>(0)
                })
                .ok()
            })
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or(json!({"base":{},"pending":{},"conflicts":{},"enrolled":false}));
        let bound = backend
            .store
            .lock()
            .unwrap()
            .db
            .query_row("SELECT owner FROM cloud_binding WHERE id=1", [], |r| {
                r.get::<_, String>(0)
            })
            .ok();
        let enabled = cache["enrolled"].as_bool().unwrap_or(false)
            && bound.as_deref() == session.as_ref().and_then(|s| s["user"]["id"].as_str());
        Ok(Arc::new(Self {
            backend,
            store: Mutex::new(CloudStore {
                db,
                session,
                cache,
                enabled,
                message: String::new(),
                last_send: None,
            }),
            client: reqwest::blocking::Client::builder()
                .timeout(Duration::from_secs(20))
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .map_err(|e| e.to_string())?,
            url: config["url"].as_str().unwrap().into(),
            api_key: config["publishableKey"].as_str().unwrap().into(),
        }))
    }
    fn request(&self, path: &str, body: &Value, token: Option<&str>) -> Result<Value, String> {
        let mut r = self
            .client
            .post(format!("{}{}", self.url, path))
            .header("apikey", &self.api_key)
            .json(body);
        if let Some(t) = token {
            r = r.bearer_auth(t);
        }
        let response = r
            .send()
            .map_err(|_| "Cannot reach cloud. Your work is saved locally.")?;
        let status = response.status();
        let value: Value = response.json().map_err(|_| "Unexpected cloud response")?;
        if !status.is_success() {
            return Err(value["msg"]
                .as_str()
                .or(value["message"].as_str())
                .or(value["error_description"].as_str())
                .unwrap_or("Cloud request failed")
                .to_string());
        }
        Ok(value)
    }
    fn persist(&self, s: &CloudStore) -> Result<(), String> {
        if let Some(session) = &s.session {
            let owner = session["user"]["id"].as_str().ok_or("Invalid account")?;
            let cipher = protect(session.to_string().as_bytes(), false)?;
            let tx = s.db.unchecked_transaction().map_err(|e| e.to_string())?;
            tx.execute("INSERT INTO credential VALUES(1,?1) ON CONFLICT(id) DO UPDATE SET cipher=excluded.cipher",[cipher]).map_err(|e|e.to_string())?;
            tx.execute("INSERT INTO account_cache VALUES(?1,?2) ON CONFLICT(owner) DO UPDATE SET data=excluded.data",params![owner,s.cache.to_string()]).map_err(|e|e.to_string())?;
            tx.commit().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    fn token(&self, s: &mut CloudStore) -> Result<String, String> {
        let session = s.session.as_ref().ok_or("Sign in to reconnect")?;
        if session["expires_at"].as_i64().unwrap_or(0) < chrono::Utc::now().timestamp() + 90 {
            let refreshed = self.request(
                "/auth/v1/token?grant_type=refresh_token",
                &json!({"refresh_token":session["refresh_token"]}),
                None,
            )?;
            let mut refreshed = refreshed;
            if let Some(device) = session.get("device") {
                refreshed["device"] = device.clone();
            }
            s.session = Some(refreshed);
            self.persist(s)?;
        }
        Ok(s.session.as_ref().unwrap()["access_token"]
            .as_str()
            .ok_or("Session expired. Sign in again; your queue is retained.")?
            .into())
    }
    fn rpc(&self, s: &mut CloudStore, name: &str, args: Value) -> Result<Value, String> {
        let token = self.token(s)?;
        self.request(&format!("/rest/v1/rpc/{name}"), &args, Some(&token))
    }
    fn adopt_session(&self, s: &mut CloudStore, session: Value) -> Result<(), String> {
        let user = session["user"]["id"]
            .as_str()
            .ok_or("Invalid login response")?;
        let bound = self
            .backend
            .store
            .lock()
            .unwrap()
            .db
            .query_row("SELECT owner FROM cloud_binding WHERE id=1", [], |r| {
                r.get::<_, String>(0)
            })
            .ok();
        if bound.as_ref().is_some_and(|o| o != user) {
            return Err("Restore local mode before changing the saved workspace account.".into());
        }
        s.cache =
            s.db.query_row(
                "SELECT data FROM account_cache WHERE owner=?1",
                [user],
                |r| r.get::<_, String>(0),
            )
            .ok()
            .and_then(|v| serde_json::from_str(&v).ok())
            .unwrap_or(json!({"base":{},"pending":{},"conflicts":{},"enrolled":false}));
        s.enabled = false;
        s.session = Some(session);
        self.persist(s)?;
        Ok(())
    }
    fn device(&self, s: &mut CloudStore) -> Result<(), String> {
        if s.session.as_ref().unwrap().get("device").is_none() {
            let owner = s.session.as_ref().unwrap()["user"]["id"]
                .as_str()
                .unwrap()
                .to_string();
            let saved =
                s.db.query_row(
                    "SELECT cipher FROM device_credential WHERE owner=?1",
                    [&owner],
                    |r| r.get::<_, Vec<u8>>(0),
                )
                .ok()
                .and_then(|b| protect(&b, true).ok())
                .and_then(|b| serde_json::from_slice::<Value>(&b).ok());
            let device = match saved {
                Some(v) => v,
                None => self.rpc(s, "orbiter_device", json!({}))?,
            };
            let cipher = protect(device.to_string().as_bytes(), false)?;
            s.db.execute("INSERT INTO device_credential VALUES(?1,?2) ON CONFLICT(owner) DO UPDATE SET cipher=excluded.cipher",params![owner,cipher]).map_err(|e|e.to_string())?;
            s.session.as_mut().unwrap()["device"] = device;
            self.persist(s)?;
        }
        Ok(())
    }

    fn capture(&self, s: &mut CloudStore) -> Result<(), String> {
        if !s.enabled {
            return Ok(());
        }
        let workspace = self.backend.snapshot()["workspace"].clone();
        s.cache["workspace"] = workspace.clone();
        let local = encode(&workspace);
        let base = s.cache["base"]
            .as_object()
            .ok_or("Invalid account cache")?
            .clone();
        let keys: std::collections::BTreeSet<_> =
            local.keys().cloned().chain(base.keys().cloned()).collect();
        for k in keys {
            let v = local.get(&k).cloned().unwrap_or(Value::Null);
            let b = base
                .get(&k)
                .cloned()
                .unwrap_or(json!({"value":null,"version":0}));
            if v == b["value"] {
                continue;
            }
            let old = s.cache["pending"][&k].clone();
            if old.is_null() || old["value"] != v {
                s.cache["pending"][&k] = json!({"id":id(),"value":v,"expected":b["version"]});
            }
        }
        Ok(())
    }
    fn status_locked(&self, s: &CloudStore) -> Value {
        json!({"account":s.session.as_ref().map(|v|json!({"id":v["user"]["id"],"email":v["user"]["email"]})),"enrolled":s.enabled,"pending":s.cache["pending"].as_object().map_or(0,|p|p.len()),"conflicts":s.cache["conflicts"],"message":s.message,"fromLink":s.cache["awaitingConnect"]==true})
    }

    fn emit(&self, s: &CloudStore) {
        if let Some(app) = self.backend.app.lock().unwrap().as_ref() {
            let _ = app.emit("orbiter-cloud-status", self.status_locked(s));
        }
    }
    fn apply(&self, s: &mut CloudStore) -> Result<(), String> {
        let mut records = Records::new();
        for (k, v) in s.cache["base"].as_object().unwrap() {
            records.insert(k.clone(), v["value"].clone());
        }
        for (k, v) in s.cache["pending"].as_object().unwrap() {
            records.insert(k.clone(), v["value"].clone());
        }
        let before = self.backend.snapshot()["workspace"].clone();
        if s.cache.get("workspace").is_some() && encode(&before) != encode(&s.cache["workspace"]) {
            return Err("New local edits arrived during sync. They remain saved; retrying.".into());
        }
        let incoming = decode(&records, &before)?;
        self.backend.apply_cloud_workspace(incoming, &before)?;
        s.cache["workspace"] = self.backend.snapshot()["workspace"].clone();
        self.persist(s)
    }
    pub fn command(&self, action: &str, args: Value) -> Result<Value, String> {
        let mut s = self.store.lock().unwrap();
        match action {
            "status" => {
                let result = self.status_locked(&s);
                if s.cache["awaitingConnect"] == true {
                    s.cache["awaitingConnect"] = json!(false);
                    self.persist(&s)?;
                }
                return Ok(result);
            }
            "send-code" => {
                let email = args["email"].as_str().ok_or("Email required")?;
                if email.len() > 254 || !email.contains('@') {
                    return Err("Enter a valid email address".into());
                }
                if s.last_send
                    .is_some_and(|t| t.elapsed() < Duration::from_secs(60))
                {
                    return Err("Wait a minute before requesting another code".into());
                }
                if s.session.is_some() {
                    return Err("Sign out before requesting another link.".into());
                }
                let verifier = crate::server::token();
                let challenge = crate::server::base64(&Sha256::digest(verifier.as_bytes()))
                    .trim_end_matches('=')
                    .replace('+', "-")
                    .replace('/', "_");
                let pending = json!({"verifier":verifier,"email":email.to_lowercase(),"created":chrono::Utc::now().timestamp()});
                let cipher = protect(pending.to_string().as_bytes(), false)?;
                s.db.execute("INSERT INTO login_pending VALUES(1,?1) ON CONFLICT(id) DO UPDATE SET cipher=excluded.cipher",[cipher]).map_err(|e|e.to_string())?;
                self.request("/auth/v1/otp?redirect_to=http%3A%2F%2F127.0.0.1%3A18743%2Fauth-callback",&json!({"email":email,"create_user":false,"code_challenge":challenge,"code_challenge_method":"s256"}),None)?;
                s.last_send = Some(Instant::now());
            }
            "verify" => {
                if s.session.is_some() {
                    return Err("Sign out before changing accounts".into());
                }
                let token = args["token"].as_str().ok_or("Code required")?;
                if token.len() < 6 || token.len() > 8 || !token.bytes().all(|c| c.is_ascii_digit())
                {
                    return Err("Enter the code from your email".into());
                }
                let session = self.request(
                    "/auth/v1/verify",
                    &json!({"email":args["email"],"token":token,"type":"email"}),
                    None,
                )?;
                self.adopt_session(&mut s, session)?;
            }
            "complete-link" => {
                if s.session.is_some() {
                    return Err("Orbiter is already signed in.".into());
                }
                let code = args["code"].as_str().ok_or("Sign-in code missing")?;
                if code.is_empty()
                    || code.len() > 2048
                    || !code
                        .bytes()
                        .all(|c| c.is_ascii_alphanumeric() || b"_-".contains(&c))
                {
                    return Err("Invalid sign-in callback".into());
                }
                let cipher =
                    s.db.query_row("SELECT cipher FROM login_pending WHERE id=1", [], |r| {
                        r.get::<_, Vec<u8>>(0)
                    })
                    .map_err(|_| "Request a fresh sign-in link in Orbiter first.")?;
                let pending: Value = serde_json::from_slice(&protect(&cipher, true)?)
                    .map_err(|_| "Request a fresh sign-in link.")?;
                if chrono::Utc::now().timestamp() - pending["created"].as_i64().unwrap_or(0) > 3600
                {
                    return Err("Sign-in link expired. Request another one.".into());
                }
                let session = self.request(
                    "/auth/v1/token?grant_type=pkce",
                    &json!({"auth_code":code,"code_verifier":pending["verifier"]}),
                    None,
                )?;
                if session["user"]["email"].as_str().map(str::to_lowercase)
                    != pending["email"].as_str().map(str::to_string)
                {
                    return Err("Sign-in email does not match the request.".into());
                }
                self.adopt_session(&mut s, session)?;
                s.cache["awaitingConnect"] = json!(true);
                self.persist(&s)?;
                s.db.execute("DELETE FROM login_pending", [])
                    .map_err(|e| e.to_string())?;
            }
            "preview" => {
                let remote = self.rpc(&mut s, "orbiter_pull", json!({}))?;
                return Ok(
                    json!({"localCount":encode(&self.backend.snapshot()["workspace"]).len(),"remoteCount":remote.as_object().ok_or("Invalid cloud records")?.values().filter(|v|!v["value"].is_null()).count()}),
                );
            }
            "enroll" => {
                if s.session.is_none() {
                    return Err("Sign in first".into());
                }
                let choice = args["choice"].as_str().ok_or("Choose how to connect")?;
                if !["merge", "remote"].contains(&choice) {
                    return Err("Invalid migration choice".into());
                }
                let snap = self.backend.snapshot();
                if snap["timer"]["active"] == true
                    || (snap["timer"]["remainingMs"].as_u64().unwrap_or(0) > 0
                        && snap["timer"]["remainingMs"].as_u64().unwrap_or(0)
                            < snap["timer"]["duration"].as_u64().unwrap_or(25) * 60000)
                {
                    return Err("Finish focus before connecting this workspace".into());
                }
                let remote = self.rpc(&mut s, "orbiter_pull", json!({}))?;
                let owner = s.session.as_ref().unwrap()["user"]["id"]
                    .as_str()
                    .unwrap()
                    .to_string();
                let guest = snap["workspace"].clone();
                self.device(&mut s)?;
                let device = s.session.as_ref().unwrap()["device"].clone();
                let rewards = { self.backend.store.lock().unwrap().rewards.clone() };
                let progress=self.rpc(&mut s,"orbiter_bootstrap",json!({"p_device":device["id"],"p_secret":device["secret"],"p_focus":rewards.focused_ms,"p_opened":rewards.opened,"p_owned":rewards.owned}))?;
                self.backend.cloud_rewards(&owner, &progress)?;
                self.backend.cloud_bind(&owner, &guest)?;
                s.cache["workspace"] = guest.clone();
                if s.cache["enrolled"] == true {
                    s.enabled = true;
                    self.apply(&mut s)?;
                    self.persist(&s)?;
                    let result = self.status_locked(&s);
                    drop(s);
                    self.sync()?;
                    return Ok(result);
                }
                s.cache = json!({"base":remote,"pending":{},"conflicts":{},"enrolled":true,"workspace":guest});
                s.enabled = true;
                if choice == "merge" {
                    for (k, v) in encode(&guest) {
                        let r = s.cache["base"][&k].clone();
                        if r["value"] == v {
                            continue;
                        }
                        s.cache["pending"][&k] = json!({"id":id(),"value":v,"expected":r["version"].as_u64().unwrap_or(0)});
                        if r.get("version").is_some() && !r["value"].is_null() {
                            s.cache["conflicts"][&k] =
                                json!({"local":v,"remote":r["value"],"version":r["version"]});
                        }
                    }
                }
                self.persist(&s)?;
                self.apply(&mut s)?;
            }
            "resolve" => {
                self.capture(&mut s)?;
                let k = args["key"].as_str().ok_or("Record required")?;
                let c = s.cache["conflicts"][k].clone();
                if c.is_null() {
                    return Err("Conflict already resolved".into());
                }
                s.cache["base"][k] = json!({"value":c["remote"],"version":c["version"]});
                if args["choice"] == "remote" {
                    s.cache["pending"].as_object_mut().unwrap().remove(k);
                } else {
                    s.cache["pending"][k] =
                        json!({"id":id(),"value":c["local"],"expected":c["version"]});
                }
                s.cache["conflicts"].as_object_mut().unwrap().remove(k);
                self.persist(&s)?;
                self.apply(&mut s)?;
            }
            "logout" => {
                self.backend
                    .action("power-pause", json!({"reason":"Paused when signing out."}))?;
                self.backend.action("finish", json!({}))?;
                self.capture(&mut s)?;
                self.persist(&s)?;
                self.backend.cloud_unbind()?;
                s.db.execute("DELETE FROM credential", [])
                    .map_err(|e| e.to_string())?;
                s.session = None;
                s.enabled = false;
                s.cache = json!({"base":{},"pending":{},"conflicts":{},"enrolled":false});
            }
            "chest" => {
                let op = s.cache["crateOperation"]
                    .as_str()
                    .map(str::to_string)
                    .unwrap_or_else(id);
                s.cache["crateOperation"] = json!(op);
                self.persist(&s)?;
                let result = self.rpc(&mut s, "orbiter_open_crate", json!({"p_id":op}))?;
                let owner = s.session.as_ref().unwrap()["user"]["id"].as_str().unwrap();
                self.backend.cloud_rewards(owner, &result["rewards"])?;
                s.cache.as_object_mut().unwrap().remove("crateOperation");
                self.persist(&s)?;
                let mut snapshot = self.backend.snapshot();
                snapshot["reward"] = result["reward"].clone();
                return Ok(snapshot);
            }
            "equip" => {
                let rewards = self.rpc(
                    &mut s,
                    "orbiter_equip",
                    json!({"p_slot":args["slot"],"p_item":args["item"]}),
                )?;
                let owner = s.session.as_ref().unwrap()["user"]["id"].as_str().unwrap();
                self.backend.cloud_rewards(owner, &rewards)?;
                return Ok(self.backend.snapshot());
            }
            "sync" => {}
            _ => return Err("Unsupported account action".into()),
        }
        self.emit(&s);
        let result = self.status_locked(&s);
        drop(s);
        if ["enroll", "resolve", "sync"].contains(&action) {
            self.sync()?;
        }
        Ok(result)
    }
    pub fn sync(&self) -> Result<(), String> {
        let mut s = self.store.lock().unwrap();
        if !s.enabled || s.session.is_none() {
            return Ok(());
        }
        let owner = s.session.as_ref().unwrap()["user"]["id"]
            .as_str()
            .unwrap()
            .to_string();
        self.capture(&mut s)?;
        self.persist(&s)?;
        let remote = self.rpc(&mut s, "orbiter_pull", json!({}))?;
        for (k, row) in remote.as_object().ok_or("Invalid cloud records")? {
            let p = s.cache["pending"][k].clone();
            if !p.is_null() && p["expected"] != row["version"] {
                let b = &s.cache["base"][k]["value"];
                if let Some(v) = merge(b, &p["value"], &row["value"]) {
                    s.cache["pending"][k] = json!({"id":id(),"value":v,"expected":row["version"]});
                    if v == row["value"] {
                        s.cache["pending"].as_object_mut().unwrap().remove(k);
                    }
                } else {
                    s.cache["conflicts"][k] =
                        json!({"local":p["value"],"remote":row["value"],"version":row["version"]});
                    continue;
                }
            }
            s.cache["base"][k] = row.clone();
        }
        self.persist(&s)?;
        let pending = s.cache["pending"].as_object().unwrap().clone();
        for (k, op) in pending {
            if s.cache["conflicts"].get(&k).is_some() {
                continue;
            }
            let row=self.rpc(&mut s,"orbiter_write",json!({"p_id":op["id"],"p_key":k,"p_expected":op["expected"],"p_value":op["value"]}))?;
            if row["conflict"] == true {
                continue;
            }
            s.cache["base"][&k] = row;
            s.cache["pending"].as_object_mut().unwrap().remove(&k);
            self.persist(&s)?;
        }
        self.device(&mut s)?;
        let device = s.session.as_ref().unwrap()["device"].clone();
        let events = {
            let state = self.backend.store.lock().unwrap();
            let mut stmt = state
                .db
                .prepare("SELECT data FROM cloud_focus WHERE owner=?1")
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([&owner], |r| r.get::<_, String>(0))
                .map_err(|e| e.to_string())?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        };
        for raw in events {
            let e: Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
            self.rpc(&mut s,"orbiter_focus",json!({"p_device":device["id"],"p_secret":device["secret"],"p_id":e["id"],"p_start":e["start"],"p_end":e["end"],"p_course":e["course"]}))?;
            self.backend
                .store
                .lock()
                .unwrap()
                .db
                .execute(
                    "DELETE FROM cloud_focus WHERE event_id=?1",
                    [e["id"].as_str().unwrap()],
                )
                .map_err(|e| e.to_string())?;
        }
        let rewards = self.rpc(&mut s, "orbiter_rewards", json!({}))?;
        self.backend.cloud_rewards(&owner, &rewards)?;
        self.apply(&mut s)?;
        self.backend.cloud_ack(&owner)?;
        s.message = "Your space is up to date.".into();
        self.emit(&s);
        Ok(())
    }
    pub fn start(self: Arc<Self>) {
        std::thread::spawn(move || {
            let mut changes = self.backend.changes.subscribe();
            let mut socket = None;
            let mut last_heartbeat = Instant::now();
            let mut last_connect = Instant::now() - Duration::from_secs(30);
            let mut retry = false;
            let mut retry_at = Instant::now();
            let mut backoff = 15u64;
            loop {
                let changed = changes.try_recv().is_ok();
                if changed || (retry && Instant::now() >= retry_at) {
                    retry = false;
                    if let Err(e) = self.sync() {
                        let mut s = self.store.lock().unwrap();
                        s.message = e;
                        self.emit(&s);
                        retry = true;
                        retry_at = Instant::now() + Duration::from_secs(backoff);
                        backoff = (backoff * 2).min(120);
                    } else {
                        backoff = 15;
                    }
                }
                let enabled = {
                    let s = self.store.lock().unwrap();
                    s.enabled && s.session.is_some()
                };
                if !enabled {
                    socket = None;
                    std::thread::sleep(Duration::from_secs(1));
                    continue;
                }
                if socket.is_none() && last_connect.elapsed() > Duration::from_secs(15) {
                    last_connect = Instant::now();
                    let token = {
                        let mut s = self.store.lock().unwrap();
                        self.token(&mut s).ok()
                    };
                    if let Some(token) = token {
                        let url = format!(
                            "{}/realtime/v1/websocket?apikey={}&vsn=1.0.0",
                            self.url.replace("https:", "wss:"),
                            self.api_key
                        );
                        if let Ok((mut ws, _)) = tungstenite::connect(url) {
                            if let tungstenite::stream::MaybeTlsStream::Rustls(stream) =
                                ws.get_mut()
                            {
                                let _ = stream.sock.set_read_timeout(Some(Duration::from_secs(1)));
                            }
                            let owner = self.store.lock().unwrap().session.as_ref().unwrap()
                                ["user"]["id"]
                                .as_str()
                                .unwrap()
                                .to_string();
                            let msg = json!({"topic":"realtime:orbiter","event":"phx_join","payload":{"config":{"broadcast":{"self":false},"presence":{"enabled":false},"postgres_changes":[{"event":"*","schema":"public","table":"orbiter_records","filter":format!("user_id=eq.{owner}")},{"event":"*","schema":"public","table":"orbiter_progress","filter":format!("user_id=eq.{owner}")}]},"access_token":token},"ref":"1"});
                            let _ = ws.send(tungstenite::Message::Text(msg.to_string().into()));
                            socket = Some(ws);
                            retry = true;
                            retry_at = Instant::now();
                        }
                    }
                }
                if let Some(ws) = socket.as_mut() {
                    if last_heartbeat.elapsed() > Duration::from_secs(25) {
                        last_heartbeat = Instant::now();
                        if ws.send(tungstenite::Message::Text(json!({"topic":"phoenix","event":"heartbeat","payload":{},"ref":"2"}).to_string().into())).is_err(){socket=None;continue;}
                    }
                    match ws.read() {
                        Ok(tungstenite::Message::Text(t)) => {
                            if let Ok(v) = serde_json::from_str::<Value>(&t) {
                                if v["event"] == "postgres_changes" {
                                    retry = true;
                                    retry_at = Instant::now();
                                }
                            }
                        }
                        Err(tungstenite::Error::Io(e))
                            if [std::io::ErrorKind::WouldBlock, std::io::ErrorKind::TimedOut]
                                .contains(&e.kind()) => {}
                        Err(_) => socket = None,
                        _ => {}
                    }
                } else {
                    std::thread::sleep(Duration::from_secs(2));
                }
            }
        });
    }
}

#[tauri::command]
pub async fn cloud_command(
    cloud: tauri::State<'_, Arc<Cloud>>,
    action: String,
    args: Value,
) -> Result<Value, String> {
    let service = cloud.inner().clone();
    tauri::async_runtime::spawn_blocking(move || service.command(&action, args))
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pkce_uses_standard_s256_challenge() {
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let challenge = crate::server::base64(&Sha256::digest(verifier.as_bytes()))
            .trim_end_matches('=')
            .replace('+', "-")
            .replace('/', "_");
        assert_eq!(challenge, "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    }
    #[test]
    fn codec_preserves_history_and_local_timer() {
        let mut w = empty_workspace();
        w["study"]["sessions"] = json!([{"date":"2026-10-14","minutes":25.0,"title":"Legacy"}]);
        w["study"]["catProfiles"] = json!({"Physics":42});
        let r = encode(&w);
        assert!(r.keys().any(|k| k.contains(",25,")));
        let decoded = decode(&r, &w).unwrap();
        assert_eq!(decoded["study"]["timer"], w["study"]["timer"]);
        assert_eq!(decoded["study"]["sessions"], w["study"]["sessions"]);
        assert_eq!(decoded["study"]["catProfiles"], w["study"]["catProfiles"]);
    }
    #[test]
    fn field_merge_and_deletion_conflicts() {
        assert_eq!(
            merge(
                &json!({"title":"A","due":"D"}),
                &json!({"title":"B","due":"D"}),
                &json!({"title":"A","due":"E"})
            ),
            Some(json!({"title":"B","due":"E"}))
        );
        assert!(merge(&json!({"title":"A"}), &Value::Null, &json!({"title":"B"})).is_none());
    }
    #[cfg(windows)]
    #[test]
    fn credentials_use_windows_protection() {
        let raw = b"test-refresh-not-a-real-token";
        let encrypted = protect(raw, false).unwrap();
        assert_ne!(encrypted, raw);
        assert_eq!(protect(&encrypted, true).unwrap(), raw);
    }
}
