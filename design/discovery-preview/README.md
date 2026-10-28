# Discovery on your companion

Design and implementation brief, 2026-10-28. User authorized any cat/chest improvement; selected a focused presentation improvement from the new Orbiter vault's Art and Asset Pipeline and Motion and Feedback notes.

## Intended outcome

After an accepted chest opening, show the discovered item on the actual companion, at its current growth stage and with its other equipment. Clearly distinguish this temporary portrait from an equipped item. The existing Equip action remains the sole authority for changing settings. Preserve the blue pond, soft kitten, course identities, odds, earned ownership and chest timing.

Considered keeping the generic category icon, adding a second live model, or using the existing cached portrait. The static portrait is selected: it shows actual equipment and identity without another render loop/context or an extra navigation step. Retain the icon when a reward has no equippable ID (constellation stars) or portrait support is unavailable. Blender/model changes and economy changes are unnecessary.

## Implementation plan

1. Share discovery portrait markup in `src/mascot/rewards.js`; patch only a copy of the existing equipment.
2. Release the chest renderer lease before rendering the portrait. Buddy supplies its active course code and course growth; planner uses its main kitten and native main growth.
3. Render portrait + preview caption + reward name/rarity + existing Equip action. Update the caption/button only after accepted Equip; failed Equip stays retryable, rapid duplicates stay disabled.
4. Regenerate canonical/iPhone/preview/native outputs; test final real UI with isolated authority fixtures.

## Acceptance

- Earned item is visible on the actual kitten, preserving identity/growth and other equipped slots.
- Chest grant succeeds before a preview is shown; a failed grant produces no discovery preview.
- Preview never changes settings; accepted Equip confirms its state, rejected Equip remains usable.
- Shared context/canvas restoration, one chest grant, close/mode cleanup and calm/reduced/zero-motion safeguards remain intact.
- Planner/phone and generated buddy fit and render legibly; static/SVG fallback remains meaningful; constellation stars do not pretend to be wearable.
- Existing chest regression and new preview regression pass, with representative captures inspected. Installed app/device/live-service behavior remains a separate layer.

Evidence is recorded after final verification. Disposable captures belong in `build/discovery-preview/`, not this historical design folder.

## Verified result

- PASS new `node scripts/test_discovery_preview.cjs` against actual generated planner/native buddy sources: decoded actual portrait, main/course identity and growth, unchanged settings until Equip, failure/retry, duplicate activation guard, no pre-acceptance/rejected reward preview, constellation star, no-WebGL fallback and one context.
- PASS planner 390px and buddy 360/420/560px ×520 with long reward names: title and Equip are within the initial reward viewport, scroll position zero. Captures inspected. The initial vertical buddy receipt clipped its action; final two-column layout fixes it.
- PASS existing `node scripts/test_chest_opening.cjs`: early/middle/settled animation, single grant, shared canvas restoration, close/error/mode cleanup, reduced/zero motion and compact layouts. The portrait is deliberately static, so no new continuous animation is introduced.
- PASS core and native frontend builds using existing dependencies, 2 generation tests, iPhone source/bundle/version checks. No version bump.
- PASS existing `test_cosmic.cjs`: asset/rig/material checks, collection preview/Cancel/locked behavior, preferences, responsive widths, reduced motion, distinct catalog artwork and actual invalid-kitten fallback. Repaired its outdated corruption fixture to target the exact kitten GLB bytes; the first embedded GLB is the chest, so corrupting the first data URL no longer tested avatar failure.
- Taste lint remains advisory: established star glyphs, glass/gradient/shadow identity and the chest's `unlock` phase trigger generic style rules. New portrait styles add no flagged visual devices; the existing identity was preserved rather than restyled to satisfy generic rules.

Tests use fictional authority, isolated storage and browser/native HTML; no live service or installed application check. No package, install, commit or push.
