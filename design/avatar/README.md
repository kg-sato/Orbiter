# Orbiter collectible kitten

Original Orbiter artwork. No marketplace assets, remote textures, or external runtime dependencies.

## Editable source

Open `orbiter-kitten-stillwater.blend` for the current moonlit-storybook refinement. The user selected this direction on 2026-10-28. It has a gently pear-shaped head, shallow pink ear bowls, smaller inset eyes, a sculpted muzzle, a fuller seated body and matte ceramic materials. Four selectable ear variants and the eight-bone armature remain intact. Eyes retain `Blink`; the smile retains `Happy`. Runtime coat patterns, scarves, charms and rewards keep their stored identity codes. `orbiter-kitten-051.blend` and the earlier `orbiter-kitten.blend` remain as design history.

The reproducible modeling source is `build_kitten.py`. From the repository root:

```powershell
& 'C:\path\to\blender.exe' --background --python design/avatar/build_kitten.py
npm run build:core
npm run desktop:prepare
```

The script writes this editable Blender file and `src/mascot/assets/kitten.glb`. Blender is a developer art tool; it is not distributed with the application. The GLB is embedded in the application bundle and decoded locally, including offline/native mode.

### Stillwater source and review — 2026-10-28

The existing local Blender 5.3 beta successfully generated the editable source and GLB. Runtime revision is `orbiter-kitten-stillwater-1`, invalidating old portrait-cache entries. The SVG fallback follows the new face/body/inner-ear treatment while preserving four coat/ear/scarf/charm identities and existing equipment wrappers.

Controlled before/after portraits use code 0, two credited hours, unchanged equipment, angles and 240px output. Front/side/three-quarter, all coat and ear variants, baby and adult were captured under ignored `build/art-redirection/`; `comparison.png` shows the baseline and new neutral face. Source GLB: 19,824 definition triangles versus 20,000 before, 8 bones and 6 material roles; 718,636 bytes versus 728,704. These are asset measurements, not whole-app performance claims. Existing equipment/cosmic, avatar-cache, production generation and iPhone source checks pass. Final discovery/chest UI checks also target the new art and typography.

The discovery voice is scoped to reward headings: local Palatino/Book Antiqua/Georgia italic serif, offset lowercase eyebrow, and short pond/moon phrasing. Buttons, actual item identities, rarity and failure instructions remain clear. No remote font, model, texture or new dependency.

`halo-01` Petal Bow was also refined from two forehead beads into folded petals, a knot and ribbon tails at the right ear; SVG fallback now shows the same bow instead of a generic halo. Fixed code-0 portraits at all four growth stages were inspected, with clear eyes/face. Other cosmetic models were preserved. Final discovery and cosmic suites pass after this change; chest lifecycle checks passed against the new kitten. These are source/browser checks, not installed-app, device or whole-process performance evidence.

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

Rigid classification is cached by shared geometry with attribute/version invalidation. `node scripts/test_avatar_cache.cjs` checks the shipped skin data and repeated-clone work. On 2026-10-25, the existing local Roblox Blender export validator successfully imported the asset with eight bones; Pillow comparison found all 31 controlled before/after portraits pixel-identical after caching. See [local tool validation](../../docs/LOCAL-ART-TOOLS.md). Disposable cosmic regression captures now go to `build/cosmic-studies/`, preserving historical artwork.

## Research applied

- [Blender Studio stylized character workflow](https://studio.blender.org/training/stylized-character-workflow/): design exploration, sculpting, retopology and expression tests.
- [Blender glTF exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html): skin and morph export.
- [Maxime Heckel](https://maximeheckel.com/) and [shader study](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/): layered light, dynamic materials and restrained interaction. Orbiter uses original shaders/art, existing Three.js and no additional framework.
