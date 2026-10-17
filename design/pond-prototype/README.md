# Orbiter · Stillwater prototype

An isolated **moving visual checkpoint**, not a release or an installer. The current application, database, saved preferences and reward authority are untouched. All study content and timer controls here are fictional demonstrations.

## Open the review

Run `Open Pond Preview.cmd`, then open **http://127.0.0.1:18865/**. The preview uses the local Python installation only to serve its bundled assets. The production installer continues to need no Python runtime. Alternatively, opening `index.html` directly supports the self-contained JavaScript bundle; loopback is recommended for consistent media loading.

- Sweep **exposed water**, especially the lower-right pool, to fan the mist. Movement injects wind; a stationary cursor does not.
- Tap/click exposed water for a restrained propagating disturbance. Touch movement retains ordinary scrolling.
- Open **Stillwater · design review** to switch the three lighting palettes, identity combinations, growth stages, sample equipped props, atmosphere and quality.
- **Compact view** uses the same renderer and scene, with the cat layer moved into the buddy layout.
- **Pause motion**, Low quality and OS reduced motion stop the rendering loop. Low is intentionally a rendered still, not a claim of a full animation running more efficiently.
- Add `?noWebGL` to review the matching static pond and flat identity-preserving cat fallback.

## Build and review

From the repository root:

```text
node design/pond-prototype/build.cjs
node design/pond-prototype/review.cjs
```

The build bundles the existing kitten asset and character factory into `preview.js`. A build plugin takes an **in-memory copy** of the factory, removes the production controller and old stage, and retains identity, growth and sample equipped props. Production source is not rewritten. This is a prototype reuse mechanism, not the proposed long-term integration boundary.

`review/pond-motion.webm` contains actual generated motion, with cursor sweeps and ripples. `motion-contact-sheet.png` shows decoded moments from that recording. Planner, phone, compact, palette, reduced-motion and fallback images are included. Resource figures and acceptance output are in `review/measurements.json` and `VERIFICATION.md`.

## Rendering decisions

- One WebGL renderer/context handles the pond substrate, water, 128 × 128 mist simulation, and existing kitten. No framework was added.
- The pond bed has a single original seeded 2048-square fine mineral-bed texture, dimensional edge rocks, and three original lightweight fish meshes. Nothing is downloaded at runtime.
- Water refracts the substrate render texture. A calm depth tint, softened highlight, restrained caustic pattern and bounded wave impulses provide depth cues. Caustics are an artistic approximation, not traced sunlight; reflection is a soft lighting approximation, not scene reflection tracing.
- Mist is advected through a velocity/density field. Local wind, dissipation, upward buoyancy and mild turbulent forcing replace independently translated steam cards. RGBA16F is used when supported, with RGBA8 as a compatibility path. This is **not** an incompressible Navier–Stokes solver or volumetric ray marcher.
- The renderer briefly draws the cat and copies that small region into one 2D presentation canvas before drawing the full pond. This preserves correct HTML stacking without creating a second WebGL context. Cat presentation updates at up to 15 FPS; pond/mist run at up to 30 FPS. The copy cost is included in render-submission timings.
- Reading zones attenuate lighting and mist detail. The interface is ordinary HTML with stable positions. No fluid deformation is applied to text, buttons or panels.
- Auto begins at 85% CSS resolution, capped at 1440 × 1000; sustained over-budget samples lower it to 55%. High caps pixel ratio at 1.25. Hidden-page rendering suspends, and simulation time does not catch up after a hidden interval.

## Review boundary

This prototype removes the former aurora, star wallpaper, CSS fish, ring outlines and card-based steam **within the prototype**. The production application retains its previous background until visual approval. No version bump, application-copy regeneration, installer rebuild, deployment or commit was performed.

After approval, first extract the shared character/rendering boundary cleanly, then integrate into `Application.html` and the native buddy. Retain existing preference identifiers, study records, inventory, growth ledgers and timer authority. Native resource and upgrade checks remain required before release promotion.

## Lily-pond revision

The visual reference led to darker clearer water, a finer 2K mineral bed, fewer edge rocks, original 1K koi skin maps with subtle scales, notched lily-pad meshes with veined leaf textures, and a layered pale water lily. Lily pads render above the water rather than being refracted as submerged objects. Mist sources cover a wider area; a five-tap density filter and two detail scales soften enlarged steam without introducing transparent cards. The flower is positioned clear of reading controls. All generated imagery is original procedural artwork, not a photographic recreation. The preview remains separate from the full application.

## Blue atmosphere refinement

The current preview uses Orbiter's midnight-blue glass, mint-blue water and lilac highlights rather than traditional green pond colours. A distributed density source maintains a low-opacity mist veil across the entire background. Local velocity impulses carry and disperse density under cursor sweeps; it then replenishes. The moving flow remains in the existing 128-square field, with no new renderer or CSS steam cards. This is still an isolated demo, not a replacement for the installed application's full UI.
