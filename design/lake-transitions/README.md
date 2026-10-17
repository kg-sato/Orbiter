# Water to glass

Original Orbiter motion study and shared production implementation. This replaces the unpublished faint popup rings and the previous button sweep, page slides, panel scaling and full-screen dialog wipe.

## Run the isolated study

From the repository root:

```powershell
npm run build:core
python design/lake-transitions/build.py
python scripts/serve_local.py --bind 127.0.0.1 --port 18867
```

Open `http://127.0.0.1:18867/design/lake-transitions/index.html`. This is fictional presentation only: no sign-in, study database, credit or account writes. The generated `scene.js` is ignored and rebuilt from Orbiter's existing bundled pond/kitten.

The study was recorded and reviewed before the controller was integrated into the application. `review_lake.cjs` reproduces the motion capture using a disposable browser context. The complete application is exercised by `test_lake.cjs`, plus the existing unified, refinement and island checks.

## Motion

| Action | Duration | Treatment |
| --- | ---: | --- |
| Ordinary button | 220 ms | Two small reflected-light ripples at the activation point |
| Day/Week, assignment filter, preview mode | 350 ms | Local water edge and parting mist |
| Popup opening | 900 ms | Reflected pond surface gathers into a rounded glass silhouette |
| Popup closing | 500 ms | Empty reflected-water silhouette recedes; dialog closes immediately |
| Main navigation / applied scene | 1,000 ms | Broad pond-and-mist morph around the destination surface |
| Crate / expanded buddy panel | 600 ms | Compact version; cat/reward reactions retain their existing authority |

Forms, controls and text remain stationary. The transient layer samples only the already-rendered pond presentation canvas, never a page screenshot or dialog contents. The interior of the destination panel is masked out. Gradients provide soft mist at the edges; no volumetric shader or new WebGL renderer is introduced.

## Interface and lifecycle

- `window.OrbiterLake.play({kind,target,rect,origin,duration})` replaces any previous decorative transition. Coordinates are viewport pixels; defaults use the latest activation point or the target centre. Keyboard activation uses the focused control's centre.
- `OrbiterLake.cancel(reason)` removes the overlay immediately; `stats()` exposes frame/draw timing, buffer size and cleanup diagnostics for checks.
- `OrbiterScene.disturb({x,y,strength})` sends a bounded `orbiter-pond-disturb` event to the existing pond simulation. The intentional impulse can originate at a control; ordinary pointer exclusions remain in place.
- Dialog observation includes dynamically created account, Updates and Discoveries panels. The controller reuses one 2D overlay and one reflection buffer, drawing at no more than 30 FPS while active.
- Escape, resize, scroll, hidden pages, blur and native mode changes cancel decoration. Fresh activations can start immediately afterward. Suspended native dialogs do not emit a closing silhouette.
- Reduced motion, calmer motion, quiet mode and zero motion intensity skip effects. Low quality and WebGL failure use the static pond source plus lightweight edge feedback; no water-simulation disturbance is requested in Low quality.

No preferences, persistence fields, account schemas or reward rules changed. `Application.html` remains canonical. The controller and stylesheet are embedded by `build_core.py`; application copies and bundled desktop assets are regenerated together.

## Delivery

See [verification](VERIFICATION.md) and the curated motion captures in `review/`. These are local, uncommitted changes. The published 0.5.0 installer and updater assets are untouched. A subsequent versioned installer and separately authorized publication are needed for installed desktops to receive this update.
