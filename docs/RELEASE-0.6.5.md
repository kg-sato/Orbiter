# Orbiter 0.6.5 · pond steam

- Add layered steam rising from the background pond, widening and fading as it lifts.
- Nearby cursor sweeps push individual steam plumes in the direction of movement, then let them settle over 1.7 seconds. The response uses pointer speed and proximity, not just cursor position.
- Keep cached course portraits clear; steam belongs to the live habitat.
- Add matching rising mist to the cat habitat; pointer attention bends the plumes and wind decays gently.
- Keep controls stationary, use the existing renderer and shared tiny mist texture, and preserve reduced-motion/hidden-view behavior. No new background JavaScript animation loop; background gusts are event-driven, rate-limited and finish automatically.

Study data, rewards, inventory and cat identity are unchanged. Art renders reviewed; no fresh automated regression or native resource measurement. The personal installer is not Authenticode signed. Source changes remain uncommitted. Quit Orbiter from the tray before installing.
