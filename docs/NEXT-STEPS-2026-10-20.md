# Orbiter next steps — 2026-10-20

Research and branch plan, not implementation or release approval.

## Current evidence

- Inspected local HEAD `5eff55bbac1a219c6c524a4d4e169d65e8d61a1e` on `codex/ui-direction`. Cached `origin/main` has 12 additional merge commits but an identical tracked tree (`6c125c39d40e5c5838ec429614a3864bf2389f67`). No fetch was performed; this does not establish current remote state.
- Package, Tauri and Cargo manifests specify 0.5.1; HEAD's title says 0.5.3. Decide the next release version before packaging.
- Existing documentation edits and staging must be preserved. New branches start at the inspected HEAD; they do not contain uncommitted documentation.
- Canonical/shared visual implementation exists. Historical browser checks do not prove current installed Windows behavior.
- The checkpoint and `design/living-pond/REFINEMENT-VERIFICATION.md` record 14 upgraded reward visuals out of 51. Treat the remaining 37 as a historical reported gap; inventory current production IDs before selecting further work.
- Native sync and browser account flows exist. Live two-client acceptance remains unverified in this assessment.
- The iPhone wrapper and a no-upload macOS compilation workflow exist. Native compilation/device behavior remain unverified here. `docs/TESTFLIGHT.md` includes offline-only/no-account claims that need reconciliation with the current app; audit privacy declarations against the actual iPhone feature set.

## Evidence from the previous chat

Read the relevant recent pages of **Github Scheduler** (`01a0f06d-75d1-7503-bad6-9f09b4e63ec8`), rather than treating every old proposal as active work.

| Repeated theme | User request examples | Present implication |
| --- | --- | --- |
| Real water-to-glass transitions | “I dont see the lake inspired popup animation”; “tabs appear alongside the wave”; “its under the tabs on the actual app”; “check the demo yourself and check the HTML” | Validate installed behavior and shared-controller parity before another rewrite. |
| Ethereal blue pond and visible mist | “background still feels too generic”; “mist lower opacity but completely covers the whole background”; remove the dark area visible in transitions | Review real moving frames, readability and static fallbacks; retain the established pond direction. |
| Distinctive kitten equipment and open habitats | “each have their own unique identity”; “less like cage and more like a habitat”; “make the habitat Taller”; full 51-reward plan | Audit delivered IDs, then finish bounded approved batches with growth/identity checks. |
| Usable Windows delivery | Repeated installer requests and testing “Check for updates” | Resolve metadata and validate actual upgrade/data retention, separately from publication. |

The original chat's opening request also explicitly names TestFlight as an intended destination. It is an established goal, not asserted here to be a repeated recent request. Commit-message requests were frequent but are a recurring writing task, not a feature branch.

## Branch briefs and acceptance

All branches are local planning branches at the same inspected HEAD. No switching, implementation, installation, upload or publication is included.

| Branch | First bounded task | Observable completion |
| --- | --- | --- |
| `codex/motion-validation` | Reproduce the actual installed transition issue, if still present; compare canonical HTML and shared controller. Use `orbiter-motion-review`. | Early/middle/settled moving frames show actual cards following the wave, with no dark placeholder or hidden controls; rapid navigation, Escape, typing and reduced motion work. |
| `codex/ethereal-pond` | Assess blue pond/mist on the real planner and buddy against established references; propose only evidenced refinements. Use `orbiter-motion-review`. | Mist visibly drifts and responds locally; all three palettes remain readable at phone/buddy sizes; paused and graphics-failure views remain coherent. Measure before optimizing. |
| `codex/companion-artwork` | Inventory all 51 IDs, upgraded visuals and missing states; select the next small batch. Use `orbiter-companion-art`. | Each chosen item has a recognizable static silhouette/pattern; four growth stages retain identity; Preview/Cancel/Equip preserve ownership and saved equipment. Obtain applicable visual approval before production integration. |
| `codex/windows-release-validation` | Resolve intended version, then prepare a release-specific checklist using `orbiter-package` when packaging is requested. | Manifest/binary versions agree; signed artifacts verify; actual old-to-new installed upgrade preserves study data and timer/reward authority. Record scaling/monitor and comparable CPU/RAM results. Publication remains separately authorized. |
| `codex/iphone-readiness` | Reconcile wrapper capabilities, account/auth support, privacy documentation and build inputs; compile without upload on an authorized Mac/macOS runner. | Native compilation passes, then physical-device persistence, keyboard, Files transfer, reduced motion and supported account behavior pass; privacy declarations match shipping behavior. Signing/upload remain separate actions. |
| `codex/live-sync-validation` | Additional recommendation: test existing sync with disposable accounts and two clients. | Bidirectional edits, offline reconnect, conflicting edits, sign-out/account separation, pending focus and duplicate crate recovery pass without extra credits or data loss. |

## Recommended sequence

1. Motion reproduction and Windows baseline first: the user's repeated dissatisfaction concerns actual delivered behavior. Do not label implemented motion as missing merely because installed acceptance is incomplete.
2. Run live sync acceptance before expanding beta use. Validate the deployed policy behavior, not only local SQL/source.
3. Resolve release metadata and close the real installed-upgrade gap before another Windows release.
4. Start iPhone capability/build audit in parallel with bounded Windows work. Fix stale capability/privacy statements before signing or inviting testers.
5. Continue selected cosmetics and pond refinements after inventory and visual review; do not automatically restart the entire historical artwork plan.

## Current primary research

- [Tauri updater](https://v2.tauri.app/plugin/updater/): updater signatures are required. Validate signature rejection and a real installed upgrade; a built installer alone is insufficient.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): ownership policies distinguish existing-row access and permitted new values. Include cross-account read/write denial in live acceptance.
- [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/): distribution requires a processed build; external testing may require review. Account availability alone is not TestFlight readiness.
- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/): review completeness, privacy and minimum functionality against the actual wrapper. Do not infer rejection solely from WebKit use or claim certification from source preparation.
- [GitHub Xcode signing](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications): a hosted macOS runner supports signing with protected credentials. Existing workflow offers compilation without upload; execution and any account costs need the applicable authorization.

## Verification limits

This assessment inspected repository state, focused documentation/source and previous-chat requests, plus current primary documentation. No builds, runtime tests, installed upgrade, live sync, Apple account inspection or remote release verification were performed. Branch creation is organizational preparation and does not complete any workstream.
