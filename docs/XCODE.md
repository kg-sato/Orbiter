# Orbiter iPhone development with Xcode

The user selected local Xcode development on 2026-10-23. TestFlight upload is not part of the current task. Historical TestFlight notes remain evidence of prior simulator preparation, not authorization to upload.

Xcode runs on a Mac. This Windows workspace can prepare source and run the local logic/browser checks; no Mac or physical-iPhone connection is established here.

## On a Mac with Xcode

Use a checkout containing the reviewed combined source; current Windows uncommitted edits are not automatically present in another checkout. From that project directory:

```sh
python3 scripts/sync_app.py
python3 scripts/check_iphone.py --sdk
open Scheduler.xcodeproj
```

Select the **Scheduler** scheme and an available iPhone simulator, then Build/Run. For a simulator-only unsigned check:

```sh
xcodebuild -project Scheduler.xcodeproj -scheme Scheduler -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/iphone-validation CODE_SIGNING_ALLOWED=NO build
```

These commands are provided for Mac execution; they have not been run for the new protected-store source. Run the existing disposable simulator harness only on its fictional fixture, never a personal workspace. A simulator pass does not establish file protection while a physical phone is locked or actual backup exclusion.

## Physical iPhone

Confirm the owner-controlled development team and registered bundle identifier before changing signing. The current iOS identifier is a development placeholder; preserve Windows `com.kgsato.orbit`. Installing/running a signed device build needs that setup and the applicable authorization. No signing secrets belong in source or chat.

Follow [iPhone acceptance](IPHONE-ACCEPTANCE.md), then the protected-store activation criteria in [native life storage](NATIVE-LIFE-STORE.md). Keep native health capabilities unavailable until those checks and actual permission/storage features are complete. Version alignment with the separate 0.5.4 life-hub worktree must preserve the newer Xcode source entries and notification logic.

## Apple Health preparation

See [Apple Health source and activation checks](APPLE-HEALTH.md). Health access remains disabled; the entitlement example is not active signing configuration.
