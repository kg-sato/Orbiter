# Wave Wipe direction

User clarification: background takes over the viewport, conceals the current UI, then travels onward to reveal the popup. This replaces the earlier interpretation of a wave confined inside a card.

Implemented a 1050 ms original full-screen SVG matte in the background palette, with a complete-cover midpoint and a trailing curved edge. A manual popover places it above native dialogs without changing focus. Keyboard input skips the decoration; closing, resizing, reduced-motion changes and backgrounding cancel it. Older browsers without popovers get a short dialog fade. Existing spatial navigation transfers remain; the full-screen wipe is reserved for opening dialogs, rather than every small interaction.

Focus background fix: the SVG remains opaque over its static fallback; a separate tint dims Focus. Scroll parallax is held at zero in Focus, matching its paused ambient motion.

References reviewed:
- https://dribbble.com/shots/27342275-Liquid-Wave-Matte-Transition-Flow - accessible description/palette; embedded motion not inspected.
- https://dribbble.com/shots/25681791-Bento-Card-Wave-Glide - fetch failed; no claims about its specific animation.
- https://dribbble.com/shots/26520727-Music-player-web-ui-design-landing-page - accessible description; retain music-player spatial continuity as a future design reference, not an implemented feature claim.
- https://uxdesign.cc/transition-animations-a-practical-guide-5dba4d42f659 - read guidance on directionality, sequencing, speed and spatial relationships. Applied one consistent upward cover/reveal and interruptibility. The deliberate 1050 ms cinematic wipe is longer than ordinary control feedback.

Future explorations: contextual color currents, course-to-detail spatial continuity, and compact music-player-style Focus expansion. Avoid replaying a full-screen effect on every keystroke or timer tick.

## Living water refinement

The wipe now uses a separately namespaced clone of the animated liquid SVG inside its fill pattern, with a 2.4-second current so movement is visible during the unchanged 1050 ms transition. The matte, two surface bands and both edge highlights also morph their curves during travel. All temporary animation nodes disappear with the wipe and share its cancellation/reduced-motion behavior.

Restored the diagonal entry and gently rotating exit, with horizontal overscan for edge coverage. The wipe clone drops the reading-area dimming veils and uses clearer mint, lilac, ice-blue and apricot strata; the resting background remains unchanged. Live internal morphing and the 1050 ms timing are retained.

Overlap cleanup: removed the two independent translucent front bands that crossed the animated marbling. The wipe now has one clipped liquid surface, with edge highlights following the exact silhouette curves at both morph endpoints.
