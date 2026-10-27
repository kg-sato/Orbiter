# Orbiter coordination checkpoint

Updated **2026-10-27** from this chat and the local repository. This is a handoff, not a release approval. Recheck status and versions before acting.

## Observed state

### Four cosmetics and verified Windows 0.6.1 installer — 2026-10-27

- Integrated the focused artwork task `01a17cbf-babd-7e23-9555-f1ffa2f96f49` from `eaa3`, based on `ef77d18`, into `codex/ui-direction`. Tiny Satchel (`halo-05`), Lantern Pendant (`halo-09`), Paper Lantern (`habitat-04`) and Floating Shrine (`habitat-09`) now have distinct procedural models and matching mounted SVG fallbacks. Existing GLB/rig, identities, catalog, ownership, native authority and version 0.6.1 are preserved. See `../../design/avatar/EQUIPMENT-FOUR.md` for matched comparisons, reproduction and measurements.
- New props use 1,008–4,648 triangles and 3–5 calls each; the four tested accessory/habitat pairs use 7–9 additional calls and no added particles. Full adult cat-pass totals include existing growth scenery and exceed the historic 25,000 starting target; this pass does not establish every-stage or native resource targets. Four-stage, sampled identity, 360×200/420×220 native-mode, preview/Cancel/locked/Equip, mounted model/WebGL failure, renderer reuse and repeated-swap disposal checks passed.
- Main-checkout `test_equipment_four.cjs`, `test_cosmic.cjs`, `test_chest_model.cjs` and `test_chest_opening.cjs` passed, along with generation/source/version/diff checks. Cosmic captures now default to ignored `build/` and target the kitten's exact GLB on failure. Chest phase captures use a controlled test clock so screenshot cost cannot consume the late frame; production timing is unchanged. The older Island suite remains FAIL at hidden `#weekly-review-open` because it assumes the old entry page; the focused suite exercises the current equipment flows.
- Updated the installed `orbiter-companion-art` skill and its versioned source at `../skills/orbiter-companion-art/SKILL.md`; SHA256 `5c2307024e3aab61e6dc37334fc3ff0dcde88930849e746dd335cd956381bdc6` matches. Semantic review, scalar frontmatter and source-reference checks passed. Official `quick_validate.py` could not run because PyYAML is absent; no dependency was installed. The original skill is backed up under ignored `build/skill-backups/`.
- Built `build/release/Orbiter_0.6.1_x64-setup.exe`: 4,401,409 bytes, SHA256 `5f3f879ca326371d93cffbc25308828068a9689a75fcb955bcb11327c3b8fb52`. `node scripts/verify_package.cjs` passed actual binary/installer 0.6.1 versions, original public-key continuity, updater/trusted-comment signatures, tamper rejection, checksums/alias/build-output equality and embedded final frontend. Report: `build/release/verification-0.6.1.json`; Windows Authenticode: NotSigned. The previous local 0.6.1 package is preserved under `build/release/history/0.6.1-before-companion-art-20261027-af9c6b9c/`.
- User explicitly requested this task's final commit/push. Installer/updater assets remain local; no installation or release publication was performed. Installed upgrade, physical scaling/iPhone, actual screen-reader speech, live cloud reconciliation and native CPU/RAM/FPS remain unverified. The exact four-item context-loss recovery path is also unverified; the shared chest context-loss regression passed.

### Focus reliability and accessible feedback — 2026-10-27

