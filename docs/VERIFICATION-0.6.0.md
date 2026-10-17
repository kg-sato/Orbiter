# Orbiter 0.6.0 — local verification

Date: October 16, 2026. Windows x64. Release candidate; no production deployment or GitHub publication.

## Automated evidence

Passed:

- **33 Rust tests:** timer authority, early/natural completion, midnight grouping, crash recovery, duplicate-free credit/rewards, captured course growth, recap acknowledgment/rollback, cloud ownership and pending/confirmed recaps, imports, stale saves, pairing/CSRF/static-asset boundaries and preference validation.
- `test_refinement.cjs`: shared intention/duration, paused-session locks, appearance Apply/Cancel/Reset and stale drafts, scene/accent combinations, phone layouts, routine/full-wave selection, recap formatting, growth stages and WebGL fallback.
- `test_island.cjs`: native buddy controls/sizes, responsive discovery panels, owned-item preview Cancel without a write, explicit Equip, settings, reciprocal modes, recap flow and full-viewport wave coverage.
- `test_unified.cjs`: browser identities, course deletion, fractional review formatting, layout, static fallback, native draft preservation, timer switching and size behavior.
- `test_celestial.cjs`: four viewports, nine accent/material combinations, reduced motion and focus layout.
- `test_cloud_browser.cjs`, `test_cloud_codec.cjs`, `test_cloud_sql.cjs`: explicit migration, offline/reconnect, conflict and guest restoration, codec compatibility, RLS, idempotency, overlap protection, ownership and crate recovery. SQL executes in disposable PGlite, not hosted Supabase; cryptography/realtime stubs do not validate the live service.
- `test_cosmic.cjs`: bundled GLB, eight-bone/six-material upper budgets, blink morphs, original turnarounds, three scene captures, one renderer, owned/locked preview and cancel, new preference persistence, phone widths, reduced motion and a deliberately damaged GLB fallback with usable study controls.
- The cosmic suite renders all **51 existing cosmetic IDs** and checks distinct rendered artwork within each slot. This detects identical output; it is not a substitute for subjective art review.
- Front/side/three-quarter and equipped renders were inspected. Root application copies and website upload archive were regenerated. `git diff --check` passes; Git reports line-ending normalization notices.

## Rendering and data compatibility

- Original editable Blender file and reproducible modeling script are in `design/avatar/`. Original GLB is embedded locally. No Blender/Python/Node runtime or model download is required by the installed app.
- One live Three.js renderer moves between planner, buddy and equipment preview. Course portraits remain cached; hidden rendering stops. Rigidly weighted GLB pieces attach directly to bones to avoid unnecessary skinning shaders; blink/smile morphs remain intact.
- Existing profile IDs, study/reward data, XP/crate rules and database identifier `com.kgsato.orbit` are retained.
- `motionIntensity` defaults to 70 and `effectQuality` to Auto when missing. New fields are optional in native/browser imports. Apply `supabase/migrations/202610160001_appearance.sql` before syncing these preferences to the hosted account service. That migration was **not** applied here.
- GPU timing is queried through the optional WebGL disjoint-timer extension. CPU render submission and GPU elapsed time are reported separately; absent driver support is not treated as zero GPU cost.

## Performance method

Separate native identifier `com.kgsato.orbit.performance`, separate disposable profiles and process-tree sampling. The installed Orbiter and its data were not replaced or stopped. Twenty-second visible and tray samples; CPU normalized across logical processors. Memory is summed private bytes; summed working sets can double-count shared pages.

The measurement script now rejects a sample when its mode changes or its webview closes. Earlier interrupted samples were discarded. Fresh main-cat selections vary, so these single runs are indicative comparisons rather than controlled statistical benchmarks.

| Buddy build | Startup | Visible CPU | Private memory | Tray CPU | Tray private memory |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0.4.2 isolated baseline | 1.311 s | 0.882% | 227.5 MB | 0% | 7.0 MB |
| 0.5 isolated candidate | 1.226 s | 1.053% | 224.2 MB | 0% | 10.1 MB |
| 0.6 final candidate | 0.972 s | 1.055% | 252.8 MB | 0% | 9.8 MB |

The final buddy's last warmed-up GPU query was **3.08 ms**, versus **0.30 ms CPU render submission**. This is a sampled frame, not an average or worst-case guarantee. One context, 44 draw calls and 20,644 scene triangles were reported for that randomly selected identity at Auto quality. Raw executable: **10.10 MiB**.

Buddy CPU (<2%), tray CPU (<1%) and startup (<3 s) meet the initial targets. **Visible memory misses the <200 MB target by 52.8 MB** and is 28.6 MB above the 0.5 candidate. It improved from a preliminary 289.7 MB / 1.929% CPU sample after rigid-piece shader optimization; identity and cache differences also affect individual runs. Tray closing reduced the process tree to one native process.

At 1920×1009 and 100% Windows scaling, the full planner opened in **1.349 s**, averaged **3.161% CPU** and used **458.9 MB private memory** (533 MB summed working sets). Its last GPU query was 0.025 ms versus 0.50 ms CPU submission. This full-page workload exceeds the visible-memory target and also exceeds 2% CPU if that stricter buddy target is applied to the planner. Its tray sample was 0% CPU / 9.9 MB private memory. No valid full-planner baseline comparison is claimed.

Raw evidence is in ignored `build/performance-060-release/{buddy,expanded}.json`.

## Package

Built successfully: `build/release/Orbiter_0.6.0_x64-setup.exe`, **4,003,150 bytes / 3.82 MiB**, compared with the local 0.5 candidate's 3.48 MiB. The generic `Orbiter Setup.exe` is the same installer. The existing updater key generated its `.sig`; versioned `latest.json` and `SHA256SUMS.txt` were staged locally. The database identifier is unchanged. No installation over the user's running application was performed.

The website upload package is refreshed separately as `build/Orbiter-private-beta.zip`; deployment remains a separate action.

## Release gates still open

- Live email sign-in, two-device account synchronization, offline reconciliation against hosted Supabase and the new preference migration.
- Installing/upgrading over the user's real active profile, automatic update through the published GitHub channel, uninstall and reboot/startup behavior.
- Physical lock/suspend/reboot, monitor changes and Windows scaling at 100/125/150/200%. Automated viewport checks are not physical DPI validation.
- Subjective approval of all item artwork and further hand-retopology if continuous facial/shoulder deformation is desired. The delivered model is an articulated collectible avatar, not a film facial rig.
- Resource targets are evaluated from measured results, not assumed satisfied. The existing 200 MB visible-memory target was already exceeded by the baseline.

The installer is an unsigned personal Windows build, with updater artifacts authenticated using the existing updater key. No Authenticode certificate, public certification, commit, push, cloud deployment or GitHub release is implied.
