//! One native writer for timers, workspaces and rewards. Every durable transition is atomic.
use crate::model::{empty_workspace, ensure_cat_profiles, validate_workspace};
use chrono::{DateTime, Local, TimeDelta, Utc};
use rand::Rng;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::{broadcast, Notify};

pub fn cosmetic_slot(id: &str) -> &str {
    if id.starts_with("halo-") {
        "halo"
    } else if id.starts_with("trail-") {
        "trail"
    } else if id.starts_with("habitat-") {
        "habitat"
    } else {
        "appearance"
    }
}
pub fn growth(ms: u64) -> Value {
    let hours = ms as f64 / 3600000.0;
    let thresholds = [0.0, 2.0, 8.0, 20.0];
    let stage = thresholds.iter().rposition(|h| hours >= *h).unwrap_or(0);
    let next = thresholds.get(stage + 1).copied();
    json!({"stage":stage,"label":(["Baby","Kitten","Young cat","Adult"][stage]),"focusedMs":ms,"progress":next.map_or(1.0,|n| (hours-thresholds[stage])/(n-thresholds[stage])),"nextAtMs":next.map(|n|(n*3600000.0) as u64)})
}

pub const COSMETICS: [(&str, &str, &str); 51] = [
    ("mint", "Tidal mint", "common"),
    ("lilac", "Moon mist", "common"),
    ("opal", "Opal dawn", "common"),
    ("rose", "Rose nebula", "common"),
    ("halo-thin", "Silver charm", "common"),
    ("halo-double", "Twin charms", "common"),
    ("trail-sparks", "Starlight", "common"),
    ("trail-waves", "Quiet tide", "common"),
    ("aurora", "Aurora veil", "rare"),
    ("eclipse", "Solar eclipse", "rare"),
    ("halo-runes", "Rune pendant", "rare"),
    ("trail-comet", "Comet wake", "rare"),
    ("indigo", "Deep cosmos", "rare"),
    ("singularity", "Living singularity", "mythic"),
    ("cultivation", "Celestial bloom", "mythic"),
    ("look-01", "Dawn peach", "common"),
    ("look-02", "Pearl cloud", "common"),
    ("look-03", "Blue hour", "common"),
    ("look-04", "Honey glow", "common"),
    ("look-05", "Sage whisper", "common"),
    ("look-06", "Lavender milk", "common"),
    ("look-07", "Rose quartz", "rare"),
    ("look-08", "Polar opal", "rare"),
    ("look-09", "Velvet dusk", "rare"),
    ("look-10", "Aurora silk", "rare"),
    ("look-11", "Lunar prism", "mythic"),
    ("look-12", "Nebula dream", "mythic"),
    ("halo-01", "Petal bow", "common"),
    ("halo-02", "Bell ribbon", "common"),
    ("halo-03", "Moon pin", "common"),
    ("halo-04", "Cloud collar", "common"),
    ("halo-05", "Tiny satchel", "common"),
    ("halo-06", "Comet badge", "common"),
    ("halo-07", "Stargazer cape", "rare"),
    ("halo-08", "Tide crown", "rare"),
    ("halo-09", "Lantern pendant", "rare"),
    ("halo-10", "Astral compass", "rare"),
    ("halo-11", "Phoenix charm", "mythic"),
    ("halo-12", "Moonkeeper wings", "mythic"),
    ("habitat-01", "Pebble pool", "common"),
    ("habitat-02", "Dew garden", "common"),
    ("habitat-03", "Moon cushion", "common"),
    ("habitat-04", "Paper lantern", "common"),
    ("habitat-05", "Reed shore", "common"),
    ("habitat-06", "Cloud shelf", "common"),
    ("habitat-07", "Crystal grotto", "rare"),
    ("habitat-08", "Star hammock", "rare"),
    ("habitat-09", "Floating shrine", "rare"),
    ("habitat-10", "Aurora pond", "rare"),
    ("habitat-11", "Celestial garden", "mythic"),
    ("habitat-12", "Infinity tide", "mythic"),
];
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Timer {
    pub duration: u32,
    pub remaining_ms: u64,
    pub task_id: Option<String>,
    pub title: String,
    pub active: bool,
    pub reason: String,
    #[serde(default)]
    pub session_id: String,
    #[serde(default)]
    pub course_profile: Option<String>,
    #[serde(default)]
    pub cloud_owner: Option<String>,
}
impl Default for Timer {
    fn default() -> Self {
        Self {
            duration: 25,
            remaining_ms: 1500000,
            task_id: None,
            title: "A little room to focus".into(),
            active: false,
            reason: String::new(),
            session_id: format!("{:016x}", rand::random::<u64>()),
            course_profile: None,
            cloud_owner: None,
        }
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct Settings {
    #[serde(default)]
    pub island_version: u32,
    pub buddy_width: u32,
    pub buddy_height: u32,
    pub pinned: bool,
    pub calm: bool,
    pub quiet: bool,
    pub reminders: bool,
    pub reminder_hour: u32,
    pub position: Option<(i32, i32)>,
    pub appearance: String,
    pub halo: String,
    pub trail: String,
    pub habitat: String,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            island_version: 1,
            buddy_width: 420,
            buddy_height: 220,
            pinned: true,
            calm: false,
            quiet: false,
            reminders: true,
            reminder_hour: 9,
            position: None,
            appearance: "mint".into(),
            halo: "halo-thin".into(),
            trail: "trail-waves".into(),
            habitat: String::new(),
        }
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rewards {
    pub focused_ms: u64,
    pub opened: u64,
    pub owned: Vec<String>,
    pub stars: u64,
    #[serde(default)]
    pub course_ms: std::collections::BTreeMap<String, u64>,
}
impl Default for Rewards {
    fn default() -> Self {
        Self {
            focused_ms: 0,
            opened: 0,
            owned: vec!["mint".into(), "halo-thin".into(), "trail-waves".into()],
            stars: 0,
            course_ms: Default::default(),
        }
    }
}
pub struct Store {
    pub db: Connection,
    pub workspace: Value,
    pub revision: u64,
    pub edit_revision: u64,
    pub timer: Timer,
    pub settings: Settings,
    pub rewards: Rewards,
    pub started: Option<Instant>,
    pub wall: DateTime<Utc>,
    pub last_reminder: String,
    pub cloud_events: Vec<Value>,
}
pub struct Backend {
    pub store: Mutex<Store>,
    pub changes: broadcast::Sender<u64>,
    pub wake: Notify,
    pub app: Mutex<Option<AppHandle>>,
    pub dir: PathBuf,
    pub local_error: Mutex<Option<String>>,
}
impl Backend {
    pub fn open(dir: PathBuf) -> Result<Arc<Self>, String> {
        std::fs::create_dir_all(dir.join("backups")).map_err(|e| e.to_string())?;
        let db = Connection::open(dir.join("orbit.sqlite3")).map_err(|e| e.to_string())?;
        db.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;
            CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),workspace TEXT NOT NULL,revision INTEGER NOT NULL,timer TEXT NOT NULL,settings TEXT NOT NULL,rewards TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS cloud_binding(id INTEGER PRIMARY KEY CHECK(id=1),owner TEXT NOT NULL,guest TEXT NOT NULL,guest_rewards TEXT NOT NULL DEFAULT '{}');
            CREATE TABLE IF NOT EXISTS cloud_outbox(owner TEXT PRIMARY KEY,workspace TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS cloud_rewards(owner TEXT PRIMARY KEY,snapshot TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS cloud_focus(owner TEXT NOT NULL,event_id TEXT PRIMARY KEY,data TEXT NOT NULL);
            
").map_err(|e|e.to_string())?;
        let cloud_columns = db
            .prepare("PRAGMA table_info(cloud_binding)")
            .map_err(|e| e.to_string())?
            .query_map([], |r| r.get::<_, String>(1))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        if !cloud_columns.iter().any(|c| c == "guest_rewards") {
            db.execute_batch(
                "ALTER TABLE cloud_binding ADD COLUMN guest_rewards TEXT NOT NULL DEFAULT '{}';",
            )
            .map_err(|e| e.to_string())?;
        }
        let version: i64 = db
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        if version > 2 {
            return Err("This database needs a newer Orbit version.".into());
        }
        let columns = db
            .prepare("PRAGMA table_info(state)")
            .map_err(|e| e.to_string())?
            .query_map([], |r| r.get::<_, String>(1))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        if !columns.iter().any(|c| c == "edit_revision") {
            db.execute_batch("ALTER TABLE state ADD COLUMN edit_revision INTEGER NOT NULL DEFAULT 0; PRAGMA user_version=2;").map_err(|e|e.to_string())?;
        }
        db.execute_batch("PRAGMA user_version=2;")
            .map_err(|e| e.to_string())?;
        let edit_revision = db
            .query_row("SELECT edit_revision FROM state WHERE id=1", [], |r| {
                r.get::<_, i64>(0)
            })
            .unwrap_or(0) as u64;
        let saved = db.query_row(
            "SELECT workspace,revision,timer,settings,rewards FROM state WHERE id=1",
            [],
            |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, i64>(1)? as u64,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, String>(4)?,
                ))
            },
        );
        let (workspace, revision, mut timer, mut settings, rewards) = match saved {
            Ok((w, r, t, s, x)) => (
                serde_json::from_str(&w).map_err(|e| e.to_string())?,
                r,
                serde_json::from_str::<Timer>(&t).map_err(|e| e.to_string())?,
                serde_json::from_str::<Settings>(&s).map_err(|e| e.to_string())?,
                serde_json::from_str(&x).map_err(|e| e.to_string())?,
            ),
            Err(rusqlite::Error::QueryReturnedNoRows) => (
                empty_workspace(),
                0,
                Timer::default(),
                Settings::default(),
                Rewards::default(),
            ),
            Err(e) => return Err(e.to_string()),
        };

        if settings.island_version < 1 {
            // The floating island stays visible while the user works in another app.
            settings.pinned = true;
            if settings.buddy_width == 280 && settings.buddy_height == 320 {
                settings.buddy_width = 420;
                settings.buddy_height = 220;
            } else {
                settings.buddy_width = settings.buddy_width.clamp(360, 560);
                settings.buddy_height = settings.buddy_height.clamp(200, 300);
            }
            settings.island_version = 1;
        }
        if timer.active {
            timer.reason = "Recovered after restart. Resume when ready.".into();
        }
        timer.active = false;
        validate_workspace(&workspace)?;
        let (changes, _) = broadcast::channel(32);
        let backend = Arc::new(Self {
            store: Mutex::new(Store {
                db,
                workspace,
                revision,
                edit_revision,
                timer,
                settings,
                rewards,
                started: None,
                wall: Utc::now(),
                last_reminder: String::new(),
                cloud_events: Vec::new(),
            }),
            changes,
            wake: Notify::new(),
            app: Mutex::new(None),
            dir,
            local_error: Mutex::new(None),
        });
        {
            let mut s = backend.store.lock().unwrap();
            s.persist()?;
        }
        Ok(backend)
    }
    pub fn snapshot(&self) -> Value {
        let s = self.store.lock().unwrap();
        s.snapshot(self.local_error.lock().unwrap().clone())
    }
    pub fn cloud_bind(&self, owner: &str, guest: &Value) -> Result<(), String> {
        let s = self.store.lock().unwrap();
        let backup = self.dir.join("backups").join(format!(
            "before-cloud-{}.json",
            Utc::now().timestamp_millis()
        ));
        std::fs::write(
            backup,
            serde_json::to_vec_pretty(guest).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
        s.db.execute("INSERT INTO cloud_binding(id,owner,guest,guest_rewards) VALUES(1,?1,?2,?3) ON CONFLICT(id) DO NOTHING",params![owner,guest.to_string(),serde_json::to_string(&s.rewards).map_err(|e|e.to_string())?]).map_err(|e|e.to_string())?;
        Ok(())
    }
    pub fn cloud_unbind(&self) -> Result<(), String> {
        let mut s = self.store.lock().unwrap();
        let binding =
            s.db.query_row(
                "SELECT owner,guest,guest_rewards FROM cloud_binding WHERE id=1",
                [],
                |r| {
                    Ok((
                        r.get::<_, String>(0)?,
                        r.get::<_, String>(1)?,
                        r.get::<_, String>(2)?,
                    ))
                },
            )
            .ok();
        let Some((owner, guest, guest_rewards)) = binding else {
            return Ok(());
        };
        let restored: Value = serde_json::from_str(&guest).map_err(|e| e.to_string())?;
        validate_workspace(&restored)?;
        let rewards = serde_json::from_str::<Rewards>(&guest_rewards)
            .ok()
            .unwrap_or_else(|| s.rewards.clone());
        let old = s.workspace.clone();
        let old_rewards = s.rewards.clone();
        let old_revision = s.revision;
        let old_edit = s.edit_revision;
        s.db.execute("DELETE FROM cloud_binding", [])
            .map_err(|e| e.to_string())?;
        s.workspace = restored;
        s.rewards = rewards;
        s.edit_revision += 1;
        s.revision += 1;
        if let Err(e) = s.persist() {
            s.workspace = old;
            s.rewards = old_rewards;
            s.revision = old_revision;
            s.edit_revision = old_edit;
            s.db.execute(
                "INSERT INTO cloud_binding(id,owner,guest,guest_rewards) VALUES(1,?1,?2,?3)",
                params![owner, guest, guest_rewards],
            )
            .map_err(|e| e.to_string())?;
            return Err(e);
        }
        drop(s);
        self.changed();
        Ok(())
    }
    pub fn cloud_ack(&self, owner: &str) -> Result<(), String> {
        self.store
            .lock()
            .unwrap()
            .db
            .execute("DELETE FROM cloud_outbox WHERE owner=?1", [owner])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn cloud_rewards(&self, owner: &str, rewards: &Value) -> Result<(), String> {
        let mut s = self.store.lock().unwrap();
        let raw = rewards.to_string();
        if s.db
            .query_row(
                "SELECT snapshot FROM cloud_rewards WHERE owner=?1",
                [owner],
                |r| r.get::<_, String>(0),
            )
            .ok()
            .as_deref()
            == Some(raw.as_str())
        {
            return Ok(());
        }
        s.db.execute("INSERT INTO cloud_rewards VALUES(?1,?2) ON CONFLICT(owner) DO UPDATE SET snapshot=excluded.snapshot",params![owner,rewards.to_string()]).map_err(|e|e.to_string())?;
        s.revision += 1;
        s.persist()?;
        drop(s);
        self.changed();
        Ok(())
    }
    pub fn apply_cloud_workspace(
        &self,
        mut incoming: Value,
        expected: &Value,
    ) -> Result<(), String> {
        validate_workspace(&incoming)?;
        let mut s = self.store.lock().unwrap();
        if crate::cloud::encode(&s.workspace) != crate::cloud::encode(expected) {
            return Err(
                "Local edits arrived during sync; retrying with your draft preserved.".into(),
            );
        }
        if crate::cloud::encode(&s.workspace) == crate::cloud::encode(&incoming) {
            return Ok(());
        }
        incoming["study"]["timer"] = s.workspace["study"]["timer"].clone();
        let old = s.workspace.clone();
        let revision = s.revision;
        let edit = s.edit_revision;
        s.workspace = incoming;
        s.revision += 1;
        s.edit_revision += 1;
        if let Err(e) = s.persist() {
            s.workspace = old;
            s.revision = revision;
            s.edit_revision = edit;
            return Err(e);
        }
        drop(s);
        self.changed();
        Ok(())
    }
    pub fn changed(&self) {
        let revision = self.store.lock().unwrap().revision;
        let _ = self.changes.send(revision);
        if let Some(app) = self.app.lock().unwrap().as_ref() {
            let _ = app.emit("orbit-changed", revision);
        }
    }
    pub fn notify(&self, title: &str, body: &str) {
        let s = self.store.lock().unwrap();
        if s.settings.reminders && !s.settings.quiet {
            if let Some(app) = self.app.lock().unwrap().as_ref() {
                let _ = app.notification().builder().title(title).body(body).show();
            }
        }
    }
    pub fn save_workspace(
        &self,
        workspace: Value,
        revision: u64,
        import: bool,
    ) -> Result<Value, String> {
        validate_workspace(&workspace)?;
        let mut s = self.store.lock().unwrap();
        if revision != s.edit_revision {
            return Err(
                "Conflict: the shared workspace changed. Your draft has been retained.".into(),
            );
        }
        // Web writes cannot manufacture focus credit or overwrite native timer state.
        let mut incoming = workspace;
        if import {
            if s.timer.active
                || (s.timer.remaining_ms > 0
                    && s.timer.remaining_ms < (s.timer.duration as u64) * 60000)
            {
                return Err("Finish your current session before importing.".into());
            }
            let backup = self.dir.join("backups").join(format!(
                "before-import-{}.json",
                Utc::now().timestamp_millis()
            ));
            std::fs::write(
                backup,
                serde_json::to_vec_pretty(&s.workspace).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
        } else {
            if incoming.get("study").is_none() {
                incoming["study"] = empty_workspace()["study"].clone();
            }
            incoming["study"]["sessions"] = s.workspace["study"]["sessions"].clone();
            if incoming["study"]["sessions"].is_null() {
                incoming["study"]["sessions"] = json!([]);
            }
        }
        if incoming.get("study").is_none() {
            incoming["study"] = empty_workspace()["study"].clone();
        }
        let previous = s.workspace.clone();
        let old_revision = s.revision;
        let old_edit_revision = s.edit_revision;
        ensure_cat_profiles(&mut incoming);
        s.workspace = incoming;
        s.revision += 1;
        s.edit_revision += 1;
        if let Err(e) = s.persist() {
            s.workspace = previous;
            s.revision = old_revision;
            s.edit_revision = old_edit_revision;
            return Err(e);
        }
        let result = s.snapshot(None);
        drop(s);
        self.changed();
        Ok(result)
    }
    pub fn action(&self, action: &str, args: Value) -> Result<Value, String> {
        let mut s = self.store.lock().unwrap();
        if action == "chest"
            && s.db
                .query_row("SELECT owner FROM cloud_binding WHERE id=1", [], |r| {
                    r.get::<_, String>(0)
                })
                .is_ok()
        {
            return Err("Connected crates open online through your account.".into());
        }
        // In-memory state is restored if the transaction fails.
        let old = (
            s.workspace.clone(),
            s.timer.clone(),
            s.settings.clone(),
            s.rewards.clone(),
            s.revision,
            s.started,
            s.wall,
        );
        let old_cloud_events = s.cloud_events.clone();
        let tx_result = (|| -> Result<Option<Value>, String> {
            let mut reward = None;
            match action {
                "start" | "pause" | "toggle" | "finish" | "power-pause" => {
                    if s.timer.active {
                        s.settle()?;
                    }
                    match action {
                        "start" | "toggle" if !old.1.active => {
                            if s.timer.remaining_ms == 0 {
                                s.timer.session_id = format!("{:016x}", rand::random::<u64>());
                                s.timer.remaining_ms = s.timer.duration as u64 * 60000;
                            }
                            // Capture the course profile once; task edits cannot redirect a running session.

                            // Capture once; editing a task never redirects a running cat's growth.
                            if s.timer.remaining_ms == s.timer.duration as u64 * 60000
                                || s.timer.course_profile.is_none()
                            {
                                ensure_cat_profiles(&mut s.workspace);
                                let course = s.workspace["study"]["tasks"]
                                    .as_array()
                                    .and_then(|tasks| {
                                        tasks.iter().find(|t| {
                                            t["id"].as_str() == s.timer.task_id.as_deref()
                                        })
                                    })
                                    .and_then(|t| t["course"].as_str());
                                s.timer.course_profile = course
                                    .and_then(|name| {
                                        s.workspace["study"]["catProfiles"][name].as_u64()
                                    })
                                    .map(|code| code.to_string());
                            }
                            if s.timer.remaining_ms == s.timer.duration as u64 * 60000 {
                                s.timer.cloud_owner =
                                    s.db.query_row(
                                        "SELECT owner FROM cloud_binding WHERE id=1",
                                        [],
                                        |r| r.get::<_, String>(0),
                                    )
                                    .ok();
                            }
                            s.timer.active = true;
                            s.timer.reason.clear();
                            s.started = Some(Instant::now());
                            s.wall = Utc::now();
                        }
                        "power-pause" => {
                            s.timer.reason = args["reason"]
                                .as_str()
                                .unwrap_or("Paused while away. Resume when ready.")
                                .into();
                        }
                        "finish" => {
                            s.timer.remaining_ms = 0;
                            s.timer.reason = "Session saved. Take a breath.".into();
                        }
                        _ => {}
                    }
                }
                "configure" => {
                    if s.timer.active
                        || (s.timer.remaining_ms > 0
                            && s.timer.remaining_ms < s.timer.duration as u64 * 60000)
                    {
                        return Err(
                            "Finish the current session before changing its intention.".into()
                        );
                    }
                    let duration = args["duration"].as_u64().unwrap_or(s.timer.duration as u64);
                    if !(1..=240).contains(&duration) {
                        return Err("Choose 1 to 240 minutes.".into());
                    }
                    let task = args["taskId"].as_str();
                    let found = task.and_then(|id| {
                        s.workspace["study"]["tasks"]
                            .as_array()
                            .and_then(|a| a.iter().find(|t| t["id"] == id && t["done"] != true))
                    });
                    if task.is_some() && found.is_none() {
                        return Err("Choose an unfinished task.".into());
                    }
                    let title = found
                        .map(|t| t["title"].as_str().unwrap_or("").to_string())
                        .unwrap_or_else(|| {
                            args["title"]
                                .as_str()
                                .unwrap_or("A little room to focus")
                                .chars()
                                .take(160)
                                .collect()
                        });
                    s.timer = Timer {
                        duration: duration as u32,
                        remaining_ms: duration * 60000,
                        task_id: task.map(str::to_string),
                        title,
                        active: false,
                        reason: String::new(),
                        session_id: format!("{:016x}", rand::random::<u64>()),
                        course_profile: None,
                        cloud_owner: None,
                    };
                }
                "settings" => {
                    if let Some(v) = args["buddyWidth"].as_u64() {
                        if !(360..=560).contains(&v) {
                            return Err("Buddy width must be 360–560".into());
                        }
                        s.settings.buddy_width = v as u32;
                    }
                    if let Some(v) = args["buddyHeight"].as_u64() {
                        if !(200..=300).contains(&v) {
                            return Err("Buddy height must be 200–300".into());
                        }
                        s.settings.buddy_height = v as u32;
                    }

                    if let Some(v) = args["pinned"].as_bool() {
                        s.settings.pinned = v
                    }
                    if let Some(v) = args["calm"].as_bool() {
                        s.settings.calm = v
                    }
                    if let Some(v) = args["quiet"].as_bool() {
                        s.settings.quiet = v
                    }
                    if let Some(v) = args["reminders"].as_bool() {
                        s.settings.reminders = v
                    }
                    if let Some(v) = args["reminderHour"].as_u64() {
                        if v > 23 {
                            return Err("Invalid reminder hour".into());
                        }
                        s.settings.reminder_hour = v as u32
                    }
                    for key in ["appearance", "halo", "trail", "habitat"] {
                        if let Some(id) = args[key].as_str() {
                            if !s.rewards.owned.iter().any(|x| x == id) {
                                return Err("Cosmetic is not unlocked.".into());
                            }
                            let category = if id.starts_with("habitat-") {
                                "habitat"
                            } else if id.starts_with("halo-") {
                                "halo"
                            } else if id.starts_with("trail-") {
                                "trail"
                            } else {
                                "appearance"
                            };
                            if category != key {
                                return Err("Wrong cosmetic category".into());
                            }
                            match key {
                                "appearance" => s.settings.appearance = id.into(),
                                "halo" => s.settings.halo = id.into(),
                                "trail" => s.settings.trail = id.into(),
                                _ => s.settings.habitat = id.into(),
                            }
                        }
                    }
                }
                "chest" => {
                    if s.timer.active {
                        s.settle()?;
                        if s.timer.remaining_ms > 0 {
                            s.timer.active = true;
                            s.started = Some(Instant::now());
                            s.wall = Utc::now();
                        } else {
                            s.timer.reason = "Session saved. Take a breath.".into();
                        }
                    }
                    if s.rewards.focused_ms / 1800000 <= s.rewards.opened {
                        return Err("Earn a crate with 30 minutes of focus.".into());
                    }
                    let available: Vec<_> = COSMETICS
                        .iter()
                        .filter(|c| !s.rewards.owned.iter().any(|id| id == c.0))
                        .collect();
                    if available.is_empty() {
                        s.rewards.stars += 1;
                        reward = Some(json!({"name":"Constellation star","rarity":"complete"}));
                    } else {
                        let tiers = [("common", 70u32), ("rare", 25), ("mythic", 5)];
                        let weighted: Vec<_> = tiers
                            .iter()
                            .filter(|(t, _)| available.iter().any(|c| c.2 == *t))
                            .collect();
                        let sum: u32 = weighted.iter().map(|x| x.1).sum();
                        let mut pick = rand::thread_rng().gen_range(0..sum);
                        let mut tier = weighted[0].0;
                        for (t, w) in weighted {
                            if pick < *w {
                                tier = t;
                                break;
                            }
                            pick -= w;
                        }
                        let choices: Vec<_> =
                            available.into_iter().filter(|c| c.2 == tier).collect();
                        let c = choices[rand::thread_rng().gen_range(0..choices.len())];
                        s.rewards.owned.push(c.0.into());
                        reward = Some(
                            json!({"id":c.0,"name":c.1,"rarity":c.2,"slot":cosmetic_slot(c.0)}),
                        );
                    }
                    s.rewards.opened += 1;
                }
                "position" => {
                    if let (Some(x), Some(y)) = (args["x"].as_i64(), args["y"].as_i64()) {
                        s.settings.position =
                            Some((x.clamp(-32768, 32767) as i32, y.clamp(-32768, 32767) as i32));
                    }
                }
                _ => return Err("Unknown companion action".into()),
            }
            s.revision += 1;
            s.persist()?;
            Ok(reward)
        })();
        match tx_result {
            Err(e) => {
                s.cloud_events = old_cloud_events;
                (
                    s.workspace,
                    s.timer,
                    s.settings,
                    s.rewards,
                    s.revision,
                    s.started,
                    s.wall,
                ) = old;
                Err(e)
            }
            Ok(reward) => {
                let mut result = s.snapshot(None);
                result["reward"] = reward.unwrap_or(Value::Null);
                drop(s);
                self.changed();
                self.wake.notify_one();
                if !old.1.active
                    && result["timer"]["active"] == true
                    && matches!(action, "start" | "toggle")
                {
                    if let Some(app) = self.app.lock().unwrap().clone() {
                        let _ = crate::set_mode(&app, "buddy");
                    }
                }
                Ok(result)
            }
        }
    }
    pub async fn run(self: Arc<Self>) {
        loop {
            let delay = {
                let s = self.store.lock().unwrap();
                if s.timer.active {
                    Duration::from_millis(s.remaining().min(30000))
                } else {
                    Duration::from_secs(60)
                }
            };
            tokio::select! {_=tokio::time::sleep(delay)=>{},_=self.wake.notified()=>{}}
            let (active, remaining) = {
                let s = self.store.lock().unwrap();
                (s.timer.active, s.remaining())
            };
            if active {
                // Checkpoint at most every 30 seconds; a crash never credits unobserved time.
                if remaining == 0 {
                    if self.action("finish", json!({})).is_ok() {
                        self.notify("Focus complete", "Your time is saved. Take a breath.");
                    }
                } else {
                    let mut s = self.store.lock().unwrap();
                    let before_events = s.cloud_events.clone();
                    let before = (
                        s.workspace.clone(),
                        s.timer.clone(),
                        s.rewards.clone(),
                        s.started,
                        s.wall,
                        s.revision,
                    );
                    if s.settle().is_ok() {
                        s.timer.active = true;
                        s.started = Some(Instant::now());
                        s.wall = Utc::now();
                        s.revision += 1;
                        if s.persist().is_err() {
                            s.cloud_events = before_events;
                            (
                                s.workspace,
                                s.timer,
                                s.rewards,
                                s.started,
                                s.wall,
                                s.revision,
                            ) = before;
                            s.timer.active = false;
                            s.started = None;
                            s.timer.reason = "Paused: could not save. Check disk space.".into();
                        }
                    }
                    drop(s);
                    self.changed();
                }
            }
            use chrono::Timelike;
            let reminder = {
                let mut s = self.store.lock().unwrap();
                let now = Local::now();
                let day = now.format("%Y-%m-%d").to_string();
                if now.hour() == s.settings.reminder_hour && s.last_reminder != day {
                    s.last_reminder = day.clone();
                    let count = s.workspace["study"]["tasks"].as_array().map_or(0, |a| {
                        a.iter()
                            .filter(|t| {
                                t["kind"] == "exam"
                                    && t["done"] != true
                                    && t["due"].as_str().is_some_and(|d| d >= day.as_str())
                            })
                            .count()
                    });
                    (count > 0).then_some(format!(
                        "{count} upcoming test(s). A little preparation today."
                    ))
                } else {
                    None
                }
            };
            if let Some(text) = reminder {
                self.notify("Your next orbit", &text);
            }
        }
    }
}
impl Store {
    pub fn remaining(&self) -> u64 {
        self.timer
            .remaining_ms
            .saturating_sub(self.started.map_or(0, |i| i.elapsed().as_millis() as u64))
    }
    fn snapshot(&self, error: Option<String>) -> Value {
        let mut workspace = self.workspace.clone();
        ensure_cat_profiles(&mut workspace);
        if workspace.get("study").is_none() {
            workspace["study"] = empty_workspace()["study"].clone();
        }
        let remaining = self.remaining();
        workspace["study"]["timer"] = json!({"duration":self.timer.duration,"remaining":remaining as f64/1000.0,"endAt":if self.timer.active{Some(Utc::now().timestamp_millis()+remaining as i64)}else{None},"title":self.timer.title,"taskId":self.timer.task_id});
        let mut result = json!({"workspace":workspace,"revision":self.revision,"editRevision":self.edit_revision,"timer":{"duration":self.timer.duration,"remainingMs":remaining,"active":self.timer.active,"title":self.timer.title,"taskId":self.timer.task_id,"courseProfile":self.timer.course_profile,"reason":self.timer.reason},"settings":self.settings,"rewards":{"xp":self.rewards.focused_ms/60000,"level":self.rewards.focused_ms/6000000+1,"chests":(self.rewards.focused_ms/1800000).saturating_sub(self.rewards.opened),"owned":self.rewards.owned,"stars":self.rewards.stars,"focusedMs":self.rewards.focused_ms,"crateProgressMs":self.rewards.focused_ms%1800000,"crateIntervalMs":1800000,"courseMs":self.rewards.course_ms,"growth":growth(self.rewards.focused_ms)},"catalog":COSMETICS.iter().map(|c|json!({"id":c.0,"name":c.1,"rarity":c.2,"slot":cosmetic_slot(c.0)})).collect::<Vec<_>>(),"localError":error});
        let account = self
            .db
            .query_row("SELECT owner FROM cloud_binding WHERE id=1", [], |r| {
                r.get::<_, String>(0)
            })
            .ok();
        result["cloudConnected"] = json!(account.is_some());
        if let Some(owner) = account {
            if let Ok(raw) = self.db.query_row(
                "SELECT snapshot FROM cloud_rewards WHERE owner=?1",
                [owner],
                |r| r.get::<_, String>(0),
            ) {
                if let Ok(mut rewards) = serde_json::from_str::<Value>(&raw) {
                    rewards["growth"] = growth(rewards["focusedMs"].as_u64().unwrap_or(0));
                    if let Some(equipment) = rewards["equipment"].as_object() {
                        for (slot, value) in equipment {
                            result["settings"][slot] = value.clone();
                        }
                    }
                    result["rewards"] = rewards;
                }
            }
        }
        result
    }
    fn settle(&mut self) -> Result<(), String> {
        let elapsed = self
            .started
            .take()
            .map_or(0, |i| i.elapsed().as_millis() as u64)
            .min(self.timer.remaining_ms);
        self.timer.remaining_ms -= elapsed;
        self.timer.active = false;
        if elapsed == 0 {
            return Ok(());
        }
        if let Some(owner) = &self.timer.cloud_owner {
            self.cloud_events.push(json!({"owner":owner,"id":format!("{}:{}",self.timer.session_id,self.wall.timestamp_millis()),"start":self.wall.timestamp_millis(),"end":self.wall.timestamp_millis()+elapsed as i64,"course":self.timer.course_profile}));
        }
        self.rewards.focused_ms += elapsed;
        if let Some(profile) = &self.timer.course_profile {
            *self.rewards.course_ms.entry(profile.clone()).or_default() += elapsed;
        }
        if self.workspace.get("study").is_none() {
            self.workspace["study"] = empty_workspace()["study"].clone();
        }
        let mut cursor = self.wall;
        let mut left = elapsed;
        while left > 0 {
            let day = cursor.with_timezone(&Local).date_naive();
            let next = day
                .succ_opt()
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .earliest()
                .ok_or("Could not resolve local midnight")?
                .with_timezone(&Utc);
            let span = left.min((next - cursor).num_milliseconds().max(1) as u64);
            self.workspace["study"]["sessions"].as_array_mut().ok_or("Invalid session history")?.push(json!({"date":day.to_string(),"minutes":span as f64/60000.0,"title":self.timer.title,"taskId":self.timer.task_id,"orbitSession":self.timer.session_id}));
            cursor += TimeDelta::milliseconds(span as i64);
            left -= span;
        }
        self.wall = Utc::now();
        Ok(())
    }
    fn persist(&mut self) -> Result<(), String> {
        // Compact adjacent checkpoint entries while keeping dates and intentions distinct.
        if let Some(a) = self.workspace["study"]["sessions"].as_array_mut() {
            let mut i = 1;
            while i < a.len() {
                if a[i - 1].get("orbitSession").is_some()
                    && a[i - 1]["orbitSession"] == a[i]["orbitSession"]
                    && a[i - 1]["date"] == a[i]["date"]
                    && a[i - 1]["taskId"] == a[i]["taskId"]
                    && a[i - 1]["title"] == a[i]["title"]
                    && a[i - 1]["minutes"].as_f64().unwrap_or(0.0)
                        + a[i]["minutes"].as_f64().unwrap_or(0.0)
                        <= 1440.0
                {
                    a[i - 1]["minutes"] = json!(
                        a[i - 1]["minutes"].as_f64().unwrap_or(0.0)
                            + a[i]["minutes"].as_f64().unwrap_or(0.0)
                    );
                    a.remove(i);
                } else {
                    i += 1
                }
            }
        }
        let tx = self.db.transaction().map_err(|e| e.to_string())?;
        for event in &self.cloud_events {
            tx.execute(
                "INSERT OR IGNORE INTO cloud_focus(owner,event_id,data) VALUES(?1,?2,?3)",
                params![
                    event["owner"].as_str(),
                    event["id"].as_str(),
                    event.to_string()
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.execute("INSERT INTO cloud_outbox(owner,workspace) SELECT owner,?1 FROM cloud_binding WHERE id=1 ON CONFLICT(owner) DO UPDATE SET workspace=excluded.workspace",[self.workspace.to_string()]).map_err(|e|e.to_string())?;
        tx.execute("INSERT INTO state(id,workspace,revision,timer,settings,rewards,edit_revision) VALUES(1,?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET workspace=excluded.workspace,revision=excluded.revision,timer=excluded.timer,settings=excluded.settings,rewards=excluded.rewards,edit_revision=excluded.edit_revision",params![self.workspace.to_string(),self.revision as i64,serde_json::to_string(&self.timer).unwrap(),serde_json::to_string(&self.settings).unwrap(),serde_json::to_string(&self.rewards).unwrap(),self.edit_revision as i64]).map_err(|e|e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
        self.cloud_events.clear();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cloud_focus_is_account_owned_and_guest_progress_is_restored() {
        let b = backend();
        let guest = b.snapshot()["workspace"].clone();
        b.cloud_bind("owner-a", &guest).unwrap();
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(60));
        }
        b.action("finish", json!({})).unwrap();
        let s = b.store.lock().unwrap();
        let owner: String =
            s.db.query_row("SELECT owner FROM cloud_focus LIMIT 1", [], |r| r.get(0))
                .unwrap();
        assert_eq!(owner, "owner-a");
        assert_eq!(s.rewards.focused_ms / 60000, 1);
        drop(s);
        b.cloud_unbind().unwrap();
        assert_eq!(b.snapshot()["rewards"]["xp"], 0);
        assert_eq!(b.snapshot()["cloudConnected"], false);
        let count: i64 = b
            .store
            .lock()
            .unwrap()
            .db
            .query_row(
                "SELECT count(*) FROM cloud_focus WHERE owner='owner-a'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }
    #[test]
    fn cloud_focus_queue_rolls_back_with_timer_transaction() {
        let b = backend();
        b.cloud_bind("owner-a", &b.snapshot()["workspace"]).unwrap();
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(60));
            s.db.execute_batch("CREATE TRIGGER reject_cloud BEFORE INSERT ON cloud_focus BEGIN SELECT RAISE(ABORT,'disk');END;").unwrap();
        }
        assert!(b.action("pause", json!({})).is_err());
        let s = b.store.lock().unwrap();
        assert!(s.cloud_events.is_empty());
        assert_eq!(s.rewards.focused_ms, 0);
    }
    fn backend() -> Arc<Backend> {
        Backend::open(
            std::env::temp_dir().join(format!("orbit-test-{:016x}", rand::random::<u64>())),
        )
        .unwrap()
    }
    fn study(b: &Backend, seconds: u64) {
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(seconds));
            s.wall = Utc::now() - TimeDelta::seconds(seconds as i64);
        }
        b.action("pause", json!({})).unwrap();
    }
    #[test]
    fn early_finish_and_exactly_once_rewards() {
        let b = backend();
        study(&b, 61);
        let before = b.snapshot();
        assert_eq!(before["rewards"]["xp"], 1);
        b.action("pause", json!({})).unwrap();
        assert_eq!(b.snapshot()["rewards"]["xp"], 1);
        b.action("finish", json!({})).unwrap();
        assert_eq!(b.snapshot()["rewards"]["xp"], 1);
        assert!(
            (b.snapshot()["workspace"]["study"]["sessions"][0]["minutes"]
                .as_f64()
                .unwrap()
                - 61.0 / 60.0)
                .abs()
                < 0.01
        );
    }
    #[test]
    fn checkpoints_and_crash_recovery() {
        let b = backend();
        study(&b, 60);
        b.action("start", json!({})).unwrap();
        let dir = b.dir.clone();
        drop(b);
        let b = Backend::open(dir).unwrap();
        assert_eq!(b.snapshot()["timer"]["active"], false);
        assert_eq!(b.snapshot()["rewards"]["xp"], 1);
        assert!(b.snapshot()["timer"]["reason"]
            .as_str()
            .unwrap()
            .contains("restart"));
    }
    #[test]
    fn import_keeps_history_but_never_grants_xp() {
        let b = backend();
        let mut w = empty_workspace();
        w["study"]["sessions"] = json!([{"date":"2026-10-13","minutes":25,"title":"Read"},{"date":"2026-10-13","minutes":50,"title":"Read"}]);
        b.save_workspace(w, 0, true).unwrap();
        assert_eq!(b.snapshot()["rewards"]["xp"], 0);
        assert_eq!(
            b.snapshot()["workspace"]["study"]["sessions"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert_eq!(std::fs::read_dir(b.dir.join("backups")).unwrap().count(), 1);
    }
    #[test]
    fn stale_saves_preserve_newer_data() {
        let b = backend();
        let mut w = empty_workspace();
        w["study"]["preferences"]["name"] = json!("First");
        b.save_workspace(w.clone(), 0, false).unwrap();
        w["study"]["preferences"]["name"] = json!("Stale");
        assert!(b
            .save_workspace(w, 0, false)
            .unwrap_err()
            .starts_with("Conflict"));
        assert_eq!(
            b.snapshot()["workspace"]["study"]["preferences"]["name"],
            "First"
        );
    }
    #[test]
    fn browser_cannot_forge_focus_credit() {
        let b = backend();
        let mut w = empty_workspace();
        w["study"]["sessions"] = json!([{"date":"2026-10-13","minutes":500,"title":"Fake"}]);
        b.save_workspace(w, 0, false).unwrap();
        assert!(b.snapshot()["workspace"]["study"]["sessions"]
            .as_array()
            .unwrap()
            .is_empty());
        assert_eq!(b.snapshot()["rewards"]["xp"], 0);
    }
    #[test]
    fn midnight_splits_credit() {
        let b = backend();
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            let midnight = Local::now()
                .date_naive()
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            s.wall = midnight - TimeDelta::seconds(30);
            s.started = Some(Instant::now() - Duration::from_secs(60));
        }
        b.action("power-pause", json!({})).unwrap();
        let v = b.snapshot();
        let a = v["workspace"]["study"]["sessions"].as_array().unwrap();
        assert_eq!(a.len(), 2);
        assert_ne!(a[0]["date"], a[1]["date"]);
        assert!(!v["timer"]["active"].as_bool().unwrap());
    }
    #[test]
    fn chest_duplicate_protection_and_completion() {
        let b = backend();
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 49 * 1800000;
        }
        for _ in 0..48 {
            b.action("chest", json!({})).unwrap();
        }
        let owned = b.snapshot()["rewards"]["owned"].as_array().unwrap().clone();
        assert_eq!(owned.len(), 51);
        let set: std::collections::HashSet<_> = owned.iter().map(|v| v.as_str().unwrap()).collect();
        assert_eq!(set.len(), 51);
        b.action("chest", json!({})).unwrap();
        assert_eq!(b.snapshot()["rewards"]["stars"], 1);
    }
    #[test]
    fn failed_database_write_rolls_back_rewards() {
        let b = backend();
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(60));
            s.db.execute_batch("CREATE TRIGGER reject_write BEFORE UPDATE ON state BEGIN SELECT RAISE(ABORT,'disk test'); END;").unwrap();
        }
        assert!(b.action("pause", json!({})).is_err());
        assert_eq!(b.snapshot()["rewards"]["xp"], 0);
    }
    #[test]
    fn catalog_counts() {
        assert_eq!(COSMETICS.iter().filter(|c| c.2 == "common").count(), 26);
        assert_eq!(COSMETICS.iter().filter(|c| c.2 == "rare").count(), 17);
        assert_eq!(COSMETICS.iter().filter(|c| c.2 == "mythic").count(), 8);
    }
    #[test]
    fn timer_progress_does_not_conflict_with_task_edits() {
        let b = backend();
        let w = empty_workspace();
        let revision = b.snapshot()["editRevision"].as_u64().unwrap();
        study(&b, 60);
        b.save_workspace(w, revision, false).unwrap();
        assert_eq!(b.snapshot()["rewards"]["xp"], 1);
        assert!(!b.snapshot()["workspace"]["study"]["sessions"]
            .as_array()
            .unwrap()
            .is_empty());
    }
    #[test]
    fn finishing_allows_import_and_malformed_data_is_rejected() {
        let b = backend();
        study(&b, 1);
        b.action("finish", json!({})).unwrap();
        b.save_workspace(empty_workspace(), 0, true).unwrap();
        let mut w = empty_workspace();
        w["study"]["tasks"] = json!([{"id":"bad","title":"","due":"not-a-date"}]);
        assert!(b.save_workspace(w, 1, true).is_err());
        assert!(b.snapshot()["workspace"]["study"]["tasks"]
            .as_array()
            .unwrap()
            .is_empty());
    }
    #[test]
    fn old_settings_have_safe_buddy_defaults() {
        let settings: Settings =
            serde_json::from_value(json!({"pinned":true,"appearance":"rose"})).unwrap();
        assert_eq!(settings.buddy_width, 420);
        assert_eq!(settings.buddy_height, 220);
        assert!(settings.pinned);
        assert_eq!(settings.appearance, "rose");
        let b = backend();
        assert!(b.action("settings", json!({"buddyWidth":100})).is_err());
        assert_eq!(b.snapshot()["settings"]["buddyWidth"], 420);
        b.action("settings", json!({"buddyWidth":360,"buddyHeight":200}))
            .unwrap();
        assert_eq!(b.snapshot()["settings"]["buddyHeight"], 200);
    }
    #[test]
    fn thirty_minute_crates_and_legacy_entitlement() {
        let b = backend();
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 1799999;
        }
        assert!(b.action("chest", json!({})).is_err());
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 1800000;
        }
        b.action("chest", json!({})).unwrap();
        assert_eq!(b.snapshot()["rewards"]["chests"], 0);
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 3600000;
        }
        assert_eq!(b.snapshot()["rewards"]["chests"], 1);
        assert_eq!(b.snapshot()["rewards"]["xp"], 60);
        let legacy: Rewards = serde_json::from_value(
            json!({"focusedMs":3600000,"opened":1,"owned":["rose"],"stars":2}),
        )
        .unwrap();
        assert!(legacy.course_ms.is_empty());
        assert_eq!(legacy.opened, 1);
        assert_eq!(legacy.owned, vec!["rose"]);
    }
    #[test]
    fn growth_thresholds() {
        for (hours, stage) in [
            (0, 0),
            (1, 0),
            (2, 1),
            (7, 1),
            (8, 2),
            (19, 2),
            (20, 3),
            (50, 3),
        ] {
            assert_eq!(growth(hours * 3600000)["stage"], stage);
        }
        assert!(growth(20 * 3600000)["nextAtMs"].is_null());
    }
    #[test]
    fn island_settings_migrate_without_losing_appearance() {
        let b = backend();
        let dir = b.dir.clone();
        {
            let mut s = b.store.lock().unwrap();
            s.settings.island_version = 0;
            s.settings.buddy_width = 280;
            s.settings.buddy_height = 320;
            s.settings.position = Some((50, 70));
            s.settings.appearance = "rose".into();
            s.persist().unwrap();
        }
        drop(b);
        let b = Backend::open(dir).unwrap();
        let v = b.snapshot();
        assert_eq!(v["settings"]["buddyWidth"], 420);
        assert_eq!(v["settings"]["buddyHeight"], 220);
        assert_eq!(v["settings"]["appearance"], "rose");
        assert_eq!(v["settings"]["position"], json!([50, 70]));
    }
    #[test]
    fn course_growth_keeps_captured_identity_and_survives_restart() {
        let b = backend();
        let mut w = empty_workspace();
        w["study"]["tasks"] = json!([{"id":"course-task","title":"Read","course":"PSY 401","due":"2026-10-20","estimate":60,"done":false,"kind":"assignment","steps":[]}]);
        b.save_workspace(w, 0, false).unwrap();
        b.action("configure", json!({"taskId":"course-task","duration":50}))
            .unwrap();
        b.action("start", json!({})).unwrap();
        let code = b
            .store
            .lock()
            .unwrap()
            .timer
            .course_profile
            .clone()
            .unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(60));
        }
        b.action("pause", json!({})).unwrap();
        let mut w = b.snapshot()["workspace"].clone();
        w["study"]["tasks"][0]["course"] = json!("MAT 221");
        b.save_workspace(w, 1, false).unwrap();
        b.action("toggle", json!({})).unwrap();
        assert_eq!(
            b.store.lock().unwrap().timer.course_profile.as_ref(),
            Some(&code)
        );
        {
            let mut s = b.store.lock().unwrap();
            s.started = Some(Instant::now() - Duration::from_secs(60));
        }
        b.action("pause", json!({})).unwrap();
        let dir = b.dir.clone();
        drop(b);
        let b = Backend::open(dir).unwrap();
        assert!(b.snapshot()["rewards"]["courseMs"][&code].as_u64().unwrap() >= 120000);
        assert_eq!(b.snapshot()["rewards"]["xp"], 2);
    }
    #[test]
    fn reward_categories_and_failed_chest_are_atomic() {
        let b = backend();
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 1800000;
            s.db.execute_batch("CREATE TRIGGER reject_chest BEFORE UPDATE ON state BEGIN SELECT RAISE(ABORT,'disk test'); END;").unwrap();
        }
        assert!(b.action("chest", json!({})).is_err());
        assert_eq!(
            b.snapshot()["rewards"]["owned"].as_array().unwrap().len(),
            3
        );
        assert_eq!(b.snapshot()["rewards"]["chests"], 1);
        assert!(b.action("settings", json!({"habitat":"mint"})).is_err());
    }
    #[test]
    fn opening_at_deadline_does_not_restart_completed_focus() {
        let b = backend();
        b.action("configure", json!({"duration":1})).unwrap();
        b.action("start", json!({})).unwrap();
        {
            let mut s = b.store.lock().unwrap();
            s.rewards.focused_ms = 29 * 60000;
            s.started = Some(Instant::now() - Duration::from_secs(90));
        }
        b.action("chest", json!({})).unwrap();
        let v = b.snapshot();
        assert_eq!(v["timer"]["active"], false);
        assert_eq!(v["timer"]["remainingMs"], 0);
        assert_eq!(v["rewards"]["xp"], 30);
        assert_eq!(v["rewards"]["chests"], 0);
    }
}