- Integrated into `codex/ui-direction` from focused task `01a17a2d-b7b1-7221-a09a-85e94ad7cc2a`, worktree `ce1e`, based on `2065098`; subsequently committed/pushed as `ef77d18` (verified before the art pass). Manifests remain 0.6.1; older version entries below describe their dated deliveries.
- Browser timer edits now share a pending-save guard across timer, main-card and delegated sanctuary controls. Completion waits for accepted persistence, uses one shared live announcement, rejects repeated Finish after completion, and offers an explicit retry after failed expiry saves. Completing a linked assignment restores keyboard focus to Take a break only if the completed button still held focus. Native timer/reward authority and storage schemas are unchanged.
- The paired browser companion changes its live status only when the message changes; its countdown continues each second. A regression reproduced five status mutations for one unchanged message before the repair and confirms quiet heartbeats plus real pause/completion/disconnect/reconnect announcements afterward.
- Production canonical/shared sources, generated iPhone/fictional preview, service-worker shell identity and native frontend are refreshed. Main-checkout focus, companion, notification, offline-data and four-layout phone-control regressions passed; source/version and diff checks passed. Desktop/phone saving, retry, completion and keyboard-focus captures are under ignored `build/focus-completion/`; companion captures are under `build/study-companion/`.
- Installed Windows behavior, physical iPhone/WKWebView, live cloud persistence and actual screen-reader speech remain unverified. General concurrent non-timer saves and account/import replacement are outside this local timer guard. The initial focus pass left changes uncommitted and performed no packaging, installation or publication; later delivery is recorded above. Source fixes are in the integration checkout; retain the focused worktree until its duplicate uncommitted work can be safely archived.

### Local Windows 0.6.0 delivery — 2026-10-24

- User explicitly selected “Make this 0.6”; synchronized npm/lock, Cargo/lock, Tauri and both Xcode marketing fields to 0.6.0. Current main sources were regenerated and packaged with the existing updater key. Earlier versioned artifacts remain preserved. This does not import the separate worktree's chest, account transport/SQL candidate or other unintegrated changes.
- Installer: `build/release/Orbiter_0.6.0_x64-setup.exe` (4,366,456 bytes), SHA256 `f59abc698699dc69adbbcbfff4a7c4769a9e00ae7c18d547938101761328212e`. Cryptographically verified updater signature and trusted comment, tamper rejection, original public-key continuity, checksums, alias and embedded final assets/inline HTML blocks. Actual application product/file versions are 0.6.0. Authenticode is NotSigned. Verification report is `build/release/verification-0.6.0.json`.
- Release copy: `../RELEASE-0.6.0.md`; ready-to-copy commit draft: `build/release/COMMIT-MESSAGE-0.6.0.txt`. No staging, commit, installation or publication. Installed upgrade and hosted updater feed remain unverified; iPhone journal/Health gates remain disabled. Tray Quit exits before a user-run install; × leaves Orbiter running.

### Protected journal and life-hub integration — 2026-10-24

- Main now additively integrates shared health/model/sync/hub sources and Today/Study/Health/Life navigation from Testing Orbiter, preserving newer notification code. Canonical Hub navigation/date-planning/draft hooks and deterministic generation are included; iPhone, fictional preview and native frontend regenerated. Main remains 0.5.3. The other worktree's chest, cloud Rust/browser transport, SQL migration and 0.5.4 release changes are not copied in this step. Main account journal transport is therefore still unavailable; no live sync is claimed.
- Added `web/native-life-journal.js`: awaited native consent/read/save/clear/revoke, confirmed revision/payload before adopting saves, owner/epoch guards and explicit reconciliation after uncertain outcomes. Hub awaits operations, preserves newer form typing during saves and never touches `orbiter.life` WebKit storage on iPhone. Native session consent/cancel/revoke source exists; both release gates remain false. Revoke retains disk data and does not undo an already accepted mutation.
- Passed 107 controlled native store/consent assertions and 27 Health assertions; JS controller/bridge tests; real generated iPhone UI through production transport with fictional enabled and closed-gate native responders; full life-hub CRUD/import/draft/owner/timer authority and 15-layout regression; model/health-data tests; offline/privacy/import/export and reminder browser regressions. Swift syntax parse and source/version checks passed. Reviewed generated phone captures. The first full hub run used stale desktop output and timed out; after native asset regeneration it passed. The old artwork test needed explicit Study navigation after the new Today landing page; then it passed.
- No Apple SDK build, actual native consent UI, file protection/backup or physical iPhone check is established. No new commit, staging, push, merge, install, cloud deployment or upload. Next: review the combined source on Mac, then validate consent/protection and device behavior before any gate activation; native account linking and the separate cloud candidate integration remain work.

### Apple Health source preparation — 2026-10-24

