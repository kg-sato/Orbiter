# Pond foundations and original Orbiter adaptations

Research reviewed October 17, 2026. Earlier live visual inspection of the four supplied portfolios is recorded in `../backgrounds/HABITAT-REFERENCES.md`. This prototype is original work: no portfolio assets, simulation code or branded compositions were copied.

## What was wrong with the previous approach

The production background was still an abstract SVG composition, with a small separate CSS pond laid over it. Its light rings were unrelated to surface depth. Fish followed decorative paths without belonging to a shared underwater scene. Steam consisted of independently moving gradient shapes or textured planes, so cursor movement displaced whole shapes instead of transporting mist locally. More opacity could make those shapes conspicuous without making them convincing.

The correction is to give the effects a shared scene, spatial scale and lighting model. Geometry and occlusion establish the scene before decorative motion is added. Mist should emerge from a source, move through a field and dissipate; water should reveal and distort something underneath it.

## Findings and implementation choices

| Foundation | Source observation | Orbiter adaptation and cost |
|---|---|---|
| Water is layered | [Evan Wallace’s WebGL Water](https://madebyevan.com/webgl-water/) combines reflection, refraction, caustics and occlusion. Its visual result depends on the interaction of those layers. | Render an original bed/fish layer once per frame, then refract that texture in the surface pass. Approximate broad reflection and caustics rather than adding expensive reflected-scene or raytraced passes. |
| Caustics belong below water | [NVIDIA GPU Gems: Rendering Water Caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics) explains how concentrated refracted light reaches submerged surfaces. | Keep the light pattern modest and aligned with the bed. It must not become a bright decorative grid across the controls. The prototype is an approximation, with no claim of physically computed caustics. |
| Direction is a field | [Codrops: Mouse Flowmap Deformation](https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/) uses cursor position and velocity to maintain a decaying spatial flowmap. | Inject a bounded local impulse into the existing field instead of moving a full-screen light or whole mist sprite. A field continues to dissipate after pointer input stops. |
| Density must travel | [NVIDIA GPU Gems: Fast Fluid Dynamics](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu) separates velocity, advection and external forces. | Use a fixed 30 Hz, 128-square ping-pong field, backward advection, local wind, buoyancy and density decay. Omit pressure projection and incompressibility for this visual prototype; do not label it a complete fluid simulation. |
| Fog has compositing costs | [NVIDIA GPU Gems: Volume Rendering Techniques](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques) describes opacity/compositing and the cost of rendering participating volumes. | Use a shallow density field with a soft noise modulation. No ray marching or stacks of large transparent cards. Pale colour and restrained density preserve the kitten silhouette. |
| Small scenes need coherence | [Shawn’s portfolio](https://shwn.design/) presents fish, stone, water light and interaction as one bounded scene. The previously inspected image identifies tap ripples and fish reactions. | Three original koi meshes sit in the rendered substrate rather than on top of the interface. The prototype adds tap ripples; it does not claim to reproduce Shawn’s fish avoidance behavior or visual fidelity. |
| Atmosphere needs hierarchy | [Lué Studio](https://lue.studio/) layers cloud-like atmosphere around its main form; [Yanis Lebzar’s portfolio](https://yanislebzar.com/) and Archives demonstrate isolated abstract forms and composed transitions. | Keep the pond natural, with subdued cosmic colour in lighting. Remove the upright frame and unrelated wallpaper. Concentrate detail at exposed edges, with fewer active effects beneath reading areas. |
| Delight depends on usability | [NN/G: A Theory of User Delight](https://www.nngroup.com/articles/theory-user-delight/) distinguishes useful, reliable interaction from decorative delight alone. | Timer and navigation remain stable HTML. All demo actions are explicitly fictional; the scenery is not allowed to grant study time or block input. |
| Motion competes for attention | [NN/G: The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/) discusses both useful motion and the distraction caused by irrelevant animation. | Slow resting motion, bounded interaction, explicit pause, calmer reading zones, and no forced loading sequence. [Harsh Singh’s portfolio](https://www.harshsingh.me/) remains a reference for local, contained depth transitions rather than moving whole screens. |
| Control and contrast are requirements | [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) establish requirements beyond visual preference. | Use dark stable reading surfaces, visible keyboard focus and a pause action. Honor OS reduced motion. A complete production contrast audit remains an integration requirement; the prototype does not claim formal WCAG conformance. |

## Alternatives rejected for this checkpoint

- **More CSS mist plumes:** keeps the original disconnected-shape problem.
- **Full volumetric fog:** unnecessary cost for a study companion; it would require a different resource budget.
- **Full realistic ocean/water addon:** [Three.js Water](https://threejs.org/docs/pages/Water.html) supports a different water use case with reflection-related machinery; a small restrained pond needs a tailored composition rather than an ocean material dropped into the page.
- **WebGPU-only fluid rendering:** excludes otherwise usable WebGL2 installations. Existing Three.js/WebGL2 is sufficient for this review.
- **One WebGL context per cat:** violates the resource and compatibility direction already established for Orbiter.

## What the review must establish

Judge whether the pond reads as water over a bed, whether the kitten feels connected to that environment, and whether wind parts mist locally instead of sliding an obvious shape. Evaluate the moving preview as well as still frames. Passing isolated behavior checks is not visual approval, native performance approval, or authorization to publish.
