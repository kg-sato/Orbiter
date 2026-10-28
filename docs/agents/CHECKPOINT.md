# Orbiter coordination checkpoint

Updated **2026-10-26** from this chat and the local repository. This is a handoff, not a release approval. Recheck status and versions before acting.

## Observed state

### Requested 0.6.6 package and PR — 2026-10-28

- User authorized packaging, committing/pushing with past-tense subjects of at most three words, and a new PR covering version/application changes. Prepared dedicated `codex/stillwater-0-6-6`, preserving the earlier enrollment commit. Versions now agree on 0.6.6, above historical local release records through 0.6.5; latest published release checked at intake was 0.6.0. No release publication, merge or installation is implied.
- Built signed updater-compatible `build/release/Orbiter_0.6.6_x64-setup.exe` (4,403,643 bytes), SHA256 `16c3241d911096a77682d17f4e3a5a64cb90f3a3b21282a3cd1c71fc28f699db`. Crypto signature/trusted comment, tamper rejection, key continuity, checksums/alias, actual binary/installer versions and embedded final assets pass; 92 frozen inputs unchanged. Authenticode NotSigned. [Verification and limits](../VERIFY-0.6.6.md), [release notes](../RELEASE-0.6.6.md).
- Final 0.6.6 discovery, chest, cloud, generation and iPhone source suites pass. Packaging script now uses the existing shared dependency setting for its Tauri CLI too. Source/artwork/previous discovery work is included in the requested commit scope. Local vault remains separate; installed/device/live-service behavior unverified.

### Stillwater kitten and discovery voice — 2026-10-28

- User selected **moonlit storybook — soft and mysterious**. Rebuilt original kitten with a pear-shaped head, smaller inset eyes, shallow pink ear bowls, a sculpted muzzle, fuller seated body and matte materials. New editable `design/avatar/orbiter-kitten-stillwater.blend`; old Blender sources preserved. Runtime/cache revision `orbiter-kitten-stillwater-1`; four identities/growth stages and rig contracts preserved. GLB 19,824 triangles, eight bones, six materials. SVG fallback follows the new treatment.
- Discovery-only text now uses warm italic local serif titles, `from the stillwater`, `The moonpool archive`, and `A keepsake, now yours.`; actions, rarity, item identity and failures remain clear. `halo-01` Petal Bow now has folded petals/knot/tails at the ear, with matching fallback. [Current source and review](../../design/avatar/README.md).
- Final preview suite passes including computed font/style/weight, expected portrait, authority/failure/duplicate guards, fallback and no-scroll 360/420/560px buddy layouts. Existing cosmic/equipment, avatar-cache, generation and iPhone source checks pass. Chest lifecycle passed against the new kitten. Controlled turnarounds/identity/growth/bow fits and final phone/buddy typography inspected under `build/art-redirection/` and `build/discovery-preview/`.
- Canonical/iPhone/preview/native output integrated; source version stays 0.6.1. Uncommitted alongside the preceding discovery work; no new commit/push/package/install. Installed Windows, physical iPhone/VoiceOver, live services and full-app resource use remain unverified. User taste remains a review decision, not something automated tests establish.

### Actual companion discovery portraits — 2026-10-28

- Accepted chest results now show a cached portrait of the actual main kitten (planner) or active course kitten/growth (buddy), with existing equipment plus the discovery. It is explicitly preview-only until accepted Equip; failed Equip can retry, duplicate activation is guarded, and stars retain a nonwearable result. No economy, identity, authority or storage change.
- Shared `rewards.js`, native shell and scoped styles integrated; canonical/iPhone/preview/native outputs regenerated at 0.6.1. [Design, acceptance and evidence](../../design/discovery-preview/README.md). New preview suite and existing chest lifecycle suite pass, including no extra context and canvas restoration. Phone/fallback and 360/420/560px long-name buddy captures inspected; name and Equip fit before scrolling. Build/generation/iPhone source checks pass.
- Changes remain uncommitted; earlier commit/push authorization was already fulfilled. No new package, install, device or live-service check. Vault research/session notes updated. Separate source-audit candidate (not implemented): stalled chest requests retain the shared busy lock and prevent collection navigation until settlement.
- Existing equipment/cosmic regression also passes after correcting its broken-avatar fixture to corrupt the exact kitten asset instead of the first embedded GLB (now the chest). Vault link/JSON/source-hash audit passes at 178 notes.

### Knowledge vault and recoverable browser enrollment — 2026-10-28

