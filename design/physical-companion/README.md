# Orbiter physical companion — Pico 2 W design study

Status: **proposal and browser concept**, 2026-10-22. No firmware, wiring, serial transport, BLE integration or physical prototype has been implemented or tested. Base inspected: `9c07434`. This study lives on `codex/pico2w-companion-design`; application changes belong in later scoped implementation work.

## Product direction

A small OLED is the cat's home. It shows the existing companion's mood beside a quiet focus countdown, with an unmistakable disconnected state. The hardware mirrors Orbiter; it does not create a second reward system or a competing timer. Speakers, voice, movement, lamp lighting and asking questions are **open possibilities**, not approved hardware or promised features.

Open [the interactive OLED study](concept.html). Its 128 × 64 monochrome surface is a design assumption, not a selected display. The generic pixel cat explores readability and state changes; it does not replace Orbiter's kitten artwork or determine identity, inventory or growth. Concept buttons change fictional states only. No device, app workspace or network connection is used.

## What the board can support

Pico 2 W uses RP2350 with a selectable dual Arm Cortex-M33 or dual Hazard3 RISC-V architecture at 150 MHz, 520 KB SRAM and 4 MB flash. It provides USB 1.1 and GPIO interfaces including I2C/SPI; its wireless module supports 2.4 GHz Wi-Fi and Bluetooth 5.2. These capabilities make a small display/controller plausible; they do not establish a specific screen driver, audio system or conversational model. [Raspberry Pi specification](https://www.raspberrypi.com/products/raspberry-pi-pico-2/)

The board uses a micro-USB connector. The datasheet covers USB, power paths, wireless antenna clearance and battery charger examples; a charger is not integrated merely because an example exists. Confirm exact board revision, display voltage/interface, power budget and enclosure clearance before assigning pins. Motor, lamp and speaker power/driver design must be reviewed against the chosen modules rather than driven directly from a proposed GPIO pin. [Pico 2 W datasheet](https://datasheets.raspberrypi.com/picow/pico-2-w-datasheet.pdf)

## Modular architecture

| Layer | Initial proposal | Deferred decision |
| --- | --- | --- |
| Host authority | Windows Orbiter native engine owns focus state, accepted actions, rewards and growth | Phone-host ownership/handoff |
| Host projection | Native adapter emits a small allowlisted display state | Exact Rust serial library after dependency review |
| Link | Explicitly selected USB CDC device, Windows first | BLE GATT for a later iPhone/native integration |
| Device core | Framing, validation, freshness timeout, local display countdown interpolation | Firmware language/toolchain after display/transport spike |
| Display | Monochrome cat states, timer and link indicator | OLED model, dimensions, I2C vs SPI, controller/address |
| Input | Read-only mirror initially | Physical button or encoder and intentional action mapping |
| Optional modules | Capability slots, disabled by default | Sound, mic/voice, movement, lighting, question interface |
| Power/enclosure | USB bench prototype first | Battery/charging, power switch, ports and enclosure |

A 128 × 64 one-bit framebuffer needs 1,024 bytes before driver overhead. Keep the scene lightweight with a few sprite frames; do not attempt to run the Three.js renderer on the microcontroller. OLED dimming/static-content behavior must be selected with the actual panel and tested for prolonged desk use.

## Windows first; phone later

**Recommended first transport: native Windows USB CDC.** A cable offers power and a bounded connection during early testing, avoids phone background-policy work, and lets us test reconnect/error behavior beside the existing Tauri authority. A future serial worker belongs in the Rust/native layer with explicit device selection; arbitrary web pages must not gain a serial bridge. USB CDC firmware enumeration, Windows driver behavior and Rust transport are all unverified.

**Future iPhone transport: BLE GATT, after a separate spike.** Use a native Swift Core Bluetooth central and Pico peripheral. Existing WKWebView Files/notification messages are not a Bluetooth implementation. Apple's current Core Bluetooth framework supports Bluetooth communication; target-specific behavior must be verified across Orbiter's supported iOS versions. [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth)

Bluetooth access needs an understandable `NSBluetoothAlwaysUsageDescription` purpose string and a denied-permission path. Add permissions only when the feature is implemented. [Apple permission key](https://developer.apple.com/documentation/bundleresources/information-property-list/nsbluetoothalwaysusagedescription)

Ordinary foreground-only apps stop processing Bluetooth while suspended. The `bluetooth-central` background mode enables certain event handling, but does not grant endless execution or a guaranteed per-second stream; reconnection/state restoration need device testing. Current Core Bluetooth docs also describe additional iOS 26 Live Activity behavior, which must not be assumed for the iOS 16 deployment baseline. [Apple background guide](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html), [current framework](https://developer.apple.com/documentation/corebluetooth)

Apple distinguishes BLE/Core Bluetooth from its External Accessory/MFi path. Choose BLE deliberately; do not assume the Windows USB serial design or a generic Bluetooth serial profile works unchanged on iPhone. No USB-C accessory compatibility is claimed. [Apple accessory guidance](https://developer.apple.com/library/archive/qa/qa1657/_index.html)

## Existing Orbiter contract to preserve

Inspected local sources:

- [`desktop/ui/native-adapter.js`](../../desktop/ui/native-adapter.js): obtains `snapshot`, publishes `orbiter-native-state`, refreshes after `orbit-changed`, ignores older snapshot revisions, and sends accepted actions through the native `action` command. No physical-device transport exists here.
- [`desktop/src-tauri/src/engine.rs`](../../desktop/src-tauri/src/engine.rs): `Timer` stores `active`, `remaining_ms`, an internal `session_id` and captured course profile. `Store::remaining` uses elapsed monotonic time. `Store::snapshot` exposes `timer.active`, `remainingMs`, `duration`, `courseProfile`, `reason`, settings, rewards and `latestRecap`; its workspace representation uses `remaining` seconds and `endAt` milliseconds. Do not mix their units.
- `Store::snapshot` **does not expose the running timer's internal session ID** in `timer`. `latestRecap.sessionId` exists after completion and is deduplicated by native logic. A bridge must not invent a current native session ID or infer completion simply because a countdown reaches zero.
- Native `action` handles `start`, `pause`, `toggle`, `finish` and related operations transactionally. The device must not directly modify workspace JSON, mint stars, acknowledge recaps, open crates or equip items.
- [`Scheduler/SchedulerApp.swift`](../../Scheduler/SchedulerApp.swift) currently provides Files, local-reminder and haptic bridging. No Core Bluetooth bridge was found.

For the first mirror, send only presentation codes and a countdown. Keep task titles, notes, course names, account IDs, tokens, reward balances and full snapshots off the wire. If a cat appearance requires a stable profile mapping, introduce a per-link opaque token, not a course name or a changed cat identity. Map allowed appearance codes locally, with an honest fallback for unsupported cosmetics.

## Proposed v1 link contract — not implemented

USB framing proposal: UTF-8 newline-delimited JSON, at most 512 bytes per frame, version `1`, reject unknown message types/versions and invalid values, discard an oversize line until the next delimiter. All numeric durations are integer **milliseconds**. An explicit handshake chooses one controlling host at a time.

```json
{"v":1,"type":"hello","capabilities":["oled"],"boot":"random-per-boot"}
{"v":1,"type":"state","link":"ephemeral-host-link","seq":12,"mode":"focus","remainingMs":1499000,"ttlMs":5000,"cat":"default","calm":true}
{"v":1,"type":"ack","link":"ephemeral-host-link","seq":12}
```

These names/limits are proposed defaults, not existing APIs. `seq` increases within an ephemeral link; reconnect requires a fresh full state. Lower/duplicate sequence values must not restart animations. Cap accepted durations to Orbiter's implemented range rather than trusting a device frame. `ttlMs` is measured from receipt with the device's monotonic clock, avoiding clock-sync requirements. Suggested host updates: accepted state changes plus a one-second heartbeat; these rates need measurement.

The Pico may interpolate the displayed countdown while a fresh `focus` state is valid. At zero it shows “Waiting for Orbiter”; only a host-confirmed completion produces the victory cue. After a suggested five-second freshness timeout it shows “Reconnect” and stops presenting a live timer. It must never record an offline session or award progress. Reconnect uses the host snapshot, not the Pico's elapsed estimate.

Completion proposal: a distinct host-confirmed `complete` display state plus an ephemeral `event` token. The bridge maps native `latestRecap.sessionId` to a per-link token and remembers the last delivered event; repeated snapshots/acks do not replay it. On reconnect, baseline an already-seen recap rather than celebrating old work. Persisted device identities and durable event recovery are outside v1 and need a defined policy before implementation.

Physical input is deferred. If added, send an explicit desired `start` or `pause` with a unique request ID, not `toggle`; retries of a toggle can undo the intended action. The host validates intent, routes through its authority, deduplicates requests and returns accepted/rejected state before the cat changes. No arbitrary command, filesystem or shell execution is part of this protocol.

BLE can later carry the same validated payload semantics, but needs negotiated MTU/framing, fragmentation bounds, pairing/access policy and reconnect tests; one USB JSON line must not be assumed to fit a single BLE write. Require an explicit trusted-device pairing flow before accepting control. Broadcast advertisements contain no study content. USB physical access is also a trust boundary, not authentication by itself.

## Optional features remain decisions

| Possibility | Useful first experiment | Missing decision before implementation |
| --- | --- | --- |
| Sound | Short completion tone with mute/quiet hours | Buzzer vs amplified speaker, volume control, driver and power |
| Voice | Host-generated response displayed as text first | Mic, push-to-talk vs always listening, audio transport, model/provider, consent and retention |
| Questions | A button opens a question on the host, with explicit submission | Input method, offline canned help vs remote AI, response UI and cancellation |
| Movement | Software mood animation on OLED first | Servo/vibration/other mechanism, power rail, noise and mechanical limits |
| Lamp | On-screen brightness study first | Indicator vs useful desk lamp, LED/module, dimming, thermal/power budget |

A Pico can control peripherals, but this design does not claim local speech recognition or open-ended AI inference fits the board. Keep any future language/audio model on an explicitly chosen host/service. Never add a microphone, background recording, cloud upload, speaker or motor merely to fill a capability slot.

## Milestones and observable acceptance

1. **Design/research (this study):** source-backed constraints, readable OLED state study, explicit open modules; no production feature claimed. Verify local links and exercise all concept states/reduced motion at phone and desktop widths.
2. **Module identification:** photograph/identify the actual board and OLED/controller, confirm interface/voltage/power, then produce reviewed wiring and a minimal display driver. Pass only when the actual OLED renders static cat/text reliably; no purchases or pin assignment inferred here.
3. **USB read-only spike:** firmware/device handshake plus disposable host fixture. Test malformed/oversize/duplicate frames, unplug/replug, host exit, stale state and reboot. No device commands. Require no crash and a clear reconnect screen.
4. **Native integration:** derive allowlisted state from the real Rust authority. Test Start/Pause/Resume/completion, failure/retry, Windows sleep and app restart. Compare countdown against the authoritative app; verify no duplicate reward/completion and no workspace/account data on the wire.
5. **Optional inputs/modules:** choose one bounded module at a time, confirm power/privacy/interaction requirements and verify independently. Preserve manual mute/off and app authority.
6. **Phone BLE spike:** native permission/denial, pairing, foreground/suspended/terminated/relaunch, reconnection and single-host handoff on physical supported iPhones. Do not claim background delivery or desktop reward parity before measured evidence.

No stage's acceptance is established by this proposal. The standalone concept is a design artifact, not firmware or a validated hardware simulator.

## Verification recorded for this study

On 2026-10-22, the standalone concept passed six state changes at 1100 px and 390 px viewport widths, a single selected/accessibility state, no horizontal page overflow, a static reduced-motion frame, and zero JavaScript errors or remote requests. Local documentation links resolve. Desktop/mobile captures were visually inspected: readable hierarchy and no overlapping controls were observed. Captures are disposable evidence under ignored `build/physical-companion/` in this worktree. These are browser design checks; hardware behavior, firmware, USB and BLE remain unverified.
