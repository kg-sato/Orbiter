---
name: orbiter-companion-art
description: Refine Orbiter's modeled kitten, equipped cosmetics and local pond habitats while preserving course identities, growth and inventory. Use for avatar or reward artwork changes, not reward-economy or generic UI work.
---

# Orbiter companion artwork

Locate the active Scheduler checkout and approved visual direction. Establish the requested item subset from `COSMETICS` in `desktop/src-tauri/src/engine.rs` and actual rendered artwork. Stored identity, earned ownership, collection icons, live equipment and static fallback artwork are separate concerns; a catalog entry or distinct image hash does not prove a readable cosmetic exists. Do not expand a bounded request into replacing the whole catalog.

## Choose the editable source

- **Kitten shape, rig or exported materials:** inspect `design/avatar/README.md`, its Blender builder/output paths, `src/mascot/avatar.js`, `src/mascot/cat.js` and bundled `src/mascot/assets/kitten.glb`. Update reproducible Blender source and the exported model together. The installed application must not need Blender or Python.
- **Procedural accessories or habitats:** inspect routing in `cat.js` and builders in `src/mascot/equipment.js`; trails and appearance treatments live in `equipment-trails.js` and `appearances.js`. Reuse batching, disposal and measurement conventions. An equipment-only change need not rebuild the kitten GLB.
- **Static fallback:** trace the import used by `cat.js`. `src/mascot/fallback-art.js` wraps the identity artwork in `fallback.js`; update the active wrapper and its specialized-item lists so the requested IDs retain their meaning without WebGL. Check the portrait cache key and artwork/model revision when changing visuals.
- **Collection and Equip:** inspect `src/mascot/rewards.js` for icons, previews and action dispatch; native catalog/settings validation remains in `engine.rs`.

## Preserve identity and growth

Keep coat, ear, scarf and charm combinations, all four growth stages and existing animation node/morph interfaces. Judge the soft silhouette, continuous cheeks, muzzle/eyes, paws and dimensional scarf at actual buddy size with motion paused. Coordinate materials with identifying markings rather than replacing identity.

For procedural coat paint, inspect coordinate anchors and shader composition. Geometry origins need not be the visible head centre; use authored anchors. Check full forehead and face coverage plus separate eyes, nose and smile.

Fit accessories to explicit growth-aware anchors: `cat.js` already derives neck height and the `bow` position from maturity. Fixed root-height straps or pendants can fit an adult but cross the face or paws of a younger kitten. Inspect every affected stage, front and three-quarter views, and representative coat/ear/scarf/charm combinations. For model edits, preserve named bones, rest transforms, morph targets and material roles documented in the avatar README.

## Make earned equipment recognizable

Preserve IDs, slots, rarity, ownership and authoritative Equip commands. Give each requested replacement a readable silhouette plus a secondary feature such as a flap/clasp, ribbing, attachment, material or local environmental response. Avoid substituting brightness for identity. Keep faces and study controls clear.

Habitats are open scenery around a resting area with contact shadows and side/rear height. They should not enclose the kitten or recolour the whole interface. Prefer restrained emissive materials over extra lights when they provide the intended detail.

Preview stays temporary: Cancel/Escape restores saved equipment; Equip uses existing authority; locked items stay locked. Check the actual collection and preview flow, including a rejected Equip, rather than only rendering a detached model. Use Title Case display labels, including old receipts rendered from current IDs; never mutate ownership to fix labels.

## Render, measure and verify

Capture the baseline before editing and pin its Git revision. Use identical trait code, growth value, item IDs, angle, viewport, quality, preset and paused frame for before/after comparisons; retain the fixture and commands. Select a fixed native companion through fictional course/profile snapshots; overriding global randomness can collide Three.js material IDs and invalidate the render. Review at real 120–240px artwork scale, plus relevant generated compact buddy/planner states. Then inspect representative movement, zero/reduced motion and current Auto/Low/High paths. Exercise the application's unavailable-renderer/model and context-loss paths as applicable; confirm the displayed fallback, not only the SVG helper's output. Target the intended model's exact bundled bytes in failure fixtures; the first GLB may be the chest.

Retain one active renderer, cached course portraits, hidden-render suspension and existing preview/chest renderer ownership. Include artwork/model revision, traits, maturity and equipment in cache identity. Exercise repeated previews and cancellation to catch stale artwork or resource growth.

Measure the changed items' triangles, draw calls and particles, and a representative equipped combination, against the same baseline. Distinguish exported GLB bone/material counts from additional runtime equipment. Historical targets (25,000 cat triangles, 24 bones, six cat materials, 1K atlases; 15,000 habitat triangles, 12 equipped-set calls, 128 Auto particles and a 30 FPS cap) are leads until confirmed by current project requirements. Browser frame metrics do not establish native process CPU/RAM or device performance.

Inspect existing checks such as `scripts/test_cosmic.cjs` and `scripts/render_avatar.cjs` before running them. Confirm output destinations and use a fresh ignored `build/` directory for disposable captures; preserve historical images in `design/`. Curated comparison studies belong in a new named `design/` location. Open the app's relevant Study/collection surface explicitly when its landing page differs from older tests.

Regenerate production application copies with the current repository generators after final source edits. Follow any active visual-approval requirement; do not infer a new approval gate from an obsolete prototype note. Report the exact IDs completed, observed visual improvements, measured resource changes, checks performed and unverified combinations/devices. Source integration, packaged delivery and installed behavior remain separate. This skill does not authorize economy changes, installation, upload or publication.
