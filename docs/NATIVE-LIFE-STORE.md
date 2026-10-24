# Native life storage foundation

2026-10-24. **Source implementation and contract only; iPhone health persistence remains disabled.** Native authentication, live account sync and migration are not implemented by this milestone. Gated HealthKit source is described separately in [Apple Health preparation](APPLE-HEALTH.md). No user journal data is transferred or migrated.

## Storage and ownership

The proposed native backend uses a dedicated Application Support directory, complete file protection, backup exclusion and serialized compare-and-swap revisions. It does not use WebKit storage, UserDefaults, ordinary workspace exports or the study cloud codec. Only native-owned `device` scope exists; accepting a web-supplied account identifier would not establish authentication. A delete leaves a payload-free revision tombstone so an old writer cannot recreate a deleted journal at revision zero.

Backend envelope validation checks a JSON object with `schemaVersion: 1` and at most 5 MiB UTF-8. This is not full domain validation; the life model must still normalize its meals, metrics, habits, reflection and journey fields. Protected file handling, backup exclusion, lock behavior and real device durability require validation on a Mac/iPhone before activation.

## Asynchronous browser contract

The generated iPhone bundle embeds `web/native-life-store.js`, exposing `window.OrbiterNativeLifeStore`:

- `capabilities()` → Promise with `contractVersion: 1`, `owner: 'device'`, `available`, `consented`, `read`, `write`, `cloud`, `healthKit`, `reason`. Availability/read/write describe the release gate; consent is a separate native session decision.
- `requestAccess({consent:true})` → Promise after native confirmation, `{status:'consented',owner:'device'}`. Web intent cannot grant consent. It lasts for this app session, not across native app restarts.
- `revoke()` → Promise after previously accepted disk work finishes; clears journal and Health access intent, but keeps the disk copy. An earlier accepted mutation may have completed; revocation is not deletion or rollback.
- `read({owner: 'device'})` → Promise with `{status:'ok', owner, revision, json?}`.
- `write({owner:'device', expectedRevision, data})` → Promise with the updated envelope/revision.
- `clear({owner:'device', expectedRevision})` → Promise after revision-checked deletion.

Each request uses the existing bundled-main-document guard and `scheduleFiles` message channel with `action:'lifeStore'`, a unique request ID and an allowlisted operation. Replies use `nativeLifeStoreResult`; errors reject with a safe `code` and message. Requests time out after ten seconds, never auto-retry writes, and reject on page exit. No journal is persisted in the JavaScript adapter. There is a sixteen-request bound.

A timeout or I/O failure can leave a write outcome uncertain after atomic replacement. Preserve the draft, reread/reconcile revision before an explicit retry, and do not promise rollback from an error response alone. Do not replace a corrupted journal silently. Full device durability and interruption behavior remain acceptance work.

**Current capability response is read/write false.** CRUD and consent requests are rejected before disk I/O or a prompt. The web page cannot enable the native release gate or supply native consent.

`web/native-life-journal.js` is embedded immediately after the transport. Its `create({bridge,model,owner})` controller exposes async `open`, `enable`, `save`, `clear`, `revoke` and explicit `reconcile`, plus `snapshot`, `status` and `invalidate`. It never touches WebKit storage. It checks owner/epoch after awaits, retains the last confirmed snapshot on errors, confirms revision and normalized payload before acknowledging saves, and blocks mutations after a conflict/uncertain outcome until an explicit reread. No automatic write retry or optimistic saved state. Forms must retain their separate unsaved drafts and await each controller operation; the life-hub adaptation is coordinated in the separate UI worktree.

## Activation criteria, not completed work

1. Build/typecheck the combined source with Xcode on a Mac and verify the bundled-document bridge guard.
2. Validate the new native session consent/owner lifecycle in Xcode; native account sign-in remains a separate feature.
3. Verify file protection and backup exclusion before writes, replacement writes and deletion; test lock/unlock, interruption, corrupt data, stale revisions and app relaunch on a physical iPhone. Confirm exclusion from actual backup behavior, not only an attribute setter.
4. Integrate a Promise-based life-hub store and update privacy text for the actual storage behavior. Keep ordinary study backup/import and cloud paths isolated.
5. Validate the separately gated HealthKit reader with specific read scopes, purpose strings, denied-access behavior and deduplicated source handling. No live HealthKit capability is claimed here.

The user's current workflow is **Xcode local build/simulator/device validation**, replacing TestFlight distribution as the next target. See [Xcode workflow](XCODE.md). Windows can prepare/test source; it cannot provide Apple SDK compilation or Xcode device acceptance.

## Local checks

`node scripts/test_native_life_bridge.cjs` checks the closed capability gate, request correlation, validation, errors, timeout/cancellation and bounded requests with controlled JavaScript fixtures. Native backend test results and platform limits are recorded in the checkpoint. These checks do not establish Apple file protection, backup exclusion or HealthKit support.

`python scripts/test_native_life_store.py` passed 107 Foundation assertions against the actual store core and extracted native handler, including synthetic future-enabled consent/cancel/revoke cases alongside shipping-gate rejection. `node scripts/test_native_life_journal.cjs` checks acknowledged writes, timeout reconciliation without retry, conflicts, deletion, corruption and owner/revoke races. The iOS-only disk implementation is excluded from Windows execution. These are not Apple SDK, native UI or device protection checks.
