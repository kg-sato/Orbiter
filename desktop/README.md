# Orbiter for Windows

Orbiter combines a full study planner and a compact floating kitten companion in one Windows application. It uses Tauri 2, Rust, SQLite and bundled HTML/CSS/JavaScript with Three.js. Python, Node and an external browser are development tools, not requirements for using the installed planner.

**Current source version: 0.5.3.** Check the actual running executable when diagnosing a version mismatch; an installer title or release-note filename does not identify the UI currently on screen.

## Install and open

1. Export a backup and save any open planner edits.
2. Choose **Quit Orbiter** from its system-tray menu. Closing the window with × keeps the process running.
3. Run the intended installer. For the same version, **Add/Reinstall components** is the maintenance option.
4. Open **Orbiter** from Start/Desktop. The default per-user executable is `%LOCALAPPDATA%\Orbiter\orbit-companion.exe`.

The normal local packaging output is `build/release/Orbiter_<version>_x64-setup.exe`. The repaired 0.5.3 installer is under `build/release/compact-repair/`. These ignored local artifacts are not included in the repository. `Open Orbiter.cmd` opens the installed executable when present; its fallback installer alias is the normal `build/release/Orbiter Setup.exe`.

Use one copy of Orbiter. Old portable executables, including renamed `orbit-companion-<version>.exe` files, share the installed app's single-instance identity. Launching a newer copy can bring an older running copy forward. The repaired installer detects `orbit-companion*` processes and asks you to quit from the tray; it does not terminate an active study session automatically. If the check fails, setup stops before replacing application files.

## Planner and compact buddy

- Orbiter opens as a **420 × 220** floating island by default. Click the kitten or planner icon to open the full planner in the same app.
- The planner contains **My Day, Assignments, Atlas and My Rhythm**, including tests, daily practice, course notes, weekly planning and focus controls.
- Starting or resuming focus from the native planner returns to the buddy. Reopen the planner during focus whenever needed. Mode switches preserve drafts and the native timer.
- **Buddy options → Appearance** offers Small, Default and Large presets plus custom dimensions from **360 × 200 to 560 × 300**. Drag the ORBITER heading or use the lower-right grip.
- Options expand to at least 420 × 560 and discoveries/recaps to at least 420 × 520. They preserve your saved compact dimensions when closed.
- **Keep above other windows** defaults on for the buddy and can be turned off. It never pins the full planner.
- Closing the app window keeps Orbiter in the tray. Unsaved planner edits offer Save/Discard/Cancel. Tray **Quit Orbiter** pauses and persists focus before exit.

### Compact controls and feedback

Window actions and planner controls use consistent SVG icons. The filled primary button changes between **Start, Pause and Resume**. **Finish** ends the current session, while the separate planner icon opens the workspace. The crate/level strip and resize grip have their own space at the smallest supported size.

After the native timer accepts Start or Resume, a short dew-light arc travels into the kitten's pool and releases rings. A native session completion triggers a masked lily-and-starlight celebration, followed by the existing session recap. The kitten's face and controls remain clear, and decorative effects never intercept clicks.

Calmer motion, quiet mode, OS reduced motion and zero motion intensity suppress these animations. Completion still opens its recap promptly. Duplicate timer/account updates do not replay the celebration or cancel the reduced-motion recap. A locally displayed zero alone does not award time or trigger victory.

## Study sessions and discoveries

Create assignments, tests and recurring practice in the full planner. Choose an intention and duration there or in buddy options; options include 25/50/60-minute presets and a custom duration. Finish an in-progress session before changing its intention or duration.

Windows owns the timer, credited focus and rewards. Manual logs and imported study history do not create native XP. Focus can be linked to a task and its course companion. A session recap shows actual credited time, applicable exam-preparation reduction, growth and reward status. Pending cloud credit and confirmed account totals are labeled separately. **Done** acknowledges the recap; **Latest session** reopens it without awarding time again.

- Each whole native focus minute earns 1 XP; each 100 XP advances a level; each 30 focus minutes earns a crate. Partial minutes accumulate.
- Discoveries contains a 51-item catalog across appearances, accessories, trails and habitats. The recent visual refresh covered 14 upgraded item visuals; catalog size does not mean all 51 received that refresh.
- Preview an owned or locked item on the kitten. **Equip** saves owned items; **Cancel preview** or leaving the buddy preview restores saved equipment. In the full planner, Escape or closing the preview dialog also restores it. Locked previews do not grant ownership.
- Crate tier weights are Common 70%, Rare 25% and Mythic 5%, redistributed when a tier is exhausted. Draws select unowned items; complete collections earn constellation stars.
- Companions grow through Baby, Kitten (2 hours), Young Cat (8 hours) and Adult (20 hours). Course growth uses attributable native focus; the main companion uses total native focus.

Courses retain their own coat, ear, scarf and charm identity. Equipment does not replace that identity. The original modeled kitten and export notes are maintained in [design/avatar](../design/avatar/README.md).

## Pond and appearance

The full planner and buddy share a blue pond with koi, lily pads, underwater light and moving mist. **Tidal Night, Lunar Mist and Opal Dawn** are lighting choices within that direction.

