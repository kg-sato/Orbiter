# Distinctive kitten and ethereal pond — review checkpoint

2026-10-17. All changes are isolated under `design/living-pond/`. Production application copies, native commands, account data, reward ownership and published assets are unchanged. Nothing is committed or staged by this work.

## Delivered for visual approval

- Refined original kitten with matched editable Blender source and GLB: softer eye proportions, restrained highlights, smaller nose and smile, subtle toe divisions, curved tail and matte coat shading. Eight bones and six material roles; existing Blink/Happy morphs and trait/growth interface remain intact.
- Three complete visual combinations: Tide Wanderer, Moon Garden and Stargazer. Together with the earlier comparisons there are **14 working item visuals**: four habitats, four accessories, three appearances and three trails.
- Authored tide, prism and star markings; stitched scarves; a directional compass; layered cape and wings; raised pool banks, crystals, flowers and crossing currents. Previous generic face decorations and redundant trail motes are suppressed for these replacements.
- Larger on-cat preview with rotation, four representative identities and four growth stages. Item-specific static thumbnails, equipped collection chips and explicit fictional availability labels. Preview/Keep/Cancel operate only in memory and never claim real ownership.
- New original pond shading: asymmetric moonlit opening, broader underwater caustics, continuous basin, muted koi, wet lily rims, sparse glints and two visual scales of mist from the existing 128 × 128 advected field. No panel-shaped light masks or tinted placeholder box.
- Incoming tab content follows the exact water perimeter without stretching. Navigation remains visible. Popup forms remain immediately editable. Keyboard focus settles a reveal so focused inputs cannot remain hidden.
- One reused WebGL renderer. Loading first shows a static identity illustration instead of flashing a primitive avatar. Low/graphics-failure backgrounds are rendered stills of the same three lighting palettes.

## Checks

`review.cjs` runs in a fresh headless Edge context with no real account or installed app profile.

- GLB signature, eight-bone rig, six materials and Blink morph verified.
- All **48 outfit × identity × growth combinations** render with one context. This is rendering coverage, not a claim of exhaustive artistic approval of every possible trait code.
- Three outfit sets stay within **12 additional calls**, **15,000 habitat triangles** and **128 Auto particles**. Static detail paths are merged and repeated props instanced.
- Immediate popup typing, preserved preview drafts, keyboard activation, rapid navigation, Escape, resizing, zero/reduced motion, Low and graphics failure checked.
- 390- and 360-pixel layouts checked without horizontal overflow. Compact options remain usable.
- Three lighting palettes and three material settings exercised. Shader errors are captured in addition to page errors.
- Pointer movement injects local wind; stopping the cursor adds no new gusts. Moving captures are provided for subjective mist quality review.
- Preview Keep/Cancel restores selected equipment; 51 catalog entries and 14 explicitly available demo visuals verified.
- Rapid swaps finish with one context and no stranded overlay or clipping state. Instance buffers and owned geometry/materials are disposed.

The full result is `review/checks.json`. New video/stills supersede the earlier six-item recordings.

## Updated browser measurements

1440 × 1050 CSS pixels, Auto, identity 0, Baby, two-second warmup then roughly 3.3 seconds sampled per outfit. “Previous” means previous item geometry in the **same refined avatar and pond renderer**, not the old installed release. Runs are sequential and are not a controlled native benchmark.

| Outfit | Previous / new FPS | Previous / new median CPU draw submission | Previous / new cat-pass calls |
| --- | ---: | ---: | ---: |
| Tide Wanderer | 27.55 / 27.43 | 0.80 / 0.70 ms | 55 / 47 |
| Moon Garden | 27.66 / 27.39 | 0.70 / 0.70 ms | 76 / 46 |
| Stargazer | 27.73 / 27.72 | 0.60 / 0.80 ms | 56 / 46 |

- Habitat triangles: **5,184 / 14,448 / 2,784**. Celestial Garden is close to the 15,000 limit; do not add more petals without profiling.
- Additional equipped-set calls, including trails: **12 / 11 / 11**. Tide Wanderer reaches the initial limit.
- Largest cat-pass geometry is **36,664 triangles** in Moon Garden; 14,448 are habitat geometry, leaving **22,216** for kitten, equipment and trail, below the 25,000 visible-cat starting budget.
- Shared pond backing resolution during performance samples: **864 × 630**. Auto reduced resolution during the heavier trait/stage stress run; that is reported separately in the raw check output rather than mixed into the timing comparison.
- Observed FPS stays below the 30 FPS cap for previous and new item visuals. No claim of a sustained 30 FPS on every machine.
- Browser main-thread TaskDuration: **4.29–4.94% previous / 4.23–4.49% new**. This is not whole-process CPU usage.
- Sampled JS heaps: **9.68–10.71 MiB previous / 11.57–22.20 MiB new**, with garbage-collection variability. No claim of equal or lower process memory; GPU/driver allocations are excluded.
- GPU query medians: **0.043–0.350 ms previous / 0.046–0.049 ms new**. Query samples can cover cat-only versus combined pond frames, so these do not establish a GPU performance improvement.
- Browser page/model-ready time in the performance run: **1.91 seconds**. The later static-loading fallback changes first presentation only; native release startup remains unmeasured.
- Review GLB **728,704 bytes**, versus production GLB **695,128 bytes**: **+33,576 bytes (+4.83%)**. No installer-size conclusion follows from this.
- Generated review bundle approximately **2.53 MiB**, plus three matching still backgrounds totalling about **151 KiB**. The bundle is ignored and is not a release package.
- Motion-paused sample: **zero additional frames** across one second. The finite 2D transition allocates no WebGL context; see raw checks for its current canvas-buffer and draw measurements.

The full timing record is `review/performance.json`. Earlier `VERIFICATION.md` figures describe an older prototype and must not be substituted for these results.

## Still gated or unmeasured

Visual approval is required before integration. The remaining **37 item replacements**, production registry/catalog promotion, label-only cloud migration, real Equip/account conflict handling, regenerated application copies and native checks are pending that approval.

No new installer is built. Native startup, whole-process CPU/RAM, GPU memory, Windows scaling/monitor/tray behavior, installed upgrade, live sync and restart/export/import validation remain outstanding. No timer, reward, economy or database changes are present in this review.