- Added HealthKit reader/projection source and Xcode membership, guarded native confirmation/health route and asynchronous JavaScript Health contract. Both shipping capability gates remain false. Native memory-only anchors, UUID deltas/explicit deletes, source-separated nutrition, sleep interval union/stages and daily HealthKit step statistics are source preparation; no live data, account identity or phone-to-PC connection is established. Read-purpose text is present; the entitlement example is deliberately inactive. See `../APPLE-HEALTH.md` and `../XCODE.md`.
- Passed 27 controlled Foundation Health projection/actual closed-handler assertions, 95 storage assertions, 117 notification assertions, JS bridge contracts (including disconnect races), offline and notification browser regressions, source/version checks and full-wrapper Swift syntax parse. Apple SDK typechecking, actual queries/consent, device protection and backups remain unverified. User has no Mac yet; prepare the handoff here without enabling access.
- Coordinated final native payload with Testing Orbiter, which owns separate life-hub/cloud candidate work. That UI is still not integrated here; asynchronous protected journal integration and native consent remain required before opening its iPhone gate. Main remains 0.5.3, worktree 0.5.4 alignment deferred to combined integration. No new commit, push, merge, installation, deployment or upload.

### Xcode workflow and native life-store foundation — 2026-10-23

- Verified human steering in Testing Orbiter selects local Xcode development instead of TestFlight distribution. Windows remains the source-preparation host; Mac Xcode/Apple SDK and physical iPhone validation are not available here. `../XCODE.md` is the current workflow; historical TestFlight evidence is retained without upload authorization.
- Main implements a dedicated `Scheduler/ProtectedLifeStore.swift` backend and Xcode entry, guarded `lifeStore` message routing, and Promise-based `web/native-life-store.js` embedded by the iPhone generator. Shipping read/write and native consent gates remain false. No health data migration, HealthKit, native account auth or cloud path is implemented. Fixed native device scope, bounded schema envelope, CAS revisions, delete tombstones and protected/excluded atomic file handling are foundation source, not verified device guarantees. Contract and activation criteria: `../NATIVE-LIFE-STORE.md`.
- 95 controlled Foundation assertions passed, including the actual native handler rejecting forged gate/consent fields; JavaScript contract checks and notification/offline browser regressions passed. All 117 notification assertions, combined Swift syntax parse and source/version checks passed. Apple SDK typechecking, actual complete file protection, physical lock behavior and real backup exclusion remain unverified. No new commit, push, merge, package, install or upload.
- Coordinated with Testing Orbiter's isolated life-hub/chest work; its synchronous browser journal and disabled iPhone gate remain unchanged. That larger UI milestone is not integrated into this main checkout. Main's source version remains 0.5.3; the other worktree's user-approved 0.5.4 must be aligned when combined, without overwriting new iOS source entries.

### iPhone runtime verification — 2026-10-22

