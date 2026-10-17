# Orbiter for Windows

An autonomous study buddy built with Tauri 2, Rust, SQLite and bundled HTML/CSS and Three.js. The browser and Python are not required to run it. The full planner is bundled into the same native window; an optional paired website remains available on this PC.

## First use

Open **Orbiter** from Desktop/Start, or double-click `Open Orbiter.cmd`. The installed executable is `C:\Users\kgsat\AppData\Local\Orbiter\orbit-companion.exe`; the simple installer is `build\release\Orbiter Setup.exe` (version 0.5.0).

- Orbiter launches as a rounded 420 × 220 floating island. Click the cat, the doorway action, or the island's ↗ control to open the full scheduler **inside the same app**. The planner has ordinary Windows controls; Restore returns to the island, and minimize uses the taskbar.
- Starting or resuming focus automatically returns to buddy mode. You can reopen the planner during focus. Focus Room has been replaced by these two modes.
- **Buddy options → Appearance** provides size presets and custom dimensions from 360 × 200 to 560 × 300. Drag the ORBITER heading or use the lower-right resize grip. Options and rewards temporarily expand without changing the saved compact size.
- **Keep above other windows** starts enabled for the island, including the upgrade from the older buddy. Turn it off in options if preferred. It never pins the full planner.
- In the native planner, click the main My Day cat (or focus it and press Enter/Space) to return to the island. Your open drafts and focus timer are preserved.
- Workspace uses glass action tiles; buttons and course notes follow the chosen accent. Solid mode retains rounded calendars and opaque accessible surfaces. My Rhythm follows Mint, Lilac, or Apricot rather than forcing a page accent.
- Tasks, tests and recurring practice are created in the full planner. Buddy options selects the focus intention, 25/50/60-minute presets or custom duration.
- **Buddy options → Import backup** imports the previous browser workspace; export that workspace first from its original address (port 8003). Ordinary browser sites continue to use their own local storage. Import replaces native study data and creates a recovery copy.
- Closing keeps Orbiter in the tray and releases the webview. Unsaved planner edits offer Save/Discard/Cancel. **Quit Orbiter** pauses and persists focus before exit.
- The tray's **Open paired browser (optional)** is the only action that opens an external browser. The bundled planner works offline without Python, Node or the local server.

The animated cat is an original Blender-built GLB rendered with the existing Three.js engine. Editable model sources and export instructions are in `design/avatar/`; Blender is not required to run Orbiter. Courses keep unique profiles combining coat, ears, scarf and charm. A new main cat is selected on fresh loads, while mode switches retain it; task-linked focus uses the course cat. Head pats and typing reactions operate only inside Orbiter. Reduced motion stops ambient movement. A static illustration appears if WebGL is unavailable.

## Cosmic worlds and equipment

Appearance studio offers Tidal Night, Lunar Mist and Opal Dawn, decorative atmosphere strength, independent motion intensity, and Auto/Low/High quality. Changes stay in the preview until Apply. Auto reduces resolution if sustained rendering cost exceeds its budget; Low uses 1x resolution. Zero motion and reduced motion stop the render loop.

In Discoveries, select an owned or locked item to try it on the live cat. **Equip** saves owned items; **Cancel preview**, Escape or closing restores the previous collection. Locked items are labeled and cannot be equipped. Habitats fill the cat environment and tint the wider planner/island. Existing XP, crate odds and ownership are unchanged.

The live scene uses one WebGL context, including previews. Course portraits are cached. Rendering is capped at 30 FPS and suspended when hidden. See `docs/VERIFICATION-0.6.0.md` for measured resource use and outstanding live release checks.

## Everyday study and appearance

