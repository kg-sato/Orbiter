# Orbiter observatory backgrounds

Three original abstract environments built from translucent aurora folds, fine contour filaments and diffuse light rather than literal planets. Tidal Night uses teal/violet, Lunar Mist silver/lilac, and Opal Dawn rose/opal illumination.

Cursor movement separates the near/far layers and carries a soft light across the scene. Clicking non-control space emits a brief translucent ripple; at most three coexist. Hidden and reduced-motion states clear ripples and stop movement. Controls never move or intercept decorative events.

`index.html` is a standalone interactive art gallery. `review/` contains full-art, planner and phone compositions rendered on a disposable offline origin. Existing studies in `design/cosmic-studies/` remain as earlier design history.

The editable source is `build_scenes.py`; it deterministically generates `web/celestial.svg` and the gallery. Run from the repository root:

```powershell
python design/backgrounds/build_scenes.py
npm run build:core
node scripts/render_scenes.cjs
```

The background uses original SVG gradients/shapes with seeded star placement. No borrowed artwork, downloaded wallpaper, extra WebGL renderer, full-viewport SVG filter or continuous planner animation is involved. Pointer/scroll events update bounded parallax at at most 30 updates per second. Reduced motion, quiet mode, hidden planner pages and zero motion stop parallax. Existing atmosphere/material preferences remain authoritative; earned habitat lighting stays independent of item ownership.

The buddy uses a compact CSS interpretation of the selected world's translucent folds and light. Its tiny nebula gently breathes only during focus; existing calmer-motion controls suppress it.

These are visual renders, not a new automated regression or performance run. Prior acceptance/resource limitations in `docs/VERIFICATION-0.6.0.md` still apply until remeasured.
