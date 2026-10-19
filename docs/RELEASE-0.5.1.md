# Orbiter 0.5.1 — A Little World of Your Own

The approved pond and companion artwork now comes to the desktop application.

## A softer companion

- Refined eyes, smile, brows, paws and curved tail, with the existing identities and growth stages preserved.
- Tidal Mint, Lunar Prism and Deep Cosmos now have coordinated coat and scarf treatments.
- Fixed the bare strip through the forehead and face so equipped coat patterns cover the whole head.
- A matching static companion appears while the model loads or when graphics are unavailable.

## Discoveries with more presence

- Larger, open Pebble Pool, Crystal Grotto, Celestial Garden and Infinity Tide habitats.
- Dimensional Silver Charm, Astral Compass, Stargazer Cape and Moonkeeper Wings.
- Distinct constellation, water ribbon and comet trails.
- Consistent Title Case item labels in the collection and item previews.

These are artwork upgrades for 14 existing rewards. The other 37 retain their existing visuals. No items, ownership, odds, crate thresholds or study credit rules have been reset or changed.

## An ethereal pond

- Reworked water, underwater lighting, mist and lily highlights across Tidal Night, Lunar Mist and Opal Dawn.
- Removed panel-shaped dark patches from the pond.
- Tab contents appear with the forming water boundary; popup forms remain immediately usable.
- The reflected-water layer sits above opaque tab panels, fixing transitions hidden underneath the actual desktop interface. It fades as content appears and never captures clicks.
- Matching still artwork for reduced effects and graphics failure, with one shared WebGL renderer.

## Installing the local preview

Save edits, choose **Quit Orbiter** from the tray menu, then run `Orbiter_0.5.1_x64-setup.exe`. Closing with × leaves the previous application running. The installer uses the existing per-user application identity and database location.

This is a local Windows build, not yet published to GitHub or the update feed. It has an updater signature but is not Windows Authenticode signed.

## Validation status

Native tests and isolated browser checks cover data compatibility, rewards, growth, graphics loading, equipment previews, responsive layouts and transition interruption. Physical monitor changes, Windows scaling, live account sync and an installed 0.5.0 → 0.5.1 upgrade still require a hands-on check. Resource measurements and exact package size are recorded in `docs/VERIFY-0.5.1.md`.
