# Collectible kitten / cosmic showcase

Selected direction: soft collectible avatar + interactive cosmic showcase. Original art, retaining Orbiter's warm cream/rose/blue character and midnight/mint/lilac materials.

## Delivered study artifacts

Open `cosmic-studies/index.html` after `npm run build:core` for a live scene selector, growth/coat controls and original/equipped comparison. The same folder contains neutral front, side and three-quarter turnarounds and three actual My Day scene captures. These are generated from disposable test data, not a user's workspace.

The modeling pipeline and editable source are in `avatar/`. Runtime loads a bundled GLB into the existing Three.js renderer. It creates no extra renderer for previews or course cards. Equipment previews temporarily move the live renderer, then restore its previous destination and latest accepted equipment.

## Visual mapping

- Appearance: coordinated coat tint, visible cheek/forehead markings, scarf and a jewel on advanced looks. Original coat patches remain recognizable.
- Accessory: persistent identity charm plus an earned dimensional accessory; legacy halos now have visible rings.
- Trail: orbital paths and motes; comet uses a shorter arc, waves and starlight use separate color treatments.
- Habitat: enlarged props, individual setting, distant planet/ring and local shader cloud. Larger CSS scenery fills the planner without adding a full-screen WebGL scene.

## Runtime boundaries

30 FPS cap; hidden rendering suspension; static WebGL-failure portraits; motion-zero and reduced-motion rendering stop; adaptive pixel ratio in Auto; 1x in Low, up to 2x in High. Sustained CPU-submit/GPU samples above 22ms reduce Auto resolution. GPU timing uses the optional disjoint timer extension and is unavailable on some drivers. It is not inferred from CPU submission time.

No new framework, physics engine, texture downloads, global input hooks or reward authority. Existing IDs, 30-minute crate threshold, XP and odds remain authoritative in Rust/cloud.

## Sources

Research used TinyFish to inspect [Maxime Heckel](https://maximeheckel.com/), his [shader study](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/), [Blender Studio's character workflow](https://studio.blender.org/training/stylized-character-workflow/), [Blender glTF documentation](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html) and [Blockbench](https://www.blockbench.net/). Blender was selected for sculpting, rigging and morph export. None of their artwork or code was copied.