- Created separate `C:/Users/kgsat/Documents/ChatGPT/Projects/Orbiter Vault`, with Home, guidelines, ideas, templates, provenance, Roblox transfer inventory and project knowledge. See [cycle brief and source boundaries](../VAULT-RESEARCH-2026-10-28.md). Vault snapshots are dated evidence, not active project instructions or proof of installation.
- Browser enrollment now prepares candidate state and atomically commits guest backup/account cache/active owner before publishing connected state. Failed pull or aborted storage leaves enrollment retryable; repeated enrollment preserves the original guest backup. Shared cloud bundle and affected service-worker hash regenerated; core and native frontend preparation passed. Source version remains 0.6.1.
- The baseline failure was reproduced in synthetic Edge account tests. Final expanded cloud browser and codec suites pass, including download/storage failure, asynchronous abort, reload/retry, duplicate enrollment and exact guest restoration. Vault audit passes with 177 notes and no broken wikilinks/JSON/source-hash failures. Generation (2), iPhone source/version and offline HTML browser checks pass. No live account writes, native package, installed-app/device check, commit, push or publication.

### One-time follow-up commit/push authorization — 2026-10-26

- User explicitly requested “commit and push for me this one time.” The 11-file continuation inventory matched the verified working sources, with an empty index and base `2e95109`, on `codex/companion-life-improvements`. This authorizes one follow-up commit and normal push to the existing PR #26 branch; it is not standing authorization for later commits, merges, releases or deployments. The sections below record the pre-commit implementation and verification state.

### Hidden/offscreen rendering continuation — 2026-10-26

- User requested continued improvement after PR #26. Reproduced wasted rendering behind the Field Guide (10 extra kitten frames in a 350ms idle sample). Cat/pond drawing now pauses when its host is hidden, disconnected, outside the viewport or obscured by the active modal; scrolling, closing dialogs and returning to Study resume it. Visible equipment previews keep animating, including when exposed after closing a stacked modal. Workspace/native refreshes cannot bypass the modal guard. Timers, storage, identity and graphics preferences are unchanged.
- PASS `test_cat_visibility.cjs` against actual generated HTML, including zero added cat/pond frames in suppressed states, offscreen/section/modal resume, repeated workspace refreshes, stacked modals, reduced motion and one renderer. Snapshot restoration, Field Guide and all 18 native buddy regressions pass. Chest early/middle/late screenshot sampling now uses Playwright's controlled clock; the production controller, geometry/context, grant and lifecycle assertions pass without wall-clock screenshot races. Generation/idempotence, iPhone source/version, avatar-cache and timer DOM regressions pass.
- Source/native/iPhone/preview copies regenerated at 0.6.1. All continuation work remains uncommitted/unpushed on top of `2e95109`; PR #26 is unchanged. GitHub reports no CI checks for that PR head. Installed, physical-device, battery and whole-app CPU/RAM behavior remain unverified.

### Commit/PR completed; separate continuation — 2026-10-26

