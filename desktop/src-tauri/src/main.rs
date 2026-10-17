#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod cloud;
mod engine;
mod model;
mod power;
mod server;
mod updates;
use engine::Backend;
use serde_json::{json, Value};
use server::Access;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, LogicalSize, Manager, PhysicalPosition, State, WebviewUrl, WebviewWindowBuilder,
    WindowEvent,
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn snapshot(backend: State<Arc<Backend>>) -> Value {
    backend.snapshot()
}
#[tauri::command]
fn ui_ready(
    app: tauri::AppHandle,
    backend: State<Arc<Backend>>,
    diagnostics: Option<Value>,
) -> Result<bool, String> {
    // Opt-in local acceptance measurements; no telemetry or writes in ordinary use.
    let measuring = std::env::args().any(|a| a == "--measure");
    if measuring {
        if let Some(w) = app.get_webview_window("buddy") {
            let size = w.inner_size().map_err(|e| e.to_string())?;
            std::fs::write(backend.dir.join("ui-ready.json"),json!({"ready":true,"identifier":app.config().identifier,"width":size.width,"height":size.height,"diagnostics":diagnostics,"scale":w.scale_factor().unwrap_or(1.0),"mode":if app.state::<WindowMode>().planner.load(Ordering::SeqCst){"planner"}else{"buddy"}}).to_string()).map_err(|e|e.to_string())?;
        }
    }
    Ok(measuring)
}
#[tauri::command]
fn action(
    action: String,
    args: Value,
    backend: State<Arc<Backend>>,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let result = backend.action(&action, args)?;
    if let Some(w) = app.get_webview_window("buddy") {
        let _ = w.set_always_on_top(
            result["settings"]["pinned"] == true
                && !app.state::<WindowMode>().planner.load(Ordering::SeqCst),
        );
    }
    Ok(result)
}
#[tauri::command]
fn save_workspace(
    workspace: Value,
    revision: u64,
    import: bool,
    backend: State<Arc<Backend>>,
) -> Result<Value, String> {
    backend.save_workspace(workspace, revision, import)
}
#[tauri::command]
fn open_scheduler(app: tauri::AppHandle) -> Result<(), String> {
    set_mode(&app, "planner")
}
#[tauri::command]
fn open_browser(app: tauri::AppHandle, access: State<Arc<Access>>) -> Result<(), String> {
    if let Some(e) = access.backend.local_error.lock().unwrap().clone() {
        return Err(e);
    }
    app.opener()
        .open_url(access.link(), None::<&str>)
        .map_err(|e| e.to_string())
}
#[derive(Default)]
struct WindowMode {
    planner: AtomicBool,
    changing: AtomicBool,
    resize_check: AtomicBool,
    expanded: AtomicBool,
}
#[tauri::command]
fn window_mode(app: tauri::AppHandle) -> Value {
    json!({"mode":if app.state::<WindowMode>().planner.load(Ordering::SeqCst){"planner"}else{"buddy"}})
}
#[tauri::command]
fn switch_mode(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    set_mode(&app, &mode)
}
#[tauri::command]
fn buddy_size(app: tauri::AppHandle, width: u32, height: u32) -> Result<Value, String> {
    let result = app
        .state::<Arc<Backend>>()
        .action("settings", json!({"buddyWidth":width,"buddyHeight":height}))?;
    if !app.state::<WindowMode>().planner.load(Ordering::SeqCst)
        && !app.state::<WindowMode>().expanded.load(Ordering::SeqCst)
    {
        set_mode(&app, "buddy")?;
    }
    Ok(result)
}
#[tauri::command]
fn buddy_presentation(app: tauri::AppHandle, kind: String) -> Result<(), String> {
    if !["compact", "options", "reward"].contains(&kind.as_str()) {
        return Err("Unknown island view".into());
    }
    if app.state::<WindowMode>().planner.load(Ordering::SeqCst) {
        return Ok(());
    }
    let state = app.state::<WindowMode>();
    state.expanded.store(kind != "compact", Ordering::SeqCst);
    state.changing.store(true, Ordering::SeqCst);
    let settings = app
        .state::<Arc<Backend>>()
        .store
        .lock()
        .unwrap()
        .settings
        .clone();
    if let Some(w) = app.get_webview_window("buddy") {
        let (width, height) = match kind.as_str() {
            "options" => (settings.buddy_width.max(420), 560),
            "reward" => (settings.buddy_width.max(420), 520),
            _ => (settings.buddy_width, settings.buddy_height),
        };
        w.set_size(LogicalSize::new(width as f64, height as f64))
            .map_err(|e| e.to_string())?;
        if let Ok(p) = w.outer_position() {
            let (x, y) = if kind == "compact" {
                settings.position.unwrap_or((p.x, p.y))
            } else {
                (p.x, p.y)
            };
            w.set_position(clamp_position(&w, x, y))
                .map_err(|e| e.to_string())?;
        }
    }
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        handle
            .state::<WindowMode>()
            .changing
            .store(false, Ordering::SeqCst);
    });
    Ok(())
}
#[tauri::command]
fn window_control(app: tauri::AppHandle, action: String) -> Result<(), String> {
    let w = app
        .get_webview_window("buddy")
        .ok_or("Window unavailable")?;
    match action.as_str() {
        "minimize" => w.minimize().map_err(|e| e.to_string()),
        "planner" => set_mode(&app, "planner"),
        "close" => app
            .emit("orbiter-close-request", ())
            .map_err(|e| e.to_string()),
        _ => Err("Unknown window action".into()),
    }
}
fn clamp_position(w: &tauri::WebviewWindow, x: i32, y: i32) -> PhysicalPosition<i32> {
    let monitors = w.available_monitors().unwrap_or_default();
    let size = w.outer_size().unwrap_or_default();
    if let Some(m) = monitors
        .iter()
        .find(|m| {
            x >= m.position().x
                && x < m.position().x + m.size().width as i32
                && y >= m.position().y
                && y < m.position().y + m.size().height as i32
        })
        .or_else(|| monitors.first())
    {
        // Respect the usable desktop, including taskbars on any screen edge.
        let work = m.work_area();
        let p = &work.position;
        let s = &work.size;
        PhysicalPosition::new(
            x.clamp(p.x, p.x + (s.width.saturating_sub(size.width)) as i32),
            y.clamp(p.y, p.y + (s.height.saturating_sub(size.height)) as i32),
        )
    } else {
        PhysicalPosition::new(x, y)
    }
}
pub fn set_mode(app: &tauri::AppHandle, mode: &str) -> Result<(), String> {
    if !["buddy", "planner"].contains(&mode) {
        return Err("Unknown window mode".into());
    }
    if app.get_webview_window("buddy").is_none() {
        show_buddy(app)?;
    }
    let state = app.state::<WindowMode>();
    state.changing.store(true, Ordering::SeqCst);
    state.planner.store(mode == "planner", Ordering::SeqCst);
    state.expanded.store(false, Ordering::SeqCst);
    let w = app
        .get_webview_window("buddy")
        .ok_or("Window unavailable")?;
    let settings = app
        .state::<Arc<Backend>>()
        .store
        .lock()
        .unwrap()
        .settings
        .clone();
    let result = (|| -> tauri::Result<()> {
        w.set_title(if mode == "planner" {
            "Orbiter"
        } else {
            "Orbiter Study Buddy"
        })?;
        if mode == "planner" {
            w.set_decorations(true)?;
            w.set_shadow(true)?;
            w.set_background_color(Some(tauri::window::Color(20, 29, 41, 255)))?;
            w.set_max_size(None::<LogicalSize<f64>>)?;
            w.set_min_size(Some(LogicalSize::new(800.0, 600.0)))?;
            w.set_always_on_top(false)?;
            w.maximize()?;
        } else {
            w.unmaximize()?;
            w.set_decorations(false)?;
            w.set_shadow(false)?;
            w.set_background_color(Some(tauri::window::Color(0, 0, 0, 0)))?;
            w.set_min_size(Some(LogicalSize::new(360.0, 200.0)))?;
            w.set_max_size(None::<LogicalSize<f64>>)?;
            w.set_size(LogicalSize::new(
                settings.buddy_width as f64,
                settings.buddy_height as f64,
            ))?;
            w.set_always_on_top(settings.pinned)?;
            if let Some((x, y)) = settings.position {
                w.set_position(clamp_position(&w, x, y))?;
            }
        }
        w.unminimize()?;
        w.show()?;
        w.set_focus()?;
        Ok(())
    })();
    let _ = app.emit("orbiter-mode", mode);
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        handle
            .state::<WindowMode>()
            .changing
            .store(false, Ordering::SeqCst);
    });
    result.map_err(|e| e.to_string())
}
#[tauri::command]
fn close_buddy(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("buddy") {
        if !app.state::<WindowMode>().planner.load(Ordering::SeqCst) {
            if let Ok(p) = w.outer_position() {
                let _ = app
                    .state::<Arc<Backend>>()
                    .action("position", json!({"x":p.x,"y":p.y}));
            }
        }
        let _ = app.state::<Arc<Backend>>().action("settings", json!({}));
        w.destroy().map_err(|e| e.to_string())?
    }
    Ok(())
}
#[tauri::command]
async fn export_workspace(
    app: tauri::AppHandle,
    backend: State<'_, Arc<Backend>>,
) -> Result<(), String> {
    let bytes =
        serde_json::to_vec_pretty(&backend.snapshot()["workspace"]).map_err(|e| e.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(file) = app
            .dialog()
            .file()
            .set_file_name("Scheduler-backup.json")
            .add_filter("Scheduler JSON", &["json"])
            .blocking_save_file()
        {
            std::fs::write(file.into_path().map_err(|e| e.to_string())?, bytes)
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
fn open_backups(app: tauri::AppHandle, backend: State<Arc<Backend>>) -> Result<(), String> {
    app.opener()
        .open_path(backend.dir.join("backups").to_string_lossy(), None::<&str>)
        .map_err(|e| e.to_string())
}
fn show_buddy(app: &tauri::AppHandle) -> Result<(), String> {
    if app.get_webview_window("buddy").is_some() {
        return set_mode(app, "buddy");
    }
    app.state::<WindowMode>()
        .planner
        .store(false, Ordering::SeqCst);
    let backend = app.state::<Arc<Backend>>();
    let settings = backend.store.lock().unwrap().settings.clone();
    let page = if std::env::args().any(|a| a == "--measure-expanded") {
        "Application.html?expanded=1"
    } else {
        "Application.html"
    };
    let w = WebviewWindowBuilder::new(app, "buddy", WebviewUrl::App(page.into()))
        .title("Orbiter Study Buddy")
        .inner_size(settings.buddy_width as f64, settings.buddy_height as f64)
        .min_inner_size(360.0, 200.0)
        .decorations(false)
        .shadow(false)
        .transparent(true)
        .resizable(true)
        .always_on_top(settings.pinned)
        .skip_taskbar(false)
        .build()
        .map_err(|e| e.to_string())?;
    if let Some((x, y)) = settings.position {
        let _ = w.set_position(clamp_position(&w, x, y));
    }
    if std::env::args().any(|a| a == "--measure") {
        let _ = w.set_title("Orbiter — temporary performance check");
        if let Ok(Some(m)) = w.current_monitor() {
            let area = m.work_area();
            if let Ok(size) = w.outer_size() {
                let _ = w.set_position(PhysicalPosition::new(
                    area.position.x + area.size.width as i32 - size.width as i32 - 24,
                    area.position.y + area.size.height as i32 - size.height as i32 - 24,
                ));
            }
        }
    }
    // Measurement mode must be established natively, not depend on a query-string
    // interpretation by the bundled asset protocol before readiness is reported.
    if std::env::args().any(|a| a == "--measure-expanded") {
        set_mode(app, "planner")?;
    }
    let _ = w.show();
    let _ = w.set_focus();
    let handle = app.clone();
    w.on_window_event(move |e| match e {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            if handle.get_webview_window("buddy").is_some() {
                let _ = handle.emit("orbiter-close-request", ());
            }
        }
        WindowEvent::Resized(size) => {
            let mode = handle.state::<WindowMode>();
            if !mode.changing.load(Ordering::SeqCst)
                && !mode.resize_check.swap(true, Ordering::SeqCst)
            {
                let app = handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(80));
                    let state = app.state::<WindowMode>();
                    if !state.changing.load(Ordering::SeqCst) {
                        if let Some(w) = app.get_webview_window("buddy") {
                            let max = w.is_maximized().unwrap_or(false);
                            if w.is_minimized().unwrap_or(false) {
                                state.resize_check.store(false, Ordering::SeqCst);
                                return;
                            }
                            if max != state.planner.load(Ordering::SeqCst) {
                                let _ = set_mode(&app, if max { "planner" } else { "buddy" });
                            } else if !max
                                && !w.is_minimized().unwrap_or(false)
                                && !state.expanded.load(Ordering::SeqCst)
                            {
                                if let Ok(size) = w.inner_size() {
                                    let scale = w.scale_factor().unwrap_or(1.0);
                                    let width = (size.width as f64 / scale).round() as u32;
                                    let height = (size.height as f64 / scale).round() as u32;
                                    if !(360..=560).contains(&width)
                                        || !(200..=300).contains(&height)
                                    {
                                        let _ = w.set_size(LogicalSize::new(
                                            width.clamp(360, 560) as f64,
                                            height.clamp(200, 300) as f64,
                                        ));
                                    }
                                }
                            }
                        }
                    }
                    state.resize_check.store(false, Ordering::SeqCst);
                });
            }
            if !mode.changing.load(Ordering::SeqCst) {
                if let Some(w) = handle.get_webview_window("buddy") {
                    let maximized = w.is_maximized().unwrap_or(false);
                    // Never change native placement inside WM_SIZE; deferred handling avoids reentrancy.
                    if !maximized
                        && !mode.planner.load(Ordering::SeqCst)
                        && !w.is_minimized().unwrap_or(false)
                        && !mode.expanded.load(Ordering::SeqCst)
                    {
                        let scale = w.scale_factor().unwrap_or(1.0);
                        let b = handle.state::<Arc<Backend>>();
                        let mut s = b.store.lock().unwrap();
                        s.settings.buddy_width =
                            ((size.width as f64 / scale).round() as u32).clamp(360, 560);
                        s.settings.buddy_height =
                            ((size.height as f64 / scale).round() as u32).clamp(200, 300);
                    }
                }
            }
        }
        WindowEvent::Moved(p) => {
            let b = handle.state::<Arc<Backend>>();
            // Dragging should not rewrite SQLite or re-render on every mouse move.
            if !handle.state::<WindowMode>().planner.load(Ordering::SeqCst)
                && !handle.state::<WindowMode>().changing.load(Ordering::SeqCst)
            {
                b.store.lock().unwrap().settings.position = Some((p.x, p.y));
            }
        }
        _ => {}
    });
    Ok(())
}
fn main() {
    tauri::Builder::default()
        .manage(WindowMode::default())
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            if args.iter().any(|a| a == "--hide") {
                let _ = close_buddy(app.clone());
            } else if args.iter().any(|a| a == "--quit") {
                let _ = app
                    .state::<Arc<Backend>>()
                    .action("power-pause", json!({"reason":"Paused when Orbiter quit."}));
                app.exit(0);
            } else if args.iter().any(|a| a == "--planner") {
                let _ = set_mode(app, "planner");
            } else if !args.iter().any(|a| a == "--quiet") {
                let _ = show_buddy(app);
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updates::Updates::default())
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .args(["--quiet"])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            updates::check_update,
            updates::install_update,
            snapshot,
            ui_ready,
            action,
            save_workspace,
            open_scheduler,
            open_browser,
            window_mode,
            switch_mode,
            buddy_size,
            buddy_presentation,
            window_control,
            close_buddy,
            export_workspace,
            open_backups,
            cloud::cloud_command
        ])
        .setup(|app| {
            let backend = Backend::open(
                std::env::args()
                    .skip_while(|a| a != "--profile-dir")
                    .nth(1)
                    .map(std::path::PathBuf::from)
                    .unwrap_or(app.path().app_local_data_dir()?),
            )
            .map_err(std::io::Error::other)?;
            *backend.app.lock().unwrap() = Some(app.handle().clone());
            let access = Access::new(backend.clone());
            #[cfg(debug_assertions)]
            if let Some(file) = std::env::args()
                .skip_while(|a| a != "--qa-pair-file")
                .nth(1)
            {
                std::fs::write(file, access.link())?;
            }
            app.manage(backend.clone());
            let cloud = cloud::Cloud::open(backend.clone()).map_err(std::io::Error::other)?;
            app.manage(cloud.clone());
            cloud.start();
            app.manage(access.clone());
            let show = MenuItem::with_id(app, "show", "Show companion", true, None::<&str>)?;
            let timer = MenuItem::with_id(app, "timer", "Start / pause focus", true, None::<&str>)?;
            let web = MenuItem::with_id(app, "scheduler", "Open Orbiter", true, None::<&str>)?;
            let browser = MenuItem::with_id(
                app,
                "browser",
                "Open paired browser (optional)",
                true,
                None::<&str>,
            )?;
            let quit = MenuItem::with_id(app, "quit", "Quit Orbiter", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &timer, &web, &browser, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Orbiter — your study buddy")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        let _ = show_buddy(app);
                    }
                    "timer" => {
                        let _ = app.state::<Arc<Backend>>().action("toggle", json!({}));
                    }
                    "scheduler" => {
                        let _ = set_mode(app, "planner");
                    }
                    "browser" => {
                        let a = app.state::<Arc<Access>>();
                        if a.backend.local_error.lock().unwrap().is_none() {
                            let _ = app.opener().open_url(a.link(), None::<&str>);
                        }
                    }
                    "quit" => {
                        let _ = app
                            .state::<Arc<Backend>>()
                            .action("power-pause", json!({"reason":"Paused when Orbiter quit."}));
                        app.exit(0)
                    }
                    _ => {}
                })
                .build(app)?;
            power::listen(backend.clone());
            tauri::async_runtime::spawn(backend.run());
            // Measurement-only builds never compete with the user's paired website port.
            if !std::env::args().any(|a| a == "--measure") {
                tauri::async_runtime::spawn(server::serve(access));
            }
            // Optional startup opens quietly in the tray; ordinary launches show the buddy.
            if !std::env::args().any(|a| a == "--quiet") {
                show_buddy(app.handle()).map_err(std::io::Error::other)?;
            }
            // Reading startup state never enables it.
            let _ = app.autolaunch().is_enabled();
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Orbit could not start. See desktop setup instructions.")
        .run(|_, event| {
            if let tauri::RunEvent::ExitRequested {
                code: None, api, ..
            } = event
            {
                api.prevent_exit();
            }
        });
}