Appearance studio previews accents, materials, scene lighting, atmosphere, motion intensity and **Auto/Low/High** graphics settings before Apply. Cancel restores saved appearance. Solid/quiet materials provide opaque surfaces. Low quality and reduced/zero motion stop ambient rendering; a static illustration is available when graphics initialization fails.

Navigation and dialogs use the shared water-to-glass transition controller. Incoming panels reveal with the wave while form text and controls stay stationary. Popup input remains available during decoration. Quiet/reduced motion suppresses effects.

The scene reuses one WebGL context, including equipment previews. Portraits are cached, motion is capped at 30 FPS and rendering suspends when hidden. These implementation limits are not a promise of measured CPU/RAM or a sustained frame rate on every PC.

## Storage, backups and connection options

The normal native data directory is `%LOCALAPPDATA%\com.kgsato.orbit`. Its `orbit.sqlite3` database stores workspace, timer, cosmetics, growth and settings. Recovery backups are accessible through buddy options. Keep this identifier and location unchanged during upgrades.

**Import backup** replaces study data and creates a recovery copy. JSON export/import preserves study data and course identities; it does not export or grant native reward balances or growth credits. To back up the full profile, quit Orbiter before copying its data directory. Keep browser exports from their original address/profile before moving them to Windows.

Two connection paths exist:

| Connection | Purpose |
| --- | --- |
| Optional paired browser on this PC | Loopback service at `127.0.0.1:18743`; tray-generated links are single-use and expire after 60 seconds. Sessions expire after 12 hours or restart. The native process retains timer/reward authority. |
| Hosted private-beta account | Separate sign-in and workspace synchronization through Supabase. Setup, allowlisting, conflicts and validation requirements are in [private-beta documentation](../docs/PRIVATE-BETA.md). |

The bundled planner works offline without either connection. The optional paired-browser action opens an external browser. If its port is occupied, the native app still works. Browser drafts use revisions/conflict handling; finish or export a draft before replacing its workspace.

Local files rely on Windows account permissions; the SQLite database is not encrypted at rest. Hosted account sessions use separate credential handling. Do not describe the account-enabled Windows/browser app as making no network requests; that description applies to the separately prepared offline iPhone beta.

## Updates and version mismatches

Open **Check for updates** from planner preferences or buddy options. Automatic startup checks are optional; checks do not automatically install updates. The updater uses signed versioned installers and a published GitHub feed. A local build does not update that feed.

Save drafts before installing. Failed download/signature verification leaves the timer running; after verification, the update workflow pauses/persists focus and creates a workspace backup before launching setup. Resume deliberately after restart. Updater signatures are separate from Windows Authenticode signing.

If you still see the previous UI, check the running executable path/version and quit older portable copies before reinstalling. Reinstalling a version may show the maintenance screen; that screen alone does not establish which executable is currently rendering the app. See [update and release instructions](../docs/UPDATES.md).

## Development

Prerequisites are Node/npm, Python 3.11+ for the current preparation checks, the Rust MSVC toolchain, Microsoft C++ build tools and WebView2. Preserve the repository's dependency versions and lockfiles. Run these commands from the repository root in PowerShell as appropriate:

```powershell
npm.cmd ci
npm.cmd run desktop:dev
```

To regenerate source-derived assets and prepare the native frontend:

```powershell
npm.cmd run build:core
npm.cmd run desktop:prepare
```

For a native build, use `npm.cmd run desktop:build`. For the signed local installer/update artifacts, follow [docs/UPDATES.md](../docs/UPDATES.md); its combined script performs regeneration, native compilation, packaging and local staging with the original updater key.

Relevant focused checks include:

```powershell
node scripts/test_buddy_focus.cjs
node scripts/test_island.cjs
node scripts/test_unified.cjs
cargo test --manifest-path desktop/src-tauri/Cargo.toml
```

The browser scripts use disposable fixtures; inspect them before running. The compact test records layout results and animation frames under ignored `build/buddy-focus/`. Native process tests must account for application-wide single-instance routing: a separate data directory alone does not isolate a running app. Never send hide/quit test commands to a real study session.

`desktop/ui/` owns the buddy, native adapter and updater UI. `desktop/src-tauri/src/` owns native windows, persistence, focus/reward authority and the local service. Root `Application.html` and shared `src/`/`web/` modules remain canonical; [project workflow](../docs/agents/WORKFLOW.md) explains generation.

## Verification boundary

The current compact work passed 18 generated-native-HTML size/state cases with pairwise overlap and pointer checks, plus Start/Resume, failure, completion, duplicate updates, reduced motion and neighboring island/unified regressions. The local 0.5.3 package passed binary-version, checksum and original-key signature checks; its embedded buddy JS/CSS were compared with production source. A guard-only installer fixture detected the older portable process without terminating it.

Those checks do not establish a completed installed upgrade, real native expiry on this PC, physical-monitor scaling, live hosted sync or iPhone readiness. See the [current checkpoint](../docs/agents/CHECKPOINT.md) and [compact review notes](../design/compact-buddy/README.md) for scope and remaining gaps.
