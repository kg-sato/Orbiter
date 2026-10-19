# Living pond review verification

Date: 2026-10-17. This report covers the isolated review checkpoint, not a released or installed update.

## Follow-up: synchronized tab reveal

The subsequent tab-reveal refinement uses the water's exact perimeter to clip incoming page/tab children. Navigation marked `data-pond-stationary` stays visible; popup forms retain immediate input. Completion, cancellation and keyboard focus restore original clip styles. The preview bundle was rebuilt. The measurements and recordings below predate this refinement and do not validate its additional clipping cost or show the updated reveal.

Further review adjustments remove the tinted placeholder surface and enlarge habitats independently of the kitten: 35% taller, 8% wider and 20% deeper. Pebble Pool gains raised rear banks; Infinity Tide's currents rise at the sides, with matching mote paths. The desktop presentation area grows from 340 to 390 pixels tall. Historical captures and performance figures below predate these geometry changes; the updated preview is rebuilt, without additional runtime checks in this follow-up.

## Completed

- Bundled successfully using existing local dependencies. No package install or production regeneration.
- Automated checks passed in a fresh headless Edge context, with no page errors or external account/API requests.
- Three habitat replacements and three accessory replacements render with the existing original kitten. Before/new comparisons use the same identity, stage and equipment IDs.
- All 51 presentation entries have names and descriptions; IDs, slots and rarities are imported unchanged from the production catalog. Only six replacement visual implementations are marked ready.
- Popup text accepts input during formation. The surface is a filled animated lens behind the content; the existing border is suppressed until the lens settles. Closing removes all form contents immediately.
- Buttons, page changes, secondary tabs and compact options share the controller. Keyboard activation, rapid changes, Escape, resizing and zero/reduced motion settle temporary surfaces. No overlay or temporary forming class remained at completion.
- Checked all three lighting palettes and all three preview material settings. Phone widths 390 and 360 CSS pixels have no horizontal overflow. Compact options and draft input remain usable.
- Paused graphics render zero additional frames during the measured one-second sample. Low uses still pond rendering and short decorative transitions. Explicit graphics-failure mode uses distinct habitat/accessory SVG decorations with zero WebGL contexts.
- Sixteen rapid habitat swaps ended with one WebGL context, no temporary overlays and bounded live geometry. Instance buffers are explicitly disposed in the isolated adapter.
- Inspected screenshots for full companion silhouette, cape contrast, crystal shape, compact readability and popup formation. Recorded moving UI and scenery for human visual approval.

## Measurements

Same page, 1440 × 1050 CSS pixels, Auto, Baby identity 0, Moonkeeper Wings, two-second warmup and approximately 3.3-second sample per world. Runs are sequential, original first, so these are indicative browser measurements rather than a controlled native benchmark.

| World | Original FPS | New FPS | Original median draw submission | New median draw submission | Original / new cat-pass calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pebble Pool | 27.52 | 27.44 | 1.00 ms | 1.30 ms | 40 / 41 |
| Crystal Grotto | 27.49 | 27.44 | 1.10 ms | 1.20 ms | 40 / 42 |
| Infinity Tide | 27.48 | 27.24 | 1.00 ms | 1.10 ms | 40 / 41 |

- **One WebGL renderer**, no additional context for transitions. The existing pond presentation cadence remains 20 FPS; the mascot loop and transition effects remain capped at 30 FPS. Observed mascot FPS was below 30 in this environment for both versions.
- New habitat geometry: **4,608 / 2,784 / 3,968 triangles**, respectively. All below the initial 15,000-triangle habitat budget.
- Habitat plus wing components use **10 / 11 / 10 draw calls**, below the 12-call equipped-set budget. Largest total cat-pass geometry is 25,336 triangles; 4,608 belong to the habitat, leaving 20,728 for kitten and equipment.
- Infinity Tide uses **24 motes**, below the 128-particle Auto ceiling.
- Last complete transition run: **0.434 ms mean**, **1.30 ms max** draw submission; **9,270,272 bytes (8.84 MiB)** of canvas backing buffers. This excludes decoded images and driver allocations. It is about 1.81 MiB above the preceding outline-only controller's documented 7.03 MiB; no claim of lower transition cost.
- Original/new browser main-thread TaskDuration samples: approximately **7.2–7.5% / 7.4–7.5%**. This is not whole-process CPU usage.
- Sampled JS heaps ranged **11.5–15.2 MiB original / 9.1–19.7 MiB new**, affected by garbage-collection timing. No claim of reduced memory usage or whole-process memory equivalence.
- Warm GPU query medians varied from **0.045–1.103 ms** in new scenes; original samples varied **0.169–1.276 ms**. Timer coverage and sample reuse make these unsuitable for an improvement claim. Shader compilation spikes are excluded by warmup.
- Browser page/model-ready time: **1.81 seconds**. This is not native release startup. Generated review bundle: approximately **2.46 MiB**, containing the existing Three.js and GLB; it is not an installer-size measurement.

The final cape adjustment changes a material colour only; geometry and rendering paths used for these performance samples are unchanged.

## Evidence and reproduction

- `review.cjs`: complete interaction/fallback matrix, screenshots and detailed motion capture in `build/living-pond-review/`.
- `measure.cjs`: original/new timing and memory samples in that folder's `performance.json`.
- `capture.cjs`: short visual walkthrough with deliberate pauses; `showcase.webm` and final companion stills.
- Curated copies are kept in `review/` alongside this document, including `checks.json` and `performance.json`.

## Outstanding review and integration

The plan explicitly requires visual approval **before application integration**. The remaining 45 item visual replacements, production presentation registry/catalog updates, label-only cloud migration, full production preview/Equip integration and regenerated application copies are pending that review. Nothing has been deployed or packaged.

Native timer/draft regression, restart/export/import/account conflict checks, all course identity combinations and growth stages, real Windows scaling and tray behavior must be verified during integration. This prototype does not connect to those authorities, so it cannot validate them. No installed native startup, process CPU/RAM, GPU memory or installer-size claim is made.

No commits, staged files, database changes, reward changes or published asset modifications were made by this work.