- **Passed:** [GitHub run 39869098312](https://github.com/kg-sato/Orbiter/actions/runs/39869098312), commit `9c0743499edc5e0cad71a9be07e2e83d35787ade`, Orbiter 0.5.3, Xcode 26.6 / iOS SDK 26.5, iPhone 17 simulator. Unsigned compilation, 15 runner tests and 22 real WKWebView checks passed. Both native PNGs were downloaded, checksum-verified and inspected; final report says `passed` and `stoppedBeforeExpiry: true`. TestFlight signing/upload was skipped.
- Native checks cover initialization, offline/privacy UI, invalid-import preservation, valid import, native export reception, start/pause/resume, persistence after force-close/relaunch and one completion after expiry. The driver verifies the launched app's host UID and exact executable before stopping only that PID in its disposable simulator. DOM activation is programmatic; system Files selection, touch/keyboard, permission/notification behavior, VoiceOver and physical-device performance remain unverified. See `../TESTFLIGHT.md`.
- Managed worktree: `C:/Users/kgsat/.codex/worktrees/ios-runtime-verification/Scheduler`, branch `codex/ios-runtime-verification`, based on main-workspace commit `af65872`. Earlier focused commits/pushes were explicitly authorized. Main remains on `codex/ui-direction`; verified source/test/docs changes are integrated here uncommitted, with staging preserved. The final integrated runner passes all 15 tests here.
- The next phone-controls step is implemented: Quick Capture's blank icon is replaced by an SVG; Search/More have 44px minimum targets. Four portrait/landscape sizes passed geometry/hit tests, Capture/menu dialogs and mobile navigation; screenshots were inspected and the existing offline browser regression passed. The final native run also includes this repair and its screenshot visibly shows the Capture icon.
- **Commit preference:** the user subsequently asked to stop committing so often. Leave further implementation edits uncommitted; obtain fresh approval before any new commit or push. The later explicitly authorized PR split is recorded below.
- The user later explicitly requested splitting the eight committed `codex/ios-runtime-verification` changes into two PRs. Created [#18](https://github.com/kg-sato/Orbiter/pull/18) for phone controls and stacked [#19](https://github.com/kg-sato/Orbiter/pull/19) for simulator verification, one consolidated commit each; their combined tree exactly matched `9c07434`. Original history and uncommitted work were preserved. Manual merge instructions were supplied; this chat did not merge either PR. That scoped authorization does not authorize new notification commits/pushes.
- **Priority confirmed by user:** notifications → physical device → Files picker → VoiceOver. Follow `../IPHONE-ACCEPTANCE.md`; system behavior remains unverified by the earlier smoke run. Signing and TestFlight distribution still require confirmed Apple app/team ownership and their explicit authorization. Public privacy/support details are still needed before distribution.

### Physical companion design — 2026-10-22

- User requested a separate Pico 2 W branch. Local `codex/pico2w-companion-design` was created in `C:/Users/kgsat/.codex/worktrees/pico2w-companion-design/Scheduler` from verified source `9c07434`; main checkout stays on `codex/ui-direction`. Design work stays on that branch, uncommitted and unpushed.
- Confirmed starting idea: OLED screen houses the cat. Speakers/voice, movement, lamp lighting and asking questions are possible future modules, all undecided. No hardware purchase, flashing or functioning hardware sync is established. Consult that worktree's `design/physical-companion/` for the design and proposed integration boundaries.
- Design proposal and six-state OLED browser concept are present there. Desktop/mobile, reduced-motion, selected accessibility state, no overflow/network/script errors and local links passed; captures were inspected. Proposed Windows USB mirror and later phone BLE are design choices, not implemented transports.

### Notification preparation — 2026-10-22

- Native reminder range now matches the planner's 240-minute maximum. Unique request IDs and generation guards cancel stale accepted/in-flight reminders; accepted IDs are persisted only after success, with a separate interrupted-add cancellation handle. Permission errors remain distinct from denial; late grants cannot undo opt-out.
- Integrated into main production Swift/canonical HTML with generated iPhone/preview/desktop outputs refreshed. Forty controlled Swift lifecycle assertions and the new Chromium bridge regression passed; offline privacy/import/export and four-size controls regressions passed. No new commit/push, package or installation. The earlier native simulator success predates these edits; new Apple SDK compilation, system permission UI and notification delivery remain unverified.

### Notification settings and reconciliation — 2026-10-23

- Startup and native scene activation reconcile the saved reminder deadline and read current system authorization without prompting. Profile shows blocked/not-requested/quiet/allowed states and banner/sound restrictions separately from saved opt-in, with a direct iPhone notification Settings button. Passive updates preserve study data and unsaved preference drafts.
- Unchanged accepted/in-flight deadlines are idempotent; unrelated saves no longer cancel/recreate reminders. Explicit foreground/permission reconciliation bypasses that guard. Profile saves do not request permission again when already enabled and known to be allowed.
- Main production sources and generated copies updated, uncommitted. Seventy-one controlled Swift assertions, expanded browser notification contracts, offline regression, source/version checks and whole-wrapper Swift syntax parse passed; phone settings captures inspected. This does not establish Apple SDK typechecking, real Settings navigation, system delivery or installed behavior. No new commit, push, package, install or hosted run.

### Pending reminders and foreground completion — 2026-10-23

- Native status now reads actual pending focus requests, with scheduling/status generation guards and a refresh after scheduling/cancellation outcomes. Profile distinguishes missing versus queued reminders; Retry forces reconciliation of the original saved deadline. Queue presence is a snapshot, never a delivery guarantee.
- Foreground focus banners/sounds are suppressed when the planner web view is loaded and available; missing/loading/failed views and unrelated notifications retain native presentation. iPhone completion uses one shared live-region announcement, with session recording unchanged.
- Production Swift/canonical HTML and generated copies are integrated uncommitted. 117 controlled Swift assertions, expanded Chromium notification contracts, offline regression, source/version checks, whole-wrapper syntax parse and narrow-phone Retry hit/layout checks passed; 320px capture inspected. Real Apple SDK compilation, Settings navigation, VoiceOver speech and physical delivery remain unverified. The two PRs are not updated by these edits; no new commit/push/installation occurred.

### Historical state at the initial handoff

The following bullets describe the earlier snapshot; the dated verification above supersedes its iPhone status. The primary checkout remains at `af65872` with the integrated changes uncommitted.

- Latest local commit at initial inspection: `5eff55b`, titled “Orbiter 0.5.3 Transitions and Artwork Reveal tab panels along the wave boundary and prevent scroll events from cancelling animations.”
- The user confirmed **0.5.3**. Package/lock, Cargo/lock, Tauri and Xcode marketing versions now agree on 0.5.3 in uncommitted source. No 0.5.3 binary, installed upgrade or published release is established by this metadata change.
- The working tree was clean at the start of this documentation task. Earlier chat descriptions of staged or uncommitted artwork are historical.
- Current branch: `codex/ui-direction`. Documentation edits from this handoff are uncommitted: `AGENTS.md`, `README.md`, `desktop/README.md`, `docs/UPDATES.md`, and `docs/agents/`. Preserve them and their current staging.
- The locally cached `origin/main` is 12 merge commits ahead, but its tracked tree is identical to HEAD (verified 2026-10-20). No fetch, switch, merge or push was performed; current remote state remains unchecked. Six local planning branches at `5eff55b` are recorded in `../NEXT-STEPS-2026-10-20.md`; uncommitted source preparation remains on `codex/ui-direction`.
- The user selected an **offline first iPhone beta**. `scripts/sync_app.py` now excludes unsupported account code, embeds needed styles and local privacy disclosure, and blocks network connections. UserDefaults privacy reason CA92.1 and source/SDK preflight were added; see `../TESTFLIGHT.md`. Browser file-origin checks pass for native-bridge export/import, invalid-import preservation, reload persistence, zero network and CSP. Swift/iOS compilation, physical-device checks, signing and upload remain unverified. Apple bundle/team ownership and public policy/support contact are still needed for distribution.
- The approved living-pond work was integrated into production sources. The isolated demo imports `web/lake-transitions.js`; its build copies the shared transition CSS.
- Chat delivery covered 14 upgraded reward visuals, not all 51. Confirm current implementation before promising any remaining replacement work.

## Established direction and constraints

### Compact buddy refinement — 2026-10-22

- Uncommitted desktop-only changes improve SVG buttons/icons and the 360–560 × 200–300 compact layout; no version bump, installer, timer/reward rule or storage change.
- Accepted native Start/Resume states trigger a dew arc and pool rings. A new recap on an active-to-stopped timer triggers a masked lily/starlight celebration before the existing recap. Reduced/zero motion uses prompt static acknowledgement; duplicate snapshots do not replay or cancel completion.
- Actual generated native HTML passed 18 size/state geometry and pointer-hit checks, failed-action/completion/deduplication/motion tests, and existing island/unified regressions. Early/middle/settled frames inspected. See `../../design/compact-buddy/README.md` and ignored `build/buddy-focus/buddy-focus.webm`.
- Installed Windows binary, real native expiry and physical display scaling remain unverified; source/browser fixture evidence must not be described as an installed update.
- The local 0.5.3 installer was subsequently built and cryptographically verified, including original-key continuity, trusted comment, checksum and packaged source-asset equality. No install/publish was performed. Read-only desktop inspection on 2026-10-22 found the running app was the portable `build/release/orbit-companion-0.5.0.exe` (0.5.0), while `AppData/Local/Orbiter/orbit-companion.exe` was 0.4.0. Recheck these changing facts before diagnosing an installed UI; neither was the newly built 0.5.3. Do not terminate an active study process without authorization.
- User supplied a 0.5.3 maintenance-screen screenshot; registry/version observations alone were insufficient to establish what UI was loaded. Decompressed Tauri asset blobs were then verified byte-for-byte against current buddy JS/CSS and found embedded in the actual 0.5.3 binary. Installer running-app detection only registered the normal target path, missing the renamed 0.5.0 portable process that shares the single-instance identity. Added `NSIS_HOOK_PREINSTALL` to block all `orbit-companion*` processes and ask for tray Quit without terminating study. A guard-only NSIS fixture returned exit 10 while preserving the running process. Repaired local artifacts are under ignored `build/release/compact-repair/`; installation and end-to-end replacement remain unverified.

One Windows application with planner and floating buddy modes; a blue, ethereal pond; a soft collectible kitten; meaningful visible equipment; glass controls with readable opaque/reduced-motion alternatives. Keep the native timer and existing economy authoritative. Preserve data, identities and ownership. Consult the current skills and source for implementation details rather than replaying the full chat.

## Delivered work summarized from the chat

These are implemented areas discussed in the chat, not a new claim that every flow or published release is validated. Inspect the relevant source for the next task.

| Area | Durable result and primary entry point |
| --- | --- |
| Application shell | One Tauri window with planner/buddy switching, tray behavior and native adapter; `desktop/ui/`, `desktop/src-tauri/src/` |
| Study workspace | My Day, assignments/tests/daily practice, Atlas course notes and My Rhythm; root `Application.html` |
| Data and focus | Native SQLite timer, credit/reward/growth authority and completion recaps; `desktop/src-tauri/src/engine.rs` |
| Accounts | Supabase account sync and Cloudflare-hosted browser delivery were implemented; setup and access limits in `../PRIVATE-BETA.md`; live reconciliation remains a distinct check |
| Updates | Local Windows installer/updater packaging and signed update artifacts; `../UPDATES.md`; building is separate from installation and GitHub publication |
| Companion | Blender-built kitten, persistent course traits, growth, equipment preview and static fallback; `../../src/mascot/` and `../../design/avatar/README.md` |
| Pond and motion | Blue pond palettes, water/mist, shared water-to-glass controller, and real-card reveals; `../../src/pond/`, `../../web/lake-transitions.js`, `../../design/living-pond/` |

Old design requests and large proposed plans are history, not an automatic active backlog. In particular, do not silently resume all 51 reward replacements, build another installer or publish a release merely because it was discussed earlier.

## Transition incident and evidence boundary

The initial stacking repair was insufficient: real planner wrappers used `display: contents`, so clipping those wrappers left the actual cards visible. The subsequent fix clips painted descendants, shares the demo controller and avoids cancelling transitions on harmless queued scrolling.

The chat recorded inspected demo/application frames, motion captures and passing browser/native-mode checks. That does **not** establish a visually confirmed installed Windows upgrade, physical-monitor/scaling behavior, live account sync or a published update feed. Ignored artifacts under `build/` may be absent or stale; check their existence and provenance before linking them.

## Next-task routing

| Request | First action |
| --- | --- |
| “Still wrong” visually | Identify the exact surface/version, reproduce motion there, compare actual card masks/stacking; use `orbiter-motion-review` |
| “Make the EXE” | Resolve version mismatch and approved scope, inspect build scripts, use `orbiter-package` |
| “Commit message” | Inspect current HEAD plus staged/unstaged/untracked scope; use `orbiter-release-writing`; do not commit |
| More cosmetics | Confirm implemented IDs and approval boundary; use `orbiter-companion-art` |
| Merge/release/deploy | Establish explicit authorized action and exact revision/artifacts; local builds alone are not publication |

## Remaining decisions and gaps

- Next version is confirmed as 0.5.3; actual binary and remote release state remain unverified.
- Installed upgrade, live sync, Windows scaling/monitor behavior and comparable native resource measurements remain unverified by this chat's recorded evidence.
- Remaining artwork scope needs an explicit next task; do not automatically turn the historic 51-item plan into a packaging prerequisite.

Update this checkpoint after meaningful integration or verified state changes. Preserve release history; do not append routine tool logs here.

## Fresh main chat startup

Use this file and root `AGENTS.md` as the compact handoff. Inspect current Git status, branch and manifest versions, then load only the guide/skill and source needed by the user's next request. Do not import the old conversation, recursively read release archives, or rerun old builds/checks during startup. The original handoff added documentation only. Subsequent user-authorized 0.5.3 offline iPhone preparation is recorded above; installation, upload and publication remain separate actions.
