# Orbiter collectible kitten

Original Orbiter artwork. No marketplace assets, remote textures, or external runtime dependencies.

## Editable source

Open `orbiter-kitten.blend` in Blender 4.3 or later. The scene contains a continuous rounded head, recessed ear bowls with thick rounded rims, a seated body, four selectable ear variants, and an eight-bone armature. Eyes have a `Blink` shape key. Runtime coat patterns, scarves, charms and rewards attach to the exported rig without changing stored identity codes.

The reproducible modeling source is `build_kitten.py`. From the repository root:

```powershell
& 'C:\path\to\blender.exe' --background --python design/avatar/build_kitten.py
npm run build:core
npm run desktop:prepare
```

The script writes this editable Blender file and `src/mascot/assets/kitten.glb`. Blender is a developer art tool; it is not distributed with the application. The GLB is embedded in the application bundle and decoded locally, including offline/native mode.

## Editing and export

- Keep named bones `Root`, `Head`, `Body`, `EarL`, `EarR`, `PawL`, `PawR`, `Tail` and named eye meshes with their `Blink` targets. Preserve rest transforms.
- Ear variants use `EarL0`–`EarL3`, matching right ears and inner-ear meshes. Keep the exported variants; runtime selects one pair.
- Preserve the material roles `Coat`, `Ivory`, `Rose`, `Eyes`, `Glint`, `Pattern`. No textures are needed in this version; future atlases should stay within 1K.
- Export glTF Binary with skins, morph targets and Y-up. Do not export cameras/lights or bake an always-running animation; runtime blends independent interaction channels.
- Check front, side and three-quarter views at 120–240px. Keep eyes/muzzle unobstructed by accessories. Prioritize silhouette over extra surface details.
- Before replacing the asset, run `node scripts/test_cosmic.cjs`. It checks the GLB signature, bone/material budgets, morph targets, live loading, previews, reduced motion and responsive widths.

The current rig uses rigidly weighted articulated pieces and a smooth continuous head. A future hand-retopology pass can improve continuous shoulder/neck deformation without changing the interface. This is not a production facial-animation rig.

The 0.6.1 reference refinement removes cheek lobes and painted-on ear capsules, enlarges the eyes and gives the kitten a seated silhouette. Coat patches use a small procedural material over the head surface rather than extra face meshes. `scripts/render_avatar.cjs` renders front/side/three-quarter views and all four coat/ear variants to `design/avatar/review/` for visual art review. Run it after `npm run build:core`; it does not run an automated test suite or access a real account.

At runtime, pieces proven to have exactly one bone influence are attached directly to that bone, retaining morph targets. This avoids unnecessary GPU skinning shaders while preserving the exported rig and identical articulated movement. Any future mesh with blended weights remains skinned normally.

## Research applied

- [Blender Studio stylized character workflow](https://studio.blender.org/training/stylized-character-workflow/): design exploration, sculpting, retopology and expression tests.
- [Blender glTF exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html): skin and morph export.
- [Maxime Heckel](https://maximeheckel.com/) and [shader study](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/): layered light, dynamic materials and restrained interaction. Orbiter uses original shaders/art, existing Three.js and no additional framework.