- Choose an intention and duration in My Day. The hero and timer share that intention; Pause/Resume, Finish, and task details stay in fixed control areas. An in-progress native session must be finished before changing its intention or duration.
- **Appearance studio**, available through planner preferences and buddy options, previews planner/buddy styling before Apply. Try Tidal Night, Lunar Mist, or Opal Dawn, your accent/material, and atmosphere strength. Cancel preview restores saved choices; Reset resets appearance only. Save preferences also commits the current preview.
- Frequent menus use short local transitions. The signature wave remains for applied scene changes and Week in orbit. Reduced motion suppresses decoration without blocking typing.
- Habitats develop from resting stone to pool, lantern, and celestial garden using the existing 0/2/8/20-hour milestones. Course identity and owned cosmetics remain intact.
- Finish or complete focus to see actual credited time, exam budget reduction, confirmed rewards, and growth in a session recap. Cloud credit can remain pending; confirmed account totals are explicitly labeled as totals. Done acknowledges the recap. Reopen it through **Latest session** or My Day without awarding time again.
- Before synchronizing the new appearance preferences, apply `supabase/migrations/202610160001_appearance.sql` through Supabase's SQL editor. This local build does not change your hosted database.

## Updates

Open **Check for updates** in planner preferences or buddy settings. Startup checks are optional. Save open edits, then choose **Download and restart** to install a verified release; focus pauses before installation. The first updater-enabled version requires manual installation. The release feed must be published on GitHub before checks can return updates. See [update and signing instructions](../docs/UPDATES.md).

## Time and progress

- Locking Windows or sleeping pauses focus. Resuming is deliberate. Restart/crash recovery starts paused; at most the uncheckpointed portion (up to 30 seconds) can be lost, and unattended time is never credited.
- Focus uses a monotonic clock. Recorded time is split at local midnight and linked to the selected item. Tests have one test date and a decreasing preparation budget. Manual study logs and imported history remain separate from earned XP.
- Each whole focused minute earns 1 XP, each 100 XP advances a level, and each 30 minutes earns a crate. Partial minutes accumulate across sessions. The shorter interval also applies to previously tracked focus; existing openings and ownership are retained.
- The island and My Day show a crate and level bar. Click a ready crate to reveal a discovery, then Equip; click ✧ for the preview collection. Unready crates explain the remaining focus time.
- 51 original cosmetics: the previous 15 plus 12 looks, 12 accessories, and 12 habitat decorations. Totals: 26 common, 17 rare, eight mythic. Three starter cosmetics remain equipped. Available tiers use weights 70/25/5; completed tiers redistribute proportionally. Every draw is new. Complete collections earn visible constellation stars.
- Cats grow through Baby, Kitten (2 hours), Young Cat (8 hours), and Adult (20 hours), with gradual changes between milestones. Each course tracks its own native focus; the main cat uses overall focus. Historical total focus counts for the main cat. Course growth starts with newly attributable native focus and retains the course captured at session start.
- There are no purchases, advertising, expiry dates, streak penalties or global input tracking.

## Storage, recovery and local sync

Ordinary profiles live in `%LOCALAPPDATA%\com.kgsato.orbit`. `orbit.sqlite3` stores workspace, timer, cosmetics, cat growth and settings in atomic transactions with a versioned schema. `backups` contains pre-import Scheduler JSON snapshots. **Show recovery backups** opens that folder. Export/import JSON restores study data and course identities; it does not export or grant reward balances or growth credits. To preserve the entire profile, quit Orbiter before copying its data directory.

The local website binds to `127.0.0.1:18743` only, without firewall changes. Tray-generated pairing links expire after 60 seconds and are single use. Paired sessions expire after 12 hours or app restart. Browser writes use CSRF tokens and edit revisions; SSE delivers changes. A conflicting browser draft is retained in that tab's session storage: **Your workspace → Export unsaved draft**, then **Reload shared workspace**, before reapplying edits. A conflicting companion form stays open for review.

The native process owns timer and focus history. Browser clients cannot grant rewards or overwrite native elapsed time. If the local port is occupied, the buddy still works and shows the website connection error. Phone access, cloud accounts and public hosting are separate work.

