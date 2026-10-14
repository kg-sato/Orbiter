# Orbiter 0.3.0 — floating island and growing cats

October 14, 2026. Local source changes remain uncommitted. The Windows installer is unsigned. Database identifier, browser storage keys, task data, and existing reward IDs are preserved.

## Changes

- Transparent rounded island, default 420 × 220 logical pixels, compact limits 360 × 200 through 560 × 300. Dedicated drag region, resize grip, minimize/planner/close controls. Ordinary Windows frame returns in planner mode.
- Options expand to at least 420 × 560; reward views to at least 420 × 400. Temporary geometry does not replace saved compact bounds. Position is constrained to the monitor work area.
- Following user feedback, pinning is enabled by default for the island and for upgrades from the preceding buddy. It is configurable and applies only in buddy mode.
- Original cat faces, softer proportions, four growth stages, independent poses, and gradual proportions within stages. Existing course traits persist. Baby → Kitten at 2 focus hours → Young Cat at 8 → Adult at 20.
- Native rewards hold a course-profile ledger and captured session profile. Later task edits cannot redirect accrued or resumed focus. Existing verified total focus contributes to main-cat growth; course growth starts with newly attributable time. Manual/imported study history does not create XP or growth credit.
- Crates accrue every 30 tracked minutes; old total focus receives the new entitlement without resetting openings, XP, or ownership. The 51-item catalogue retains the old 15 IDs and adds 36 original looks, accessories, and habitats, with SVG previews and procedural model props.
- Buddy and My Day display crate progress and a level bar. Reveals offer Equip; categorized collection cards distinguish locked, owned, and equipped items. Original 70/25/5 tier weights and duplicate protection remain. Complete collections add visible constellation stars.
- Native and paired website snapshots share rewards. Standalone websites retain scheduling and explain that reward earning requires Orbiter or pairing.
- Fixed an unfinished CSS comment that disabled the full-viewport wave stage. Animated dark/multicolor strata now cover the whole application viewport, with cancellation on Escape, resizing, visibility changes, dialog closure, and mode changes.

## Automated validation

`cargo test --manifest-path desktop/src-tauri/Cargo.toml`: **21 passing tests** covering the preceding timer/security suite plus 30-minute boundaries, retroactive entitlement, old settings, all growth stages, captured course identity, restart persistence, catalogue categories, rollback after a failed crate grant, and crate opening exactly at the timer deadline.

`node scripts/test_unified.cjs`: browser identity, narrow exam layout, themes, reduced motion, WebGL fallback, preserved drafts, shared timer adapters, and compact minimum/maximum controls.

`node scripts/test_island.cjs`: full stage bounds at 1366 × 900 and 390 × 844; frozen covering-frame overscan; screenshots showing full-viewport liquid coverage; Escape cleanup and reduced motion; crate reveal/equip; category selection; temporary sizing without compact-setting changes; visible My Day progress; four rendered growth stages with one WebGL context.

Tests use fresh browser contexts, intercepted `.test` origins, and isolated native profiles. They do not write personal browser workspaces. Browser-native command tests are mocked; actual Windows checks are recorded separately.

## Native Windows review

The first candidate was observed as a rounded transparent island on Windows at 100% scaling. The user confirmed its rounded appearance. Planner mode restored the standard Windows frame, and the main hero displayed the level/crate strip. Expanded options retained stored compact dimensions of 420 × 220. Pinning was explicitly enabled and verified in the isolated test profile after confirming its unchecked state; the original focus data was not edited by this check.

Final installer and resource results follow. Preceding 0.2.0 reference: buddy approximately 0.88% idle CPU and 201.8 MB private memory; planner approximately 2.97% and 375.3 MB. These are comparison samples, not new-build results.

Final 0.3.0 buddy sample: startup **1.017 seconds**, idle CPU **0.522%**, combined private memory **220.1 MB**, summed working set **447 MB**. Closing the island released its webview: one tray process, **0%** sampled CPU, **9.8 MB** private memory. Executable **7.06 MiB**. The under-200-MB visible memory target remains unmet; this sample used more memory than 0.2.0 despite lower buddy CPU.

Measurements cover the native/WebView2 process tree over 20-second samples, normalized across logical CPU cores. Summed working sets include shared pages and are not unique physical RAM. System load, GPU, cat profile, and window size affect results. Native readiness reported one renderer, correct 420 × 220 bounds, and no JS/CSP errors. An initial measurement attempt encountered another already-running instance and produced no results; the successful sample followed a normal application Quit, without changing study data.

Final planner sample: startup **1.013 seconds**, idle CPU **2.974%**, private memory **375.9 MB**, summed working set **544.7 MB**. Closing left one tray process at **0%** sampled CPU and **10.6 MB** private memory. Its readiness record showed 1920 × 1009 bounds and no JS/CSP errors. Final unsigned installer size: **2,729,779 bytes** (about 2.60 MiB).

Per-user installer upgrade completed with exit code 0; Windows registration reports **Orbiter 0.3.0**. The final installer is copied to `build/release/Orbiter Setup.exe`. Existing profile validation after upgrade showed the migrated 420 × 220 size, pinning enabled, and the previous three owned cosmetics retained. The user's focus activity continued during review; no claim is made that their remaining timer time stayed unchanged while they used it. The same database identifier/location is retained.

## Remaining physical review

- Actual Windows sleep/lock/resume and reboot, multiple monitors, 125/150/200% display scaling, notifications, and uninstall/reinstall.
- Physical phone/Firefox and screen-reader review. Chromium tests verify layout and fallback, not every browser/device.
- Extended study sessions across real-world calendar changes. Automated tests cover credit, midnight, interruption, and duplicate protection.

## Operating it

Open the Orbiter shortcut or `Open Orbiter.cmd`. The small island stays above other windows by default. Use the heading to drag, the corner grip to resize, ⚙ for options, and ↗ to open the planner. Close keeps the native timer process in the tray; explicit Quit pauses and persists it. Click the crate to check/open rewards, or ✧ to browse discoveries. Source and build changes remain available for review in VS Code.
