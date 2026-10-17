//! The bundled UI requests updates; remote/paired pages receive no updater API.
use crate::engine::Backend;
use serde_json::{json, Value};
use std::{sync::Arc, time::Duration};
use tauri::{Emitter, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::Mutex;

#[derive(Default)]
pub struct Updates(Mutex<Option<Update>>);

#[tauri::command]
pub async fn check_update(
    app: tauri::AppHandle,
    state: State<'_, Updates>,
) -> Result<Value, String> {
    let mut pending = state
        .0
        .try_lock()
        .map_err(|_| "An update operation is already running.")?;
    *pending = None;
    let result = app
        .updater_builder()
        .timeout(Duration::from_secs(25))
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await;
    match result {
        Ok(Some(update)) => {
            let info = json!({"available":true,"version":update.version,"currentVersion":app.package_info().version.to_string(),"notes":update.body});
            *pending = Some(update);
            Ok(info)
        }
        Ok(None) => Ok(json!({"available":false,"currentVersion":app.package_info().version.to_string()})),
        Err(_) => Err("Could not reach the update feed. Check your connection, or try again after an Orbiter release is published.".into()),
    }
}

#[tauri::command]
pub async fn install_update(
    app: tauri::AppHandle,
    state: State<'_, Updates>,
    backend: State<'_, Arc<Backend>>,
) -> Result<(), String> {
    let mut pending = state
        .0
        .try_lock()
        .map_err(|_| "An update operation is already running.")?;
    let update = pending
        .as_ref()
        .ok_or("Check for updates again before installing.")?;
    let mut downloaded = 0u64;
    let mut last_percent = 101u64;
    let bytes = update
        .download(
            |chunk, total| {
                downloaded += chunk as u64;
                let percent = total
                    .filter(|n| *n > 0)
                    .map(|n| (downloaded * 100 / n).min(100));
                if percent.unwrap_or(0) != last_percent {
                    last_percent = percent.unwrap_or(0);
                    let _ = app.emit("orbiter-update-progress", json!({"percent":percent}));
                }
            },
            || {},
        )
        .await
        .map_err(|e| format!("Update download or signature verification failed: {e}"))?;
    // Download/signature verification completes before interrupting a focus session.
    backend.action(
        "power-pause",
        json!({"reason":"Paused to update Orbiter. Resume when ready."}),
    )?;
    let backup = backend.dir.join("backups").join(format!(
        "before-update-{}.json",
        chrono::Utc::now().timestamp_millis()
    ));
    std::fs::write(
        backup,
        serde_json::to_vec_pretty(&backend.snapshot()["workspace"]).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    // On Windows the plugin starts NSIS and exits this process itself.
    update
        .install(bytes)
        .map_err(|e| format!("Could not start the installer: {e}"))?;
    *pending = None;
    #[cfg(not(windows))]
    app.restart();
    Ok(())
}
