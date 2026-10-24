# Apple Health source preparation

This is a gated source foundation, not a live connection. Both `healthIntegrationAvailable` and `lifeStoreAvailable` in `SchedulerApp.swift` remain false. The generated iPhone page exposes a Promise contract but cannot prompt, read, persist or upload Health readings while these gates are closed. Study data is unchanged.

## Connection contract

`window.OrbiterNativeHealth` uses the existing bundled-main-document-only native bridge:

- `capabilities()` returns contract version 1, device scope, provider `appleHealth`, read-only and cloud false, and current availability.
- `requestAccess({consent:true})` requires native confirmation before Apple's read permission sheet. Request completion is `requestCompleted` with `readAccess: 'notDisclosed'`; it never means permission granted.
- `read({days:7})` accepts 1–31 calendar days, foreground/manual only. Native consent is required; web fields cannot activate native gates.
- `disconnect()` cancels pending work and clears the in-memory native snapshot/anchor. It does not revoke permissions in Apple's Settings or delete separately saved journal observations.

Messages use action `health`, an operation and correlated request ID. Replies use `nativeHealthResult`. Timeouts do not retry automatically; storage replies cannot satisfy Health requests. Disconnection invalidates late access/read results.

## Read model

The reader requests dietary energy, protein, carbohydrate, fat, sleep and steps, with an empty write authorization set. UUID deltas preserve actual source bundle identifiers and names. Explicit deletion IDs win over matching upserts; an empty read never implies deletion. Records and transactions are bounded to 5,000 observations. Anchors and snapshots are memory-only and advance only after successful bounded queries and statistics. Range changes reset the native cache without manufacturing deletions.

Nutrition totals stay separated by source to avoid counting one meal exported by multiple apps. A combined total is supplied only for a single source. Sleep uses the union of clipped asleep intervals; stages remain available on samples. Missing observations remain unknown. Steps use HealthKit cumulative statistics, not a sum of raw phone/watch samples. No meal names, MacroFactor identifiers, nutrition targets or permission decisions are guessed.

Successful reads return `schemaVersion`, `owner`, `provider`, `readAccess`, `range`, `fetchedAt`, `samples`, `deletedIds` and `summary`. Samples contain UUID `id`, `type`, ISO dates, numeric `value`, `unit`, `sourceId` and `sourceName`; sleep additionally has named `sleepState` and `sleepCategory`. Summary contains source-separated `nutrition`, optional `sleepSeconds`, and `steps` with availability, optional value and per-day entries. Consumers must keep imported observations separate from manual meals and require separate explicit sharing consent before any health upload. Native account identity and a deployed phone-to-PC sync are not established.

## Mac handoff

1. Bring the reviewed combined source to the Mac and follow [Xcode setup](XCODE.md). Preserve the newer source membership when merging the separate life-hub work.
2. Build/typecheck against the actual Apple SDK with gates closed. Run controlled fixtures and the disposable simulator harness; this Windows work does not establish either result.
3. Confirm an owned bundle ID and team. In Xcode add the HealthKit capability for the intended device target. `Scheduler/HealthKit.entitlements.example` documents the minimal entitlement; it is deliberately not wired to the shipping target. No background delivery or clinical scope is requested. Read-purpose text is already in both target configurations.
4. Implement and verify the complete protected journal/native consent integration, including lock, backup exclusion, cancellation, consent removal and ownership behavior. Then validate granular denial, empty/partial access, daily steps, sleep overlaps, multiple nutrition sources and explicit deletion on a physical iPhone. Only enable capabilities after that evidence exists.

## Primary guidance

- [Apple authorization guidance](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data): read permission decisions are private; never show a successful request as proof of readable data.
- [Apple statistics collection queries](https://developer.apple.com/documentation/healthkit/hkstatisticscollectionquery): calendar interval statistics underpin daily steps.
- [Apple anchored queries](https://developer.apple.com/documentation/healthkit/hkanchoredobjectquery): incremental samples and explicit deletions.

Local Foundation and JavaScript tests use fictional controlled inputs. Apple SDK compilation, actual permission UI, HealthKit queries, protected physical-device storage and live sync remain unverified.
