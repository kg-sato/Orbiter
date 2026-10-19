# Ethereal pond: next visual refinement

## Immediate correction

The preview inherited screen-space reading masks from the existing pond shader. Those masks suppress caustics, reflections and mist in the shape of UI panels, making a dark rectangle visible as a panel forms or disappears. Disable that masking in the isolated build and soften the viewport vignette from a 32% to a 14% edge reduction. Contrast remains supplied by the actual glass surfaces. Production remains unchanged until preview approval.

## Direction: a moonlit dream garden

Keep the blue pond recognizable, but replace busy, evenly distributed detail with a few deliberate luminous features. Avoid returning to aurora wallpaper, screen-wide rainbow bands or particle noise.

1. **Depth and composition.** Use an asymmetrical moonlit opening, a dark-blue deep-water basin and detailed banks at exposed edges. Soften distant shapes and retain crisp nearby stones and lily edges. Keep these environmental features independent of UI rectangles so resizing or tab changes never leave a cutout behind.
2. **Underwater light.** Replace thin regular light scribbles with broader, slowly evolving caustic networks. Let light bend around submerged stones and fade with depth. Add a restrained cyan reflection path with occasional lilac/opal highlights; no universal glow filter.
3. **Veils of mist.** Add two spatial scales to the existing advected field: a broad, low-opacity blue veil and finer curling wisps near the water. Keep emission coherent, not repeated cloud cards. Pointer velocity parts only nearby mist; stationary pointers add no force. Use softer gradients instead of simply increasing fog density.
4. **Living details.** Place a few luminous lily rims and dew glints near the edges. Keep koi below the surface with softer contrast and drifting shadows. Use a small, bounded population of suspended motes rather than evenly covering the screen in stars.
5. **Material response.** Add narrow angle-dependent opal highlights to selected wet edges. Cursor attention shifts a local light reflection by a few pixels; it does not drag the scenery or move controls. Reflection highlights and water-to-glass reveals share the same palette and light direction.
6. **World identity.** Tidal Night emphasizes deep blue, cyan currents and silver reflections; Lunar Mist uses diffuse periwinkle moonlight and a broader pale veil; Opal Dawn uses a restrained warm horizon reflected into blue water. Equipped habitats contribute recognizable local scenery and light, without recolouring the whole interface.

## Implementation order and review

- First refine composition and underwater lighting, with mist paused, so the pond looks intentional as a still.
- Then refine moving mist and its local pointer response; review a slow sweep, fast sweep and stationary cursor.
- Finally add selected wet-edge highlights, motes and koi depth cues. Keep effects sparse enough that their movement can be noticed.
- Show moving comparisons at desktop, phone and compact sizes, all three palettes and with a tab reveal in progress. Reject panel-shaped shading, obvious texture repetition, smeared text, excessive sparkle and milky fog over the kitten.
- Reuse the existing renderer and 128 × 128 mist field. Keep 30 FPS maximum motion, conservative Auto resolution, hidden-page suspension and matching static fallbacks. Profile each layer before adding the next; do not assume earlier measurements cover new effects.

## Research basis

- [Maxime Heckel: refraction, dispersion and light](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/) explains selective refraction and chromatic effects. Orbiter adaptation: a narrow, restrained opal edge treatment, not full-screen distortion.
- [NVIDIA: rendering water caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics) grounds the relationship between moving water and underwater illumination. Orbiter adaptation: coherent depth-aware lighting instead of decorative lines.

This document plans further artwork and shader changes. Only the immediate mask/vignette correction is implemented in this follow-up.
