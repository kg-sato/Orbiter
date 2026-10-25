# Original Orbiter chest

Original code-authored 3D artwork, 2026-10-23. Rounded tidal-blue case, pearl/lilac alloy bands, sea-glass rim, four rounded feet, vaulted hinged lid, dark cavity and emissive four-point lunar seal. No downloaded meshes, textures or runtime modeling tools. Kitten assets and persistent companion identity are untouched.

## Editable source and asset

- `build_chest.cjs` is the editable authoring source and reproducibly exports `src/mascot/assets/chest.glb` with the project's existing THREE/GLTFExporter dependency.
- Blender's expected installation folder existed but `blender.exe` was absent, including an elevated path check. No Blender installation or fabricated `.blend` is supplied. The original GLB can be imported into a later Blender session; the geometry source remains editable now.
- Regenerate from the checkout root in this Windows environment:

```powershell
$env:NODE_PATH='C:\Users\kgsat\Documents\Scheduler\node_modules'
node design\chest\build_chest.cjs
node scripts\test_chest_model.cjs
node design\chest\preview_chest.cjs
```

`NODE_PATH` reuses installed project libraries; it does not install a dependency. Preview launches disposable headless Edge and writes captures under ignored `build/chest/`. The standalone preview creates one preview renderer; production `chest.js` creates none.

## Runtime integration contract

`src/mascot/chest.js` exports:

```js
CHEST_VERSION; // 'orbiter-chest-1'
OPEN_DURATION; // 1800 milliseconds; presentation duration, never reward authority
ready; // Promise<boolean>; embedded GLB decode, no network
assetStatus(); // { loaded, error, version }
createChest(); // null before ready/failure, otherwise the instance below
```

An instance exposes `{scene,camera,root,hinge,anchors,animate,setAspect,stats,dispose}`:

- `scene`: lit transparent THREE scene. Render with the existing shared renderer.
- `camera`: orthographic three-quarter camera; `setAspect(width/height)` fits portrait or landscape targets. `animate()` gently reframes as the lid opens so it is not cropped.
- `animate(progress,{reducedMotion:false})`: deterministic progress in `[0,1]`. Approximately 0–0.35 anticipates with a small bounce/shake, 0.35–0.8 opens the rigid hinge, and 0.73–0.97 lifts a luminous star from the cavity. It creates no RAF, interval, clock, storage mutation or native reward command.
- Reduced motion shows a static closed state until progress reaches 1, then the final open state; no bounce, shake or pulse. The caller should move promptly to that final state after the authoritative reward succeeds.
- `anchors:{seal,opening,reward}`: authored Object3Ds; `opening` is the cavity mouth and `reward` rises during the reveal. `reward` contains a symbolic star, not the actual prize identity. A receipt/equipment preview remains owned by the existing reward presentation.
- `stats()`: geometry budget, progress, version and disposed flag.
- `dispose()`: idempotently disposes instance-owned cloned materials and generated glow geometry. Shared immutable GLB geometry stays cached; disposing one instance does not invalidate another.

Minimal caller flow:

```js
if (await ready) {
  const chest = createChest();
  chest.setAspect(width / height);
  chest.animate(progress, { reducedMotion });
  sharedRenderer.render(chest.scene, chest.camera);
  // Restore the companion renderer's target, viewport, camera and host afterward.
  chest.dispose();
}
```

Use `animate(0)` for a closed portrait; use intermediate/final progress for still inspection. Preload and generate any portrait with the same renderer as the companion. Keep an existing static fallback when loading or renderer availability fails. The chest cannot determine whether a reward was earned: the caller owns single-mutation authority, failed actions, cancellation, motion preferences and final receipt timing.

## Authored nodes and axes

GLB uses glTF/THREE Y-up, front +Z. Approximate closed dimensions are width 2.04, depth 1.42 and height 1.55 world units. Named `ChestRoot` contains the hollow case, `LidHinge`, `OpeningAnchor` and `RewardAnchor`. Hinge translation is `(0,1.075,-0.60)`; its local X rotation moves from 0 to `-1.93` radians. `Lid`, `LidInner`, the vaulted bands, clasp and `Seal` are rigid hinge children. `MoonStar` is attached to the seal; `RewardLight` is the symbolic rising star.

The cavity is real empty space bounded by four walls and a low floor, not a solid cube hidden by CSS. Glows stay inside the chest footprint. Geometry uses six material families and no texture images.

## Verification and limits

`test_chest_model.cjs` checks the actual GLB header/embedded buffer, hierarchy/hinge/anchors, emissive material, budget below 10,000 triangles, no renderer/clock/storage in production runtime, independent instances, articulation endpoints, reward lift, aspect fit, reduced motion and disposal.

Inspected browser-rendered closed, opening and settled stills in `build/chest/chest-{0,0.3,0.65,1}.png`. First inspection exposed an open-lid camera crop; adaptive camera framing corrected it. Captures verify this isolated original scene, not installed-app delivery, accepted reward mutation, shared-renderer handoff or every frame of integrated animation. Those remain integration checks.
