# Orbit Companion — Windows personal build

Historical 0.1.0 report. The current unified 0.2.0 implementation and measurements are in [ORBITER-UNIFIED-VERIFICATION.md](ORBITER-UNIFIED-VERIFICATION.md).

Built and installed on October 13, 2026. Version 0.1.0, Windows x64, per-user NSIS installer. Source changes are uncommitted. This is an unsigned personal build; full release acceptance remains pending.

## Implemented

- Tauri 2 native shell, transparent 180 × 200 buddy and 360 × 520 controls, tray, single instance, optional startup and pinned window, remembered position with monitor bounds checks.
- Rust-owned timer and SQLite transactions/migrations; checkpoint recovery pauses instead of crediting downtime. Windows lock/suspend event handlers pause focus. Early finishes, fractional minutes, local midnight splits and native-only reward accounting.
- Assignment, exam preparation and recurring practice creation/editing. Scheduler backup import preserves study history and IDs without granting XP; pre-import recovery exports and native export controls.
- Bundled loopback Scheduler at 127.0.0.1:18743, one-use pairing, HttpOnly session cookie, CSRF, Host/Origin checks, payload/rate limits, static allowlist, CSP and event-driven browser synchronization. Independent browser storage remains available at existing URLs.
- XP, levels, cosmetic chests, fifteen cosmetics, displayed tier weights, duplicate protection, equipment, constellation stars and level reveals. SVG/CSS motion, reduced motion and quiet mode.
- Per-user installer, app icon and Start menu shortcut. No Python/Node process is required at runtime. Startup remains off by default.

## Checks performed

`cargo test`: **12 passed**, zero failures. Coverage includes crash recovery, early finish and exactly-once reward credit, midnight splits, stale writes, native focus ownership, imports without rewards, transaction rollback, cosmetic completion, timer/edit revision separation, malformed imports, pairing/CSRF and private-asset rejection.

Headless Edge companion tests passed: expansion, start/pause, exam editing, chest reveal, inventory, preferences and OS reduced motion. An isolated native debug profile also passed authenticated browser pairing, Scheduler startup and durable recurring-event creation. Screenshots and measurement JSON are in ignored `build/` outputs.

The installed release executable independently reported UI readiness at 180 × 200; a second launch exited successfully without creating another application instance. Closing the buddy preserved the native tray process. Measurements confirmed the buddy webview processes are released on close. Tests use isolated profiles and did not import or alter the user's existing browser workspace.

## Release measurements on this PC

20-second idle samples, full native/WebView2 descendant process tree. CPU is normalized across logical processors. Readiness is reported by the rendered frontend, not just process creation.

| Mode | Startup | CPU | Private memory | Summed working sets |
| --- | --- | --- | --- | --- |
| Buddy | 0.848 s | 0.349% | 165.1 MB | 394.5 MB |
| Expanded | 0.779 s | 0.000% sampled | 181.0 MB | 402.1 MB |
| Tray | — | 0.000% sampled | 9.5 MB | 33.5–33.7 MB |

Release executable: approximately 6.03 MiB. Installer: approximately 2.07 MiB, excluding the separately installed shared WebView2 runtime. These are short local samples, not universal resource guarantees. Visible private memory meets the 200 MB target; summed resident working sets exceed it and include shared pages. The combined-memory target is therefore **not unconditionally met**. Avoid treating zero sampled CPU as zero activity.

## Acceptance still requiring review

- [ ] Physically lock/unlock and sleep/wake Windows during focus, including the deliberate resume prompt and remaining budget.
- [ ] Restart Windows with startup both disabled and enabled; inspect recovered timer and rewards.
- [ ] Review multiple monitors, scaling changes, keyboard/screen-reader use and native visual appearance. Native screenshot access timed out waiting for app approval; source component screenshots do not replace this review.
- [ ] Exercise notifications and reminders on the installed Windows build.
- [ ] Review real concurrent browser/companion editing and draft recovery with personal data; automated conflict tests passed.
- [ ] Upgrade and uninstall/reinstall the installer while preserving study data; initial installation passed.
- [ ] Repeat long-running CPU/memory measurements and investigate visible resident memory before claiming every efficiency target is satisfied.

These gaps are explicitly retained rather than describing the build as fully acceptance-tested or publicly certified. Operating and recovery instructions are in `desktop/README.md`.
