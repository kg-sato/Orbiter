# Spatial observatory

Top commands now use the sidebar material: rounded glass tabs, raised edges and a mint action signal. Timer water is two seamless duplicated SVG tracks; it runs only in running mode, pauses with the session, and respects quiet/reduced motion and hidden documents.

The hero and Atlas feature an original parametric 3D ribbon knot and seven sphere satellites. A self-contained WebGL renderer uses perspective, depth testing, surface normals, directional/specular lighting and an iridescent rim approximation. This is an artistic shader, not physically accurate glass refraction. Pointer movement gently changes the view. Geometry is uploaded once; rendering is capped at approximately 25fps and DPR 1.5, stops offscreen/hidden, and draws a static pose for reduced motion. Shader/context failures retain the SVG hero or static Atlas fallback. No CDN or new package is required.

Research: https://threejs.org/docs/pages/TorusKnotGeometry.html describes parametric knot winding; https://threejs.org/docs/pages/MeshPhysicalMaterial.html explains clearcoat, iridescence and the pixel cost of physical materials. The lightweight custom shader uses those visual cues without implementing transmission. https://web.dev/articles/animations-and-performance recommends transform/opacity for compositor-friendly animation; timer tracks use transform rather than layout animation.

Physical iPhone/Firefox appearance and GPU performance still need user review.

## Opaline aurora revision
Replaced green/metallic shading with midnight blue, violet, opal and sparse rose-gold rim highlights. Slow colour drift follows the lighting; one incomplete filament and five tiny asymmetrically placed glints replace the regular atomic-looking orbit arrangement. The SVG fallback carries the same blue/violet family.
