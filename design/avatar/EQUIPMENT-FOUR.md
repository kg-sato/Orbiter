# Four companion equipment refinements

2026-10-27. Original procedural artwork for the existing Tiny Satchel (`halo-05`), Lantern Pendant (`halo-09`), Paper Lantern (`habitat-04`) and Floating Shrine (`habitat-09`). Source integration only; no installer or installed-app claim.

The satchel has a rounded rectangular flap, buckle, stitching, leaf and diagonal shoulder strap. The pendant has a paper core, metal cage, hanging loop and small finial. Each uses explicit four-stage body/scarf anchors. The paper lantern has an oval ribbed shade and tassel on a side hook. The shrine is an open roof and posts on a floating stone deck, with a suspended light and water rings. Both habitats leave the central resting area open. SVG fallbacks retain those silhouettes and details. The GLB, identity traits, catalog, economy and native Equip authority are unchanged.

`equipment.js` merges these four static props by material. Older articulated studies retain their existing batching path. The portrait cache includes the new equipment artwork revision.

Curated matched comparisons: [before](equipment-four-20261027/before.png), [after](equipment-four-20261027/after.png), and [mounted fallback](equipment-four-20261027/fallback.png). Rows show the four requested items; columns show Baby through Adult.

## Reproduce and review

Run from the repository root using the existing dependencies:

```powershell
npm.cmd run build:core
npm.cmd run desktop:prepare
$env:ORBITER_ART_BASE_REF='ef77d18011e1035b157aa1a71dc16ec143e65bdf'
node scripts/test_equipment_four.cjs --baseline
node scripts/test_equipment_four.cjs
node scripts/test_cosmic.cjs
```

The optional baseline ref is passed directly to `git show` as an argument. It defaults to the pinned integration base above, so a later commit does not silently change the baseline. Captures and measurements are under ignored `build/equipment-four/before-fixed/` and `after/`. `growth-live.png` and `growth-fallback.png` compare each requested item across four growth stages. `identities*.png` cover codes 0, 85, 170 and 255 with both outfit pairs. Native comparisons use fictional course profile 256 (the same traits as code 0), identical growth, viewport and paused settings. They do not override `Math.random`, which would collide Three.js material UUIDs. Earlier diagnostic captures remain in `before/`; use `before-fixed/` for comparison.

The focused regression checks distinctive live/fallback outputs, protected face pixels, four combined-set budgets, repeated-swap geometry disposal, preview/Cancel/locked/authoritative Equip, one context, zero/reduced motion and suspended rendering. It loads the actual generated native HTML at 420×220 and 360×200, checks control bounds/hits, samples Low/High, and captures actual mounted no-WebGL fallback images. Those sizes, growth sheets, representative identities and fallback captures were visually inspected. This is sampled growth/identity coverage, not all possible trait codes or physical display scaling.

## Measured geometry

These are actual added prop meshes, including each habitat's shared shore shelf. The existing 12 added calls per equipped set, 15,000 added habitat triangles and 128 Auto particles are recorded in `design/living-pond/RESEARCH.md` and `REFINEMENT-VERIFICATION.md`.

| Item | Added triangles | Added calls | Particles |
| --- | ---: | ---: | ---: |
| Tiny Satchel | 1,188 | 4 | 0 |
| Lantern Pendant | 1,008 | 3 | 0 |
| Paper Lantern | 4,648 | 4 | 0 |
| Floating Shrine | 3,088 | 5 | 0 |

The four accessory/habitat pairs use 7–9 added calls. At identity 0 / Baby / no trail, full cat-pass geometry is 24,024–25,764 triangles and 42–44 calls. At Adult, the two native comparison pairs are 35,840 / 37,580 triangles and 70 calls, versus baseline 33,544 / 33,264 triangles and 66 calls. These totals include the pre-existing growth scenery. The historic 25,000 visible-cat starting target is therefore not established for every growth stage by this pass; the added habitat and equipped-set targets are met. There is no native CPU/RAM, physical GPU or sustained-FPS claim. Twenty alternating outfit swaps finish at the same 101 renderer-owned geometries as their starting outfit.

The existing `test_cosmic.cjs` passes. It now writes captures to ignored `build/cosmic-studies/` by default, accepts `ORBITER_ART_OUT`, and explicitly enters Study / My Day before testing its controls. Its model-failure injection matches the kitten's exact bundled bytes; corrupting the first GLB now targets the chest instead. The actual mounted failure fallback for all four new IDs is captured as `model-failure-*.png`. Historical design captures are preserved. The broader existing `test_island.cjs` was attempted but stops on its hidden `#weekly-review-open` control because it still assumes the old entry page; the focused four-item suite separately exercises current native and planner equipment flows.

Main-checkout integration also passed `test_equipment_four.cjs`, `test_cosmic.cjs`, `test_chest_model.cjs` and `test_chest_opening.cjs`. The chest capture fixture now steps its default presentation clock explicitly through early/middle/late frames, then resumes before subsequent interactions. Screenshot latency previously consumed the late capture window. These are deterministic phase/geometry checks, not wall-clock animation or performance measurements; production timing is unchanged.

Physical installed-app checks, Windows display scaling, exhaustive trait combinations and context-loss recovery are unverified. No model rebuild, dependency installation, new reward features, native launch, staging, commit, push or packaging was performed in this artwork worktree.
