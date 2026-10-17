# Transition verification

## Passed

- Isolated moving prototype recorded before production integration: ordinary button, popup opening, immediate typing, closing silhouette, main-page navigation and secondary tabs. One existing WebGL context; no page errors.
- New `test_lake.cjs`: real application navigation; stationary dialogs/content; keyboard activation; immediate field input; immediate closing; assignment tabs; rapid repeated navigation; Escape followed immediately by another action; interruption on resizing, simulated hidden-page notification and native mode changes; no stranded overlays.
- Appearance matrix: Mint/Lilac/Apricot × Tidal Night/Lunar Mist/Opal Dawn × Sculpted/Glass/Quiet material, with readable stationary dialog controls. Widths 1440, 390 and 360; no horizontal page overflow in the checked dialogs.
- OS reduced motion, saved calmer motion and zero motion intensity skip effects. Low retains lightweight edge feedback. High remains usable. Forced WebGL initialization failure retains an editable form, static pond and working transition cleanup.
- Existing `test_unified.cjs`: browser cat identity, data compatibility, native reciprocal switching, preserved editor drafts, timer mode behavior and buddy sizes.
- Existing `test_refinement.cjs`: intentions, appearance previews/Apply/Cancel, stale-save handling, accents/scenes, phone layouts, session recap formatting, growth habitats and static fallback.
- Existing `test_island.cjs`: reward/equipment behavior, growth, compact dimensions, buddy options transition, native-mode Updates dialog opening and 22px checkbox interaction. The retired opaque full-screen wipe assertions were replaced with checks for a stationary modal, one shared full-viewport decorative layer and immediate Escape cleanup.
- Application copies and bundled desktop assets regenerated. No Rust, storage schema, account membership, timer-credit or reward-authority changes. Published 0.5.0 release files were not rebuilt or replaced.

## Rendering and resource observations

The isolated prototype averaged about **0.19 ms** per drawn transition frame, with a sampled maximum **0.40 ms**. Integrated acceptance runs averaged about **0.20 ms**, with maxima of **0.70–0.80 ms**. This measures JavaScript/Canvas2D drawing only, not total GPU frame time.

The controller caps redraws at 30 FPS and reuses a single Canvas2D overlay plus one pond-reflection buffer. Reported canvas storage in the desktop run: **7,370,752 bytes (7.03 MiB)**. This excludes browser/driver allocations. Idle completed transitions leave no overlay nodes and schedule no further animation frames. The cat/pond renderer still reports exactly one WebGL context.

The final indicative browser run reported around **25.2%** main-thread TaskDuration during its initial idle sample and **15.1%** during the navigation sample, with about **10.3 MB** JS heap. These short samples include the live pond, initial loading and garbage collection, and are not controlled CPU comparisons; the lower second number does not establish an improvement. Raw runs are recorded under ignored `build/lake-checks/report.json` and the curated `review/measurements.json`.

## Limits

- No new native installer was built or installed, and no GitHub/Cloudflare release was published. The installed 0.5.0 will not acquire these local changes yet.
- Native mode, timer/draft and buddy UI behavior was exercised through isolated native-bridge fixtures. Physical Windows scaling, multiple monitors, actual tray/suspend operation and full-process CPU/memory/GPU measurements remain manual checks for the subsequent packaged version.
- The previous release's visible-memory and cold-start targets remain unresolved; these Canvas2D timings do not certify them.
- Static fallback image loading never blocks the form; the edge layer adopts the matching pond image when decoding completes.

## Evidence

Curated recordings and screenshots are in `review/`. Generated intermediate browser videos, JSON diagnostics and additional screenshots remain under ignored `build/`. The standalone study can be rebuilt using the instructions in [README](README.md).
