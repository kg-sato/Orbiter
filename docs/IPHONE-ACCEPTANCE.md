# iPhone acceptance queue

Priority confirmed 2026-10-22: **Notifications → physical device → Files picker → VoiceOver**. Version 0.5.3. This is a test plan; unchecked rows are not passing results. Use fictional study data and export a backup before testing an upgrade or import.

## 1. Notifications

Record device/simulator model, OS, source revision plus uncommitted diff, app build, permission state, actual result and evidence for each row. Browser bridge tests do not establish system delivery.

| Scenario | Expected result | Native result |
| --- | --- | --- |
| First opt-in in Profile | System permission request follows the explicit preference save; app handles the answer | Unverified |
| Allow, start a one-minute session, lock phone | One completion notification; reopening records one session | Unverified |
| Pause before expiry | No pending completion alert for the paused timer | Unverified |
| Resume | One alert at the new deadline, not the original deadline | Unverified |
| Reset, or turn reminders off | Prior pending alert cancelled | Unverified |
| Deny permission | Preference switches off with explanation; planner remains usable | Unverified |
| Permission request fails | Retry explanation; saved opt-in is not silently erased | Unverified |
| Turn preference off before permission callback returns | Late grant does not re-enable it | Unverified |
| Change permission in iPhone Settings and return | Current permission/status refreshes without another prompt; saved deadline reconciles without changing timer or opt-in | Unverified |
| Save unrelated Profile changes during focus | Existing reminder remains; permission is not requested again when already allowed | Unverified |
| Permission allowed but no system pending request | Profile reports no pending reminder; Retry reconciles original deadline without starting or crediting a session | Unverified |
| Pending focus request exists | Profile reports that iPhone has a pending focus reminder; this does not promise delivery | Unverified |
| Focus ends with loaded planner in foreground | One accessible in-app completion; no duplicate native focus banner/sound | Unverified |
| Start 240-minute session | Pending request has the actual four-hour deadline; inspect request rather than waiting four hours | Unverified |
| Finish while app visible / backgrounded / force-closed | Check banner/sound under recorded system settings and one completion on return | Unverified |

Record Focus mode, notification sound/banner settings and Scheduled Summary when testing delivery; permission alone does not establish immediate audible delivery. Do not promise continuous background execution.

## 2. Physical device

After installing an explicitly authorized development/TestFlight build, record the exact build and device. Check cold launch, relaunch, existing-data upgrade, safe areas, keyboard dismissal, portrait/landscape, scrolling and touch targets. Run a real focus session through lock/unlock and relaunch; check one completion and preserved history. Observe responsiveness, memory and heat with pond animation active and paused. Existing simulator screenshots and Chromium geometry checks remain separate evidence.

## 3. Files picker

Export fictional workspace JSON to On My iPhone and an available provider, cancel export, reopen exported JSON, import a valid modified copy, cancel import, and select malformed JSON. Verify cancel/invalid input preserve the original workspace byte-for-byte through the app snapshot; valid import survives relaunch. Export calendar and open in a compatible app. Record provider/OS and actual sheet interaction. Existing native smoke suppresses the export sheet and therefore does not cover these rows.

## 4. VoiceOver

On the same physical build, enable VoiceOver and navigate without sight through mobile tabs, Capture, Search, Add, focus Start/Pause/Resume/Reset, Profile and Files actions. Verify names, roles, state changes, logical order, dialog entry/return focus and no traps. Check completion/error announcements without duplicate noise. Repeat key flows with larger text and Reduce Motion. DOM labels and browser automation cannot establish VoiceOver acceptance.

## Local checks

`python scripts/test_iphone_notifications.py` compiles the actual Swift reminder methods against controlled callback fakes. On 2026-10-23, 117 assertions passed locally, including cancellation/replacement races, failed adds, permission/status outcomes, unchanged-deadline preservation, forced reconciliation, cleanup of a prior-launch pending request, pending-query ordering/filtering and foreground presentation. Missing/loading/failed web views retain native banner/sound; available loaded planners suppress the duplicate focus presentation. This is logic coverage, not Apple SDK compilation or notification delivery. The hosted workflow includes this check for its next authorized run.

`node scripts/test_iphone_notifications.cjs` exercises the generated iPhone HTML against a mocked native message bridge: four-hour deadline, grant, pause/resume/reset cancellation, transient permission error, denial, delayed grant after opt-out, persistence, startup/foreground reconciliation, system-status variants, pending/missing reminder status, Retry with the original deadline, Settings button message, unsaved checkbox preservation and phone layout. Unrelated Profile saves do not request permission again when system status is known to allow notifications. A fictional expiry records once and uses one iPhone completion live region. Retry's narrow-phone target/overlap and screenshots were checked at 320px; the normal phone view was checked at 390px. It does not show Apple permission/Settings UI or deliver notifications.

Native pending status uses [Apple's pending-request query](https://developer.apple.com/documentation/usernotifications/unusernotificationcenter/getpendingnotificationrequests(completionhandler:)); permission and pending state are separate observations. The foreground handler follows [Apple's presentation delegate](https://developer.apple.com/documentation/usernotifications/unusernotificationcenterdelegate/usernotificationcenter(_:willpresent:withcompletionhandler:)) to suppress this app's redundant focus presentation while the planner is available. Actual VoiceOver speech, foreground/background delivery and process-failure behavior still require native acceptance.

The app reads system permission separately from the saved reminder preference, following [Apple's notification-settings guidance](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/SupportingNotificationsinYourApp.html). Its Settings button uses [Apple's notification Settings URL](https://developer.apple.com/documentation/uikit/uiapplication/opennotificationsettingsurlstring), available from iOS 16. That button's native navigation remains unverified on device.

See [TestFlight preparation](TESTFLIGHT.md) for source/build evidence and distribution prerequisites. No new build is installed or distributed by this checklist.
