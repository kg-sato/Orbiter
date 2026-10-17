# Open tidal habitat · 0.6.4

Reviewed the live references on October 17, 2026. These are design observations and original Orbiter adaptations; no site code or artwork was copied.

- https://www.harshsingh.me/ — opened the Texas photo stack. Expanding layered cards and restrained depth support keeping interaction local and purposeful. Orbiter retains its short existing transitions and bounded depth rather than moving study controls.
- https://shwn.design/ — inspected the sunlit koi pond and tapped the water. Observed a contained water scene with caustic light, fish and tap interaction. Orbiter uses original small fish geometry, a local sine-based water shader and existing pointer ripples; it does not reproduce Shawn's simulation or realism.
- https://yanislebzar.com/ — opened Archives. The project transition and abstract framed work suggest open silhouettes and isolated sculptural elements; Orbiter removes its enclosing upright wall and keeps a single abstract grass arc.
- https://lue.studio/ — observed the opening cloud/mist layers surrounding the main white form. Orbiter adapts this as a low-alpha local mist texture and restrained background gradient veils in the existing teal/lilac/rose palettes.

## Implementation

Open rock shelf and shallow pool replace the display wall. The shared camera brings the companion about 8% closer and looks slightly down to show the habitat. Two small original fish follow slow elliptical paths; local caustics and pointer-responsive water use the existing renderer/30 FPS budget. A generated 128 x 64 mist texture avoids a volumetric pass. The texture and line/point geometry are released on model replacement. Wider background fog and tiny fish remain behind controls; reduced motion, hidden/buddy planner states and Low quality stop these animations.

Owned habitat props, palettes, growth and identity remain authoritative. Static WebGL-failure portraits remain flat. Visual review is not an automated regression or a new native resource measurement.
