# Collectible identity and continuous surfaces

## Findings translated into Orbiter

| Reference | Observation / principle | Original adaptation | Cost and limit |
| --- | --- | --- | --- |
| [Duo status bar](https://dribbble.com/shots/27724750-Quick-take-on-iPhone-Duo-Status-Bar) | One compact surface provides continuity between interface states. | Preserve the same water lens as its boundary becomes the destination. | Decorative background only; no entire-panel scale transform. |
| [Natural interface](https://dribbble.com/shots/15886164-Voice-morphing-interface-Natural) | Soft volumes and continuous surfaces support the material metaphor. | Rounded liquid silhouette, refracted pond fill and settling edge. | A sampled 2D pond image, not an extra WebGL renderer or DOM capture. |
| [Machines styling](https://dribbble.com/shots/27056778-2030-Machines-Don-t-Just-Serve-They-Style) | A character's silhouette carries the collectible identity. | Cape and wings change the outline; engraved charm replaces a generic halo. | Layered low-poly geometry and instanced small details. |
| [Incident platform](https://dribbble.com/shots/26742281-Website-for-an-Incident-Management-Platform) | Blue atmospheric depth frames clear, high-contrast content. | Calm dark reading surfaces, brighter scenery outside them. | No mist above input/text layers. |
| [Disney visual development](https://www.disneyanimation.com/process/visual-development/) | Character, costume and environment need a coherent visual story. | Give every item a specific shape, material and reaction rather than a new tint alone. | Keep the cat's own traits visible; do not add props across its face. |
| [Disney simulation](https://www.disneyanimation.com/process/simulation/) | Clothing motion belongs to the character's movement. | Bounded cape hem, pendant swing and layered wing reactions. | Authored secondary motion; no runtime cloth solver. |
| [NVIDIA water caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics) | Underwater light explains water depth and surface motion. | Pebble shallows use clear light networks; crystals use angular prism bands; currents remain underwater. | Local shader terms, not physical ray tracing. |
| [NOAA bioluminescence](https://oceanservice.noaa.gov/facts/biolum.html) | Living light can communicate activity within water. | Aurora Pond will illuminate nearby currents; Infinity Tide carries distinct moving lights. | Restrained emission, no fullscreen bloom pass. |
| [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) | Repeated geometry can share a draw call. | Stones, crystal tips, feathers and current motes share batches. | Dispose instance buffers on rapid swaps; budget the complete equipped set. |
| [Three.js physical materials](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) | More advanced material effects have additional per-pixel cost. | Standard materials first; selective sheen/prism accents instead of universal physical shading. | No heavy fur, volumetric fog or mandatory postprocessing. |
| [NN/G purposeful motion](https://www.nngroup.com/articles/animation-purpose-ux/) | Motion should explain a relationship and not obstruct work. | Immediate content, a meaningful surface transformation and interruptible decoration. | No timed input lock, full-screen wipe or forced wait. |

The Dribbble references were inspected as design references, not as source-code or performance evidence. Individual playback states were available; this is not an assertion that every sequence was fully analyzed frame by frame. Orbiter's artwork, models and motion implementation are original.

## Existing implementation audit

- All habitat IDs previously received the same mild lavender pond tint. Several habitat models shared branches, with small props occupying little of the available space.
- The original transition sampled the pond but cut the whole destination interior out of its overlay. The panel was already fully formed: only a surrounding outline could change shape.
- Legacy accessory IDs fell back to a generic floating halo. Static previews often reused the first numbered icon. Static habitat fallback was always a planet/ring.
- The catalog contains 12 habitats, 15 accessories, 3 trails and 21 appearances. `catalog.js` preserves every ID, slot and rarity while specifying each visual identity and correcting capitalization.

## Bongo Cat comparison applied in this checkpoint

The supplied [community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3448634269) is explicitly no longer updated. It was used as a visual index, not a current economy/drop-rate reference. Direct visual inspection of the official listings showed:

- [Book Stack](https://steamcommunity.com/market/listings/3419430/Book%20Stack): identifiable layered volumes and contrasting page/spine regions, even without animation.
- [Little Raincoat](https://steamcommunity.com/market/listings/3419430/Little%20Raincoat): a readable garment silhouette and substantial trim, rather than a colour swatch.
- [Porcelain](https://steamcommunity.com/market/listings/3419430/Porcelain): coordinated surface motifs create a distinct character style.

Orbiter's original adaptations are a dimensional compass, a layered constellation cape, lunar wings, tide-band and prism coat patterns, scarf stitching and larger open flower banks. The shared soft kitten remains recognizable; playful costume construction belongs to the moonlit pond world. No trading, paid items, events, collaboration features or emote system is added. Existing incidental study reactions remain.

The preview now implements three coordinated outfits and 14 of the 51 item visuals. The remaining 37 replacements and production/catalog migration stay behind the visual-approval gate. The editable refined avatar and its GLB live together under the isolated avatar folder. Surface-pattern shaders preserve the underlying course identity paint.

## Per-item visual contract

The runnable catalog shows all 51 names and descriptions. It explicitly separates six working replacements from 45 future replacements. Habitat profiles distinguish scenery, water behavior and light; accessories distinguish silhouette, material and reaction; appearances distinguish pattern plus surface treatment; trails distinguish their path and particle shape.

The intended remaining habitats retain the approved open compositions: dew leaves, crescent cushion, waterside lantern, tall reeds, cloud shelf, star hammock, open shrine, luminous underwater currents and celestial flowers. No enclosing cage or restored aurora wallpaper. Stronger effects occur around the cat and exposed water; reading zones remain calm.

## Initial budgets

- At most 15,000 added habitat triangles and 12 added draw calls per full new equipped set on Auto.
- Auto particle ceiling 128; High 256. The representative current uses only 24 motes.
- Existing 30 FPS mascot loop; pond runs at its existing 20 FPS presentation cadence. Transitions are finite and capped at 30 FPS.
- No additional WebGL context. Low, reduced motion and unavailable graphics retain recognizable static identities.

These are acceptance targets. Measured results and outstanding checks belong in `VERIFICATION.md`; they are not implied by a successful build.
