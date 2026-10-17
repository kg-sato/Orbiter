# Stillwater prototype verification · October 17, 2026

## Result

Isolated browser checks passed. This is a **visual-review prototype**, not release approval. The current application version remains 0.6.5; no production bundle, installer, database or shared-workspace content was changed.

## Measured resource sample

1440 × 1000 CSS viewport; initial Auto render size 1224 × 850; RGBA16F mist field; one WebGL context plus one small 2D cat presentation canvas. Samples use a disposable headless Edge browser. CPU is summed browser-process CPU normalized to 28 logical processors. Memory includes the browser, renderer, GPU and utility processes, **not** the installed Tauri application.

| Metric | Active | Paused |
|---|---:|---:|
| Sample length | 10.11 s | 10.11 s |
| Average machine CPU | 0.58% | 0.04% |
| Combined private memory | 494.2 MB | 492.9 MB |
| Combined working set | 555.2 MB | 555.5 MB |
| CPU frame work, median / p95 | 0.80 / 1.50 ms | No continuing render loop |
| Sampled render GPU, median / p95 | 0.22 / 215.53 ms | Last active samples only |

The first rendered frames were available approximately 0.95 seconds after navigation in the isolated browser. This is not native application startup. JavaScript frame work includes simulation submission, drawing and small cat-canvas copying; GPU timer samples cover the render block, **not** the preceding fluid simulation passes. They are sampled timings, not total GPU utilization.

### Limits that remain open

- Combined browser private memory exceeds the original **200 MB** target. Browser overhead prevents direct comparison to the installed application's memory budget; no native pass is claimed.
- The GPU p95 exceeds a 33.3 ms frame budget. Median timing is not evidence that every frame is smooth. Rendering/copy outliers need further profiling before production integration.
- Ten-second resource samples are short observations, not long-run stability or battery measurements.
- Actual native startup, tray behavior, DPI/monitor changes, physical sleep/lock, and production account synchronization were not part of this isolated visual checkpoint.
- The hidden-page suspension path is implemented but was not externally verified with a real minimized native window in this run.

## Checks performed

- All three pond lighting palettes rendered; screenshots and matching static backgrounds generated.
- Actual water/fish/mist motion recorded as WebM. Four moments decoded into a contact sheet and visually reviewed.
- Cursor sweeps and clicks exercised over exposed water during the recording; controls remain ordinary HTML, outside decorative event handling.
- Pause, Low quality and reduced motion stop recurring frame submission after their one-time redraw.
- 390 × 844 phone layout does not overflow horizontally; compact mode reuses the same WebGL context.
- Identity, growth and sample equipped-habitat changes render without creating another WebGL context.
- Forced WebGL context loss shows a fallback, and restoration resumes the scene without a browser/shader error.
- Graphics-disabled startup keeps timer controls usable and supplies a cat fallback in compact mode.
- Preview browser storage remains empty; no workspace storage is written.
- No browser/shader errors were observed by the isolated review harness.

## Files to review

- `review/pond-motion.webm`: actual generated moving scene, not a storyboard.
- `review/motion-contact-sheet.png`: decoded recording frames.
- `review/*-planner.png`, `phone.png`, `buddy-phone.png`, `buddy-garden.png`: application-sized compositions.
- `review/static-fallback.png`, `context-loss.png`, `reduced-motion.png`: compatibility treatments.
- `review/measurements.json`: raw measurements for this run.

Prototype acceptance means the review artifacts and isolated checks are complete. **Visual approval is still yours**; integration and installer packaging wait for that checkpoint.

## Lily-pond revision review

Refined the bed texture to fine 2K mineral detail, added original 1K koi skins and leaf veins, introduced above-water lily pads and a layered pale water lily, softened the reflected light, enlarged the mist source regions and filtered their density. The reading-zone attenuation edge was softened and removed from the introduction. The same isolated acceptance harness was rerun successfully, including reduced motion, graphics loss/restoration and static compact fallback. The fallback check now waits for its scheduled layout update rather than sampling visibility before the next animation frame.

## Blue atmosphere revision

Returned the preview's panels, water, mineral bed and lily pads to midnight blue, cool mint and lilac lighting. Replaced the two concentrated steam sources with distributed full-field emission and a thin continuous veil. Cursor velocity drives local transport, detail deformation and density dispersal; density gently replenishes after input stops. Lower opacity retains the underlying water detail across the full viewport, with additional attenuation behind reading controls. Static/reduced-motion treatments use the same palette. The isolated suite and actual motion recording were refreshed successfully; resource limits remain open.
