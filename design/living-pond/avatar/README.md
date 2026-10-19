# Refined pond kitten: editable review asset

Original Orbiter artwork. This asset is isolated from the production model until visual approval.

## Reproduce

From the Scheduler folder, using the existing local Blender developer tool:

```powershell
& 'build/tools/blender-4.3.2-windows-x64/blender.exe' --background --python design/living-pond/avatar/build_kitten.py
node design/living-pond/build.cjs
```

The builder reads `design/avatar/build_kitten.py`, applies guarded art refinements and writes **only** `orbiter-kitten.blend` and `kitten.glb` in this review folder. It fails when a production source anchor changes. The production builder, `.blend` and GLB are not modified.

## Art changes

- Slightly softer eye proportions, smaller restrained highlights and a matte eye response.
- Smaller nose, refined resting smile, lower and thinner brow contours.
- Compact rounded paws with shallow toe divisions, and a more curved tail tip.
- The same continuous head, recessed ear bowls, four selectable ear variants, six material roles and eight named bones.
- Existing eye Blink and mouth Happy morph targets, with the same independent runtime pose interface.

The review runtime adds surface patterns, scarf stitching and growth-aware accessory placement. These remain separate from the model's identifying coat/ear/scarf/charm traits. It also provides a bounded manual rotation control and cached portrait keys including the review model version.

The application does not require Blender or Python. Only the bundled GLB is used at runtime. No downloaded model or texture assets are used.

## Before integration

Review the three outfits at minimum buddy size, four growth stages and all four representative trait combinations. Confirm that the nose, eye contours and smile still read at compact size. Keep source and GLB changes together when the asset is eventually promoted. Do not replace the production asset independently of the matching runtime review.