- Fulfilled the explicit immediate commit/push/PR request: commit `2e9510968b49cc91a6a1d6191aeacf0b8eb57735` on `codex/companion-life-improvements`, [PR #26](https://github.com/kg-sato/Orbiter/pull/26). Verified remote branch hash. One consolidated commit over main `fee79ec`, preserving main's 0.6.1/chest work. PR is open, not merged; no install or publish. Missed automation remains paused.
- Continued separately after opening the PR: the chest's direct canvas lease also exposed the missing-kitten issue. Added the same bounded actual-kitten snapshot immediately before the chest borrows the renderer. New assertions failed before the fix and pass for planner and buddy chest frames, with one context, original canvas restoration, grant/cancel/error/motion safeguards and fallback behavior. Core/native generation, stable generation and iPhone source/version checks pass. This follow-up and its generated copies are intentionally **uncommitted/unpushed**, outside the PR commit, pending another commit instruction.

### PR integration on current main — 2026-10-26

- Preparing the authorized single consolidated commit on `codex/companion-life-improvements` against refreshed main `fee79ec`. Main includes animated chest opening and 0.6.1; preserved those sources/manifests, combined buddy styles and regenerated canonical/iPhone/preview/native outputs. No release-version bump was introduced by this work.
- Combined source verification passes: new preview/guide/habit browser suites, generation/iPhone/version checks, diagnostics/recovery/cache checks and 26 engine tests. Chest browser suite passed alone after a late-frame timing timeout while run concurrently; no chest source or assertion was weakened. Installed, physical-device and live-sync checks remain separate.

### Immediate commit and PR instruction — 2026-10-26

- User explicitly requested committing the current reviewed work and creating a PR now, then continuing improvements. The 48-file reviewed inventory matched working sources at intake; index was empty, base `d7a8456`. This supersedes the expired scheduled window for this one immediate commit/push/PR only. Keep the missed automation paused. Continued work should remain separately reviewable and uncommitted.

### Commit check and preview repair — 2026-10-26, 11:35 Toronto

- User asked whether the commit happened and requested continued improvement if not. Git still showed base `d7a8456` and all chat work uncommitted; no reason for the missed scheduled result is established. Paused expired automation `orbiter-single-optimization-commit` to prevent a late commit during new edits. No immediate commit or replacement schedule is authorized by this follow-up.
- Reproduced the generic-placeholder preview: shared canvas moved without a matching parked image. `src/mascot/cat.js` now captures the actual current kitten before handoff, scales to at most 240px, retains at most eight parked hosts, and restores the same live canvas/identity on Cancel. Disconnected/repainted hosts release obsolete snapshots; scoped web/buddy styles hide fallback art only while an actual snapshot exists.
- PASS new `test_cat_preview_restore.cjs` (failed before fix), equipment suite, Field Guide suite, build/generation, iPhone source/bundle checks and actual-asset cache test. Controlled before/parked/restored captures inspected: mean RGB difference 0.22 for downscaled parked image, 0 for restored live image. One WebGL context and no workspace mutation; no new continuous render loop. All 18 native buddy state/size and mode/feedback regressions also passed. Installed app/device behavior remains unverified.

### Approved lightweight companion comparison — 2026-10-26

- User approved one pre-rendered animation + still-pond trial before a broad conversion. Added [isolated trial and measured results](../../design/companion-lite/README.md), using original GLB → Blender CPU renders → Pillow lossless WebP strip (16 × 192px, 216 KB, 2.25 MiB decoded). One plain kitten only; runtime cosmetics/growth variations are explicitly excluded. Default app renderer and original assets unchanged.
- Six alternating fresh-Edge scene runs passed. Median sprite/live JS heaps 1.77/12.56 MiB and main-thread task times 95.9/208.9 ms per ~6s. Both responsive; observed RTX4060 Ti/D3D11. Not whole-app/device/GPU-percent evidence; aggregate CPU comparison suppressed because of process churn. Model/atlas hashes and silhouettes checked. Local trial preview at port8014 was started; reuse if alive.
- Include the reviewed study assets/scripts/docs in the existing single 01:55 consolidated commit after final hash inventory refresh. This is a trial rather than a production graphics-mode conversion; no install/package/publish.

### Companion then Life features — 2026-10-26

- User ended optimization and selected companion first, then Life. Added read-only Companion Field Guide (main/course kittens, three portrait angles, four temporary growth previews, native progress/equipment) and seven-day editable habit history using existing journal records. Native authority, identities, storage keys and protected iPhone gates preserved. [Feature use, checks and limits](../FEATURES-2026-10-26.md).
- New feature browser regressions pass at 320/390/1366px; phone captures inspected. Full Life hub regression (15 layouts, CRUD/draft/owner/timer/closed-gate checks), production generation, model/bridge checks pass. Sources and required generated copies integrated, still 0.6.0; installed/device/live sync remain unverified.
- The existing single 01:55 Toronto commit is being prepared to consolidate reviewed feature work with earlier optimization work. Refresh the dated scope and final hash inventory before that run; no immediate commit, package, install or publish.

### Continued optimization and scheduled commit — 2026-10-26

- Paired browser saves now wait for initialization and clear stale recovery drafts only when no newer rejected save owns them. Native diagnostics retain the latest 100 entries capped at 250 characters. Dependency-free regressions pass. Native frontend regenerated; 18 buddy size/state browser regressions pass. Disposable completion frame inspected.
- Core build scripts now accept explicit `ORBITER_NODE_MODULES` to reuse an existing dependency installation; ordinary `npm.cmd run build:core` and `desktop:prepare` pass with the main checkout's matching packages, without copying/installing dependencies. This replaces the temporary build adapter as the documented workflow.
- User explicitly authorized **one consolidated local commit at 01:55 Toronto time today (2026-10-26)**. The active one-time thread automation is `orbiter-single-optimization-commit`; follow [the scoped handoff](COMMIT-SCOPE.md). No commit yet during preparation. Existing boundaries apply outside this specific commit authorization; no push/install/publish.

### Local tool application — 2026-10-25

- User authorized reuse of local Roblox tools for Orbiter. Existing Blender export validator ran read-only; Pillow verified 31 pixel-identical before/after portraits. Shared kitten geometry classification is now cached: repeated clones avoid skin-weight rescans. Actual-asset regression, cosmic browser regression and generation/iPhone checks pass. [Tool evidence and limits](../LOCAL-ART-TOOLS.md).
- Full production compilation succeeded using matching, already-installed main-checkout dependencies via a temporary ignored adapter; repeated compilation is byte-stable. This resolves the previous pass's full-compile gap. Canonical/iPhone/preview/native outputs regenerated. No dependencies installed, source asset edits, installer, install or publish. Existing edits/staging preserved; runtime resource measurements remain unverified.

### Optimization pass — 2026-10-25

- Clean detached checkout at `d7a8456` on intake; manifests remain 0.6.0. Integrated unchanged-timer DOM write suppression, bounded native expiry failure retries, stable life-module generation and preview asset path repairs. No feature or historical asset deletion was justified. All edits remain uncommitted; staging preserved.
- Added linked `CURRENT-CYCLE.md` while preserving prior guidance. See [audit evidence and remaining coverage](../OPTIMIZATION-AUDIT.md) for checks, limitations and the targeted regeneration method. Browser hub regression and 26 engine tests pass; full compiler pipeline, installed behavior, resource measurements, physical iPhone and live sync remain unverified. No package/install/publish action.

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
