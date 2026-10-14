# Orbiter 0.2.0 — unified Windows application

Local acceptance review, October 14, 2026. Source changes remain uncommitted. GitHub issues were read only; none were commented on or closed.

## Implemented

- One native Tauri window bundles root `Application.html`. Buddy and planner share Rust commands, events, SQLite, and one timer. Opening the planner does not launch a browser.
- Maximize opens the planner; Restore returns to remembered buddy bounds. Minimize stays in the taskbar; Close destroys the webview and keeps the tray process. Explicit Quit pauses focus before exit.
- Compact controls use an isolated shadow component, external stylesheet, and separate rows. Size presets/custom dimensions cover 260 × 300 through 420 × 480 logical pixels. Placement uses monitor work areas, excluding taskbars. Pinning applies only in buddy mode.
- Planner DOM and dialog inputs survive mode switches. Closing dirty forms offers Save/Discard/Cancel. Accepted start/resume switches to buddy centrally in Rust, including tray and paired-browser actions.
- One reusable Three.js renderer models original cats, with cached course portraits. Four coats, ears, scarfs, and charms create 256 combinations. Course profiles persist in optional backup-compatible fields. Fresh loads avoid the previous main cat; mode switches retain it. Task-linked focus uses the course cat.
- Blink, breathing, tail/scarf movement, cursor attention, head pats, typing paws, focus particles, and celebrations use independent poses. Motion is capped at 30 FPS and stops when hidden or reduced. Static illustrations handle WebGL failure. Input reactions stay inside Orbiter.
- Focus Room navigation/search is removed; old destinations redirect to My Day. Browser-only My Day retains its timer. Primary action colors and buddy preferences share planner tokens.
- Existing `com.kgsato.orbit` database identity, browser storage key, cosmetic IDs, and study data are retained. Browser origins remain separate until a backup is explicitly imported.

## Automated checks

**15 Rust tests pass.** Covers exact-once time/rewards, midnight splitting, crash recovery, failed-write rollback, stale revisions, import without XP, duplicate-free chests, pairing/CSRF/static-asset boundaries, old settings defaults, and stable cat profiles.

**`node scripts/test_unified.cjs` passes with no page errors.** Synthetic `.test` origins and fresh browser contexts avoid editing personal browser data. Covers course identity persistence, fresh-load variation, accents, one renderer, reduced motion, WebGL fallback, long exam titles at 390 pixels, compact minimum/maximum sizing, preserved Capture drafts, and native timer/mode adapters. Native commands in this browser suite are mocked.

## Actual native release checks

- At 100% Windows scaling: buddy 280 × 320 client pixels, maximized planner 1920 × 1009, restored buddy 280 × 320. Native Maximize/Restore/Minimize were exercised. Minimize stayed minimized until explicitly activated.
- Styled buddy and bundled planner loaded with no recorded JavaScript/CSP errors. An actual planner focus start switched to buddy in an earlier release candidate; the final title-bar fix was separately checked.
- Closing keeps the tray process. Performance runs confirm WebView2 is released, leaving one native process.
- Narrow long-title exam checks found no button overlap or horizontal overflow.
- Upgrading the actual installed profile preserved its paused 21:03 focus session. This revealed a legacy phone-sized focus badge escaping the hidden planner; it now remains inside the planner stage, and fractional native seconds are rounded for display. A browser regression assertion checks that it cannot cover buddy controls.

## GitHub issues

| Issue | Local result |
| --- | --- |
| [#9 Main Menu Rotational Bug](https://github.com/kg-sato/Orbiter/issues/9) | Former spinning centerpiece replaced by articulated procedural 3D cats. Native render and browser one-context checks passed. |
| [#10 Color Theme Mismatch](https://github.com/kg-sato/Orbiter/issues/10) | Shared primary/selected accent tokens and buddy appearance; mint/lilac/apricot checks passed. Secondary/disabled controls retain semantic distinctions. |
| [#11 Orbit Companion Color Difference](https://github.com/kg-sato/Orbiter/issues/11) | Buddy reads planner accent/material preferences; warm cat colors remain intentionally distinct. |
| [#12 Test Button overlapping](https://github.com/kg-sato/Orbiter/issues/12) | Shrinkable columns, wrapped titles/actions; synthetic long-title/narrow-width checks passed. Attachment access was unavailable, so exact screenshot reproduction is not claimed. |

These are local dispositions, not closed GitHub issues.

## Resource review

Measures the whole native/WebView2 process tree over 20-second idle samples in an isolated profile. CPU is normalized across logical processors. Private memory is summed allocations; summed working sets include shared pages. Cold boot was not tested. Results vary with GPU, cat profile, system load, and window size.

Initial 0.2.0 candidate: buddy startup 0.924 seconds, idle CPU 0.702%, private memory 201.8 MB, summed working set 422.8 MB. Planner startup 0.997 seconds, idle CPU 3.142%, private memory 373 MB, summed working set 533.7 MB. Tray: 0% CPU, about 10–11 MB private memory, one process. Executable about 7 MB; installer about 2.58 MiB.

Optimizations: shared geometry, one context, capped pixel density/frame rate, cached portraits, no retained GPU drawing buffer, paused hidden animations, and webview destruction in the tray. **The under-200-MB visible memory target is not met.** Full planner animation costs more CPU than the compact buddy. These remain performance work. Final-build samples are recorded below.

| Measured release mode | Startup | Idle CPU | Private memory | Summed working set |
| --- | --- | --- | --- | --- |
| Buddy | 1.044 s | 0.877% | 201.8 MB | 424.6 MB |
| Full planner | 0.884 s | 2.970% | 375.3 MB | 529.6 MB |
| Tray | Already running | 0% | 9.7–10.5 MB | 35.6 MB |

Final installer: 2,703,125 bytes; executable approximately 7 MiB. Samples above precede the final badge-only correction and use the same renderer. Measurements passed startup/tray/buddy CPU targets but did not pass visible memory. GPU-frame retention removal did not meaningfully improve measured process memory; WebView2 and the mounted planner remain substantial costs. Measurements are not a claim of universal resource usage.

## Physical checks still required

- Actual Windows lock/sleep/resume, forced interruption, and reboot during focus. Automated recovery/credit tests pass; the user's PC was not restarted or locked.
- Multiple monitors, Windows scaling at 125/150/200%, notification delivery, and monitor removal. Current native check used 100% scaling.
- Exhaustive native Save/Discard/Cancel paths, paired website/tray start-resume with simultaneous drafts, and import of the user's actual original backup.
- Physical iPhone/Firefox and screen-reader review. Browser automation used Chromium.
- Uninstall/reinstall and startup across a reboot. Upgrade is checked without deleting study data; uninstall is not exercised on the user's profile.

## Operating instructions

Open **Orbiter** from its shortcut or `Open Orbiter.cmd`. Click the cat or **Planner**, or maximize, to open the scheduler. Start focus to return to buddy. The gear contains intention, duration, appearance/size, rewards, and backup controls. Close keeps it in the tray; **Quit Orbiter** stops it.

This is a personal **unsigned** Windows x64 build. No public code signing or Apple certification is implied. Profiles retain `%LOCALAPPDATA%\com.kgsato.orbit`. Full instructions: `desktop/README.md`.

Installer upgrade from 0.1.1 to 0.2.0 completed successfully (exit code 0), with registry version and installed launch verified. The original paused focus session remained at 21:03. The corrected installed buddy shows no duplicate badge over its timer or buttons. `build/release/Orbiter Setup.exe` contains the final installer; the existing Desktop shortcut remains available.
