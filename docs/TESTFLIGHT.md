# Orbiter 0.5.3 — offline iPhone beta

Prepared on Windows on 2026-10-21. Source preparation is not an installable IPA or Apple approval.

## Shipping scope

This beta bundles the canonical planner in a SwiftUI/WKWebView shell with persistent local storage, native Files JSON import/export, calendar-file export, optional local focus notifications and haptics. It includes the shared Three.js companion/pond renderer and matching static fallbacks. iPhone deployment target remains iOS 16; Apple's upload SDK minimum is a separate requirement.

The user selected **offline iPhone beta first**. This generated iPhone bundle excludes account controllers and explicitly says account sync is unavailable. A Content Security Policy blocks network connections while permitting embedded data/blob assets. Windows and hosted-browser account systems remain available in their own builds. No account is required on iPhone; transferring a JSON copy does not establish ongoing sync. Do not advertise native Windows reward/timer authority as an iPhone capability.

The in-app **Profile → Privacy and your data** disclosure explains local storage, optional notifications, Files providers, backups and deletion. No study data is sent to the developer by this offline build. Device backups and user-selected exports are subject to iOS/provider settings. Deleting the app can delete local data; keep JSON backups.

## Local preparation and checks on Windows

From the Scheduler checkout in PowerShell, using Python 3.11 or later:

```powershell
python scripts/sync_app.py
python scripts/check_iphone.py
node scripts/test_iphone.cjs
```

If shared source changes, run the existing `npm.cmd run build:core` first; it embeds shared modules into canonical HTML and invokes iPhone generation. Do not edit generated `Scheduler/Application.html` directly. `sync_app.py` deterministically applies the iPhone offline policy, includes required account-entry styling and privacy copy, and removes unsupported account scripts.

The browser check uses disposable file-origin storage and a simulated Files bridge. It verifies import/export and persistence in Chromium; it does not validate Swift, WebKit, iOS notifications or a physical phone.

## Compile without signing or upload

The existing `.github/workflows/testflight.yml` supports `upload: false`. It prepares the iPhone bundle, validates versions/privacy/resources, requires an iOS SDK of 26 or later, and performs an unsigned simulator build. Python 3.12 is selected explicitly. A supported Xcode on a Mac or GitHub's macOS runner is required. Running hosted jobs may use billable Actions minutes. The first build-only run passed on 2026-10-22; see the evidence below.

On a Mac with Python 3.11+, from the repository root:

```bash
python3 scripts/sync_app.py
python3 scripts/check_iphone.py --sdk
xcodebuild -project Scheduler.xcodeproj -scheme Scheduler -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/iphone-validation CODE_SIGNING_ALLOWED=NO build
```

Apple requires the iOS 26 SDK or later for uploads since April 28, 2026. Use an App Store Connect-supported stable Xcode; the SDK check does not prove a beta toolchain is upload-eligible. Retaining an iOS 16 deployment target does not require building with an old SDK.

## Native acceptance before distribution

Test on simulator and a physical iPhone; record exact device, iOS version and build:

- First launch and relaunch retain schedule, notes, preferences and focus history; upgrade preserves an existing test workspace.
- Touch edits, drag/scroll, safe areas, landscape, keyboard, dialog focus and cancellation work without losing drafts.
- Files JSON export and valid import work; invalid/cancelled import preserves data. Calendar export opens in a compatible app without claiming live calendar sync.
- Focus start/pause/resume/completion remain correct through backgrounding and relaunch; permission denied/allowed and local-notification delivery behave correctly. No continuous background timer execution is promised.
- VoiceOver, larger text, Reduce Motion and graphics failure retain usable controls and readable static artwork. Measure memory/thermal behavior with pond effects enabled and paused.
- The offline notice and privacy disclosure are accessible; no dead Account button or remote resource requests appear.

