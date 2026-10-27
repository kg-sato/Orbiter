# Orbiter 0.6.1 · a softer kitten and animated discoveries

- Added the modeled discovery chest with anticipation, a hinged opening and a glowing reward reveal in the planner and compact buddy.
- Added reduced-motion and graphics fallbacks, with cleanup for interrupted openings and protection against duplicate reward requests.
- Rebuilt the head as one continuous rounded surface, removing the protruding cheek lobes.
- Replaced the wedge ears and raised inserts with rounded, thick rims and recessed inner bowls. Pointed, folded, rounded and tufted identities remain.
- Enlarged the eyes, simplified their highlights and added a small friendly cat smile.
- Changed the body to a seated kitten with closer front legs, grounded haunches, a smaller belly patch and a shorter curved tail.
- Painted tuxedo, tabby and sage markings directly onto the head surface so they do not create extra facial bulges.
- Adjusted scarves to sit below the new chin; preserved identities, earned equipment, growth, blinking and interaction channels.
- Gave Tiny Satchel a structured flap, clasp, stitching and a growth-aware shoulder strap.
- Replaced Lantern Pendant's bead with a small framed lantern, and Paper Lantern's simple bulb with a ribbed shade and hanging detail.
- Gave Floating Shrine an open roof, raised platform and suspended gem beside the resting area.
- Added matching no-WebGL artwork for those four existing cosmetics. Their IDs, rarity and ownership rules are preserved.
- Guarded browser focus saves against repeated completion/Finish requests, added saving and retry feedback, and removed duplicate completion announcements.
- Kept keyboard focus on a useful next action after completing an assignment, and stopped paired-browser companion heartbeats from repeating unchanged announcements.

![Revised kitten](../design/avatar/review/three-quarter.png)

The kitten refinement includes editable Blender source and the bundled GLB. The additional four-cosmetic pass uses procedural equipment geometry and SVG fallback artwork; it preserves that model and rig. Canonical HTML, the offline iPhone bundle, fictional preview and native frontend are regenerated.

Focused verification covers the four items across all growth stages, representative identities, compact native-mode fixtures, preview/Cancel/Equip authority, mounted fallbacks, reduced/zero motion, hidden rendering and disposal after repeated swaps. Static geometry is merged by material: the four items use 3–5 additional calls each, and the tested accessory/habitat pairs use 7–9, below the existing 12-call target. These are browser rendering measurements, not native CPU/RAM or physical-device measurements.

Package verification checks the actual binary/installer versions, original updater public key, signature and trusted comment, tamper rejection, checksums and embedded final frontend. Its local report is `build/release/verification-0.6.1.json`. Installed upgrades, actual screen-reader speech, physical iPhone behavior and live cloud reconciliation remain separate checks.

Save your edits and **Quit Orbiter from the tray** before running the updated installer; × leaves it running. It is not Authenticode signed; updater verification uses the existing key. Study data, reward rules and the database identifier are unchanged. Release assets stay local until publication is separately authorized.
