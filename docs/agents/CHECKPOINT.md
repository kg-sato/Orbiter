# Orbiter coordination checkpoint

Updated **2026-10-21** from this chat and the local repository. This is a handoff, not a release approval. Recheck status and versions before acting.

## Observed state

- Latest local commit at inspection: `5eff55b`, titled “Orbiter 0.5.3 Transitions and Artwork Reveal tab panels along the wave boundary and prevent scroll events from cancelling animations.”
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