Windows account access protects these local files; the database is not encrypted at rest. No telemetry or remote application content is loaded. WebView2 is the shared Windows runtime and may be installed by the installer if absent. This personal installer is **unsigned**, not a signed public distribution or security certification.

## Development

Prerequisites: current Node/npm, Python for the existing asset build, Rust MSVC toolchain, Microsoft C++ build tools, and WebView2. Open a new terminal after installing Rust so Cargo is on PATH.

```powershell
npm install
npm run desktop:dev
npm run desktop:build
cargo test --manifest-path desktop/src-tauri/Cargo.toml
node scripts/test_unified.cjs
node scripts/test_island.cjs
```

Source: `desktop/ui/native-shell.js` owns the isolated buddy component; `src/mascot/cat.js` owns the 3D model; `desktop/src-tauri/src` owns persistence, scheduling, native windows and loopback service. Root `Application.html` remains Scheduler's source of truth. `scripts/prepare_desktop.py` embeds approved assets and generates the Windows icon. Build outputs are ignored; the installer is under `desktop/src-tauri/target/release/bundle/nsis`.

Use `--profile-dir <absolute-path>` for an isolated test profile, `--hide` to close the buddy to the tray, and `--quit` to stop an existing instance. `--quiet` is used by optional autostart. `--measure` writes a local readiness record; `--measure-expanded` opens the full planner; `--planner` opens it in an existing instance. Neither measurement flag is active during ordinary use. Debug builds alone support the one-use QA pairing-file hook.

Performance script: `scripts/measure_desktop.ps1` (also `-Expanded`) measures readiness, the full native/WebView2 process tree, 20-second idle CPU, private memory and summed working sets, and confirms tray survival. It uses an isolated profile. Results and screenshots are in ignored `build/` outputs.

Current acceptance evidence is in `design/ORBITER-ISLAND-VERIFICATION.md`; the preceding release is documented in `design/ORBITER-UNIFIED-VERIFICATION.md`. The full planner consumes more resources than the buddy. Physical sleep/reboot, multiple-monitor/scaling, and notification checks remain necessary before calling this a fully accepted public release.

## Primary references

- [Tauri architecture](https://v2.tauri.app/concept/architecture/), [tray integration](https://v2.tauri.app/learn/system-tray/), [Windows packaging](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri runtime authority](https://v2.tauri.app/security/runtime-authority/), [single instance](https://v2.tauri.app/plugin/single-instance/), [autostart](https://v2.tauri.app/plugin/autostart/)
- [WebView2 deployment](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution), [Windows suspend events](https://learn.microsoft.com/en-us/windows/win32/power/pbt-apmsuspend)
- [Playwright browser testing APIs](https://playwright.dev/docs/api/class-browsertype)
## October 14 UI polish

The 0.4 installer refresh adds grouped buddy settings, independently scrolling Discoveries, a padded export deck, centered close controls, wider Test actions, and faster wave transitions. Settings opens at 560 px tall and Discoveries at 520 px tall; these temporary expansions do not replace your saved compact size. Open owned cosmetics through **Buddy options → Your companion → Explore discoveries**.

The existing installed app does not update just because source files changed. After saving/finishing your current session, Quit Orbiter from its tray, run the refreshed installer, and reopen it. Browser users should reload their usual URL to get the regenerated source without changing storage origins.


## Orbiter 0.5 pond workspace

The blue lily pond now sits behind the full scheduler and compact buddy. Mist moves automatically and parts under cursor sweeps; it stops with Low quality, reduced motion, quiet mode or zero motion intensity. If it looks still, check Appearance settings before increasing atmosphere. Keep Auto quality for the conservative default.

Save and Quit Orbiter from its tray menu before installing the new 0.5.0 build. Local 0.6.x files were unreleased visual-development builds; 0.5.0 is the requested release version. A local 0.6.x installation needs a manual installer run because updater version ordering will not offer a numerically lower version. Existing database and signing-key identifiers are unchanged.
