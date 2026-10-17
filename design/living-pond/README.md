# Living pond: visual review checkpoint

This is a runnable isolated prototype, **not the installed application**. Production HTML, native commands, cloud data, catalog labels and published installers are untouched. Edits remain uncommitted.

## Run

From the Scheduler folder:

```text
node design/living-pond/build.cjs
python design/living-pond/serve.py
```

Open **http://127.0.0.1:18868/design/living-pond/index.html**. The server binds only to this PC and serves an exact public file allowlist, not the repository or secrets. Stop it with Ctrl+C. It does not require a package install.

## Review the moving effect

1. Open the popup. A filled water lens grows into its glass background, with a soft moving edge and perimeter mist. Type immediately: the text layer never moves or distorts.
2. Close it. The contents disappear first; only the empty surface drains away.
3. Switch My day / Assignments / Atlas, then Today / This week. Incoming tab content now reveals along the exact water boundary instead of appearing before it. Navigation stays visible; text is never stretched or refracted. Keyboard focus immediately settles the reveal so focused fields cannot remain hidden. No fullscreen animated cover is used.
4. Try Tide Wanderer, Moon Garden and Stargazer. Change worlds/accessories using the controls **beside the kitten**. Compare previous items uses the old item geometry within the same refined avatar and pond renderer; it is not a full old-application benchmark. Try the rotation slider and identity/growth controls.
5. Switch to Compact view, open Options, type a draft, then Done. The island expands and contracts while keeping the same live renderer.
6. Try the lighting, material, growth, motion and quality controls. `?noWebGL` explicitly exercises item-specific static illustrations.

The 25:00 display and focus/completion reactions are demonstrations. They do not start a native timer, award credits or alter stored progress. Keep this preview / Cancel only affect in-memory equipment for this page.

## What is implemented here

- Filled water-to-glass transition, localized ripple, edge mist and closing silhouette; immediate HTML content; interruption cleanup; quiet and Low fallbacks.
- Four replacement environments: Pebble Pool, Crystal Grotto, Infinity Tide and Celestial Garden. Four replacement accessories: Silver Charm, Stargazer Cape, Astral Compass and Moonkeeper Wings.
- Three authored appearances (Tidal Mint, Lunar Prism, Deep Cosmos) and all three trail replacements. These form **14 working item visuals**, with item-specific static thumbnails and fallback decorations.
- A refined editable Blender source and bundled review GLB, plus identity, growth and rotation controls. No production avatar changes.
- Broader underwater light, a moonlit opening, muted submerged koi, local wet-edge highlights, sparse motes and a two-scale advected mist veil. No panel-shaped lighting masks.
- Presentation contract for all **51 existing IDs**, retaining slots and rarities, with Title Case names and truthful effect descriptions. The remaining 37 replacement visuals are **specified, not implemented**. Real inventory, cloud catalog updates and production Equip remain behind the visual review gate.
- One renderer reused from the existing mascot. Pond variation and avatar geometry are adapted only inside the isolated build. Static low/graphics-failure backgrounds are rendered from the same pond studies. No production build or generated application copy changes.

## Architecture and integration after approval

`build.cjs` reads production modules and uses guarded build-time adapters. It fails if expected source anchors change; it never rewrites production files. The generated bundle is ignored. `models.js` supplies reusable instanced props and independent reaction callbacks; owned geometry, material and instance buffers are disposed when swapping models. `transitions.js` maintains one active effect and reuses its canvases. It samples pond pixels only, never form pixels.

After visual approval: promote the accepted controller and models into production modules, finish all other item profiles, add registry-backed previews and cloud/native label consistency, then regenerate application copies and run existing application/native checks. Published 0.5.0 assets stay immutable. A subsequent installer and release are separate actions.

## Checks and evidence

```text
node design/living-pond/review.cjs
```

Uses a disposable headless Edge profile, not personal browser data. Screenshots, a motion recording and JSON measurements go to ignored `build/living-pond-review/`. See **REFINEMENT-VERIFICATION.md** for the current 14-item checkpoint; `VERIFICATION.md` retains the earlier six-item history. The curated `review/ethereal-outfits.webm` is the current moving comparison.
