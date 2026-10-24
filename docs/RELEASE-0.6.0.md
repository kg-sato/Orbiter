# Orbiter 0.6.0

## Your whole day

- Move between Today, Study, Health and Life without losing the study planner.
- Keep an optional, separate local journal for food, sleep, steps, habits and reflections. Manual records stay distinct from imported observations and native study rewards.
- Enter a focus sanctuary that uses the existing timer; on Windows, native timer and reward authority remain unchanged.
- Keep drafts through failed saves, import validation and navigation guards, with explicit recovery and deletion controls.

## iPhone source preparation

Notification status/reconciliation, pending-reminder recovery and foreground completion handling are integrated in the iPhone source. Protected journal consent, asynchronous persistence and read-only Apple Health foundations are prepared, with release gates still disabled. These sources need current Apple SDK and physical-device validation; this Windows installer does not deliver an iPhone app.

Apple Health, MacroFactor import and account journal sync are not live connections in this build. Existing supported study-account sync is separate. No cloud migration is deployed by this release preparation.

## Local delivery

This is a local Windows installer preparation. It has not been published or installed by this task. Existing updater signing is separate from Windows Authenticode signing. A local update manifest does not activate the hosted update feed.

Before manually installing, choose **Quit Orbiter** from the tray; closing the window with × keeps the process running. The native application identifier and existing study storage identity are preserved. Installed upgrade behavior remains a separate check.

## Verification scope

Source validation includes journal/Health model tests, asynchronous persistence and consent contracts, controlled Swift storage/notification logic, generated iPhone offline/import/export and reminder browser regressions, and life-hub CRUD/draft/import/timer-authority checks across 15 responsive layouts. These do not establish physical-device protection, actual HealthKit access, live cross-device sync, installed upgrade behavior or native performance measurements. Installer version, checksum and updater signature results are recorded separately after the build.