The original Windows preparation did not compile native code. The subsequent [build-only run 39834359689](https://github.com/kg-sato/Orbiter/actions/runs/39834359689) compiled commit `af65872bbf550f0096fc8848e79383e6710bc2c0` successfully with Xcode 26.6 / iOS SDK 26.5 on 2026-10-22. Signing/upload was skipped. That run did not launch the app or validate device behavior.

### Automated simulator acceptance

The focused `codex/ios-runtime-verification` worktree adds an opt-in `DEBUG && targetEnvironment(simulator)` harness and `scripts/run_iphone_simulator.py`. Normal launches, Release builds and physical-device builds do not run the harness. It uses fictional data on a newly created disposable simulator; never invoke it against a personal workspace.

The updated build workflow runs the native app after compilation and saves `iphone-simulator-evidence` for 14 days, on success or failure. No signing inputs are used by the simulator step. The focused branch was committed/pushed with user authorization. Native smoke results and workflow-level results are recorded separately below.

Checks cover real WKWebView initialization, offline/privacy disclosure, horizontal overflow, invalid-import preservation, valid native-to-web import, web-to-native JSON export reception, focus start/pause/resume, persisted workspace across process relaunch and a single completion after the process stops before the fictional timer expires. DOM controls are activated programmatically. The export hook observes the actual message handler after its bundled-document guard, then suppresses the system sheet; Files provider interaction remains untested.

From a Mac, after the unsigned Debug build above:

```bash
python3 scripts/test_iphone_simulator.py
python3 scripts/run_iphone_simulator.py \
  --app build/iphone-validation/Build/Products/Debug-iphonesimulator/Scheduler.app \
  --output build/iphone-simulator
```

The runner selects a compatible available iPhone/runtime template, creates a new device, and shuts down/deletes only that created UUID. It records the selected device, runtime, version, commit (in CI), phase checks and screenshots. Missing reports, failed checks, mismatched versions or expiry before termination fail the job. Windows runner unit tests verify orchestration and cleanup only; they do not execute WebKit or Swift. Actual touch/keyboard, landscape, system Files pickers, permission handling, notifications, VoiceOver, rendering quality and physical-device acceptance still need native verification.

This approach uses Apple's [Simulator command-line guidance](https://developer.apple.com/videos/play/wwdc2020/10647/).

On 2026-10-22, [run 39864591545](https://github.com/kg-sato/Orbiter/actions/runs/39864591545) compiled commit `1bbe6fa53dce1b1e84a586cd44ba2caefce7c99a` and passed all 22 checks across the seed/verify reports on iPhone 17 / iOS 26.5. Both reports contain `success: true`, no errors, and the runner confirmed termination before expiry. Saved data persisted and completion appeared exactly once after relaunch. The overall job failed afterward during an extra full-simulator screenshot; this is not a green workflow run. Commit `65e7b3e` removes that unreliable extra capture, requires/copies both native WKWebView PNGs, and passes 11 runner tests. The new full workflow run remains pending.

The next phone-controls step restored a missing Quick Capture SVG and enlarged Search/More to 44px targets. `scripts/test_iphone_controls.cjs` passed at 320×568, 390×844, 430×932 and 844×390, including center hit tests, dialogs and mobile navigation. Screenshots were inspected, and the existing offline browser regression passed. This Chromium coverage does not establish native touch/VoiceOver acceptance.

## Distribution setup still needed

1. Confirm the intended Apple app record and its registered bundle identifier/team. The project retains `com.example.scheduler` as a development placeholder until ownership is confirmed; signing scripts reject that placeholder and require a registered override. Do not change the Windows identifier `com.kgsato.orbit`.
2. Provide a public privacy-policy URL and support URL/contact under your control. Publish the reviewed offline policy from `docs/IPHONE-PRIVACY.md`, with real contact details, before submission. In-app local text is useful disclosure but does not supply App Store Connect's required public policy URL.
3. Complete App Store Connect name, subtitle/description, accurate screenshots, age-rating questionnaire, privacy details and export-compliance answers for the actual binary. The offline manifest declares no developer collection/tracking; reconcile this with the archived privacy report and actual dependencies. Encryption settings require owner confirmation against the shipping binary; do not treat a source value as a legal determination.
4. Prepare Apple Distribution signing and App Store profile for this exact app. Keep private material out of chat/source. Use protected repository secrets for hosted signing.
5. After explicit authorization, compile, sign/archive and upload; then wait for Apple's processing and validate the processed build. External TestFlight testing may require beta review. App Store publication and tester invitations remain separate actions.

### Hosted signing inputs

| Kind | Name |
| --- | --- |
| Variable | `APPLE_TEAM_ID` (10-character team ID) |
| Variable | `APPLE_BUNDLE_ID` (registered identifier matching the app record/profile) |
| Secret | `BUILD_CERTIFICATE_BASE64` (Apple Distribution P12 including private key) |
| Secret | `P12_PASSWORD` |
| Secret | `BUILD_PROVISION_PROFILE_BASE64` (App Store profile) |
| Secret | `ASC_KEY_ID` |
| Secret | `ASC_ISSUER_ID` |
| Secret | `ASC_PRIVATE_KEY` (App Store Connect .p8 content) |

The hosted script creates an ephemeral keychain, validates team/profile/identity, archives, exports with upload destination and cleans up signing files. It does not invite testers or publish to the App Store. `upload-testflight.sh` offers the Mac workflow with a configured Xcode account or API key and now regenerates/validates before archiving. Both paths need verification on macOS.

## Review notes to adapt to the validated build

Orbiter is an offline study planner with a local companion and pond. No sign-in is required in this iPhone beta. Planning, course notes and focus history persist on-device. Profile includes the privacy disclosure; workspace Export/Import uses the native Files picker and calendar export writes a snapshot. Notifications are optional local reminders. Native Windows companion/window behavior, cloud accounts and automatic cross-device synchronization are outside this iPhone beta. Include test results and any known limitations accurately; do not claim they passed before device acceptance.

## Apple references checked

- [SDK upload minimum](https://developer.apple.com/news/?id=ueeok6yw)
- [App Review Guidelines: completeness, minimum functionality and privacy](https://developer.apple.com/app-store/review/guidelines/)
- [Required-reason API manifests](https://developer.apple.com/documentation/technotes/tn3183-adding-required-reason-api-entries-to-your-privacy-manifest)
- [Upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
- [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [GitHub signing setup](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications)
