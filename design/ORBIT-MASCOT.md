# Cursor-responsive Orbit wisp

An original SVG eclipse character inspired by the expressive pointer response in the user's GitHub Universe reference (https://githubuniverse.com/). The character uses Orbit's mint, lilac, opal and midnight colors rather than reproducing GitHub's mascot.

My Day and Atlas show a small decorative wisp near the lower-right edge. Its gaze and body lean toward the local pointer, with bounded movement and a soft settling response. The native companion's face responds similarly within its own window. No operating-system cursor tracking is used.

The character never intercepts pointer events. Phone placement is smaller and above navigation. Touch input does not drive the gaze. Reduced motion, quiet companion mode, inactive pages, hidden documents and open website dialogs stop pointer animation. Updates are capped at 30 per second and stop once the character settles; there is no perpetual JavaScript animation loop.

Root Application.html owns the website markup and behavior. Generated native/preview copies are updated through build:core; the desktop build embeds this website and desktop/ui owns the native companion face.

## Mascot as the brand mark

The mascot now has a circular core and three differently inclined rings. The same face appears in sidebar/mobile branding, My Day and Atlas centerpieces, course emblems, popup marks, both companions, web launcher icons, the Apple icon and Windows icon. Small navigation/action symbols and distinct task artifacts retain their functional meanings. Launcher PNGs are generated locally by scripts/build_icons.py; web/icons/eclipse.svg contains the scalable mark.

The former WebGL centerpieces are replaced by the mascot's SVG geometry. Pointer lean and gaze remain local and bounded; unlocked decorative layers still use the existing evolution styling. No continuous WebGL renderer is needed for the new logo.

## Cosmic cat refinement

Smaller mint almond eyes, triangular ears, a tiny nose, cheeks and whiskers replace the large white eyes. The spherical shading and reflective highlight give a sculpted appearance. CSS perspective rotates the head on two axes; ears, gaze, highlights and rings react at different depths. This is a layered SVG/CSS 3D treatment, rather than a mesh model or a continuous WebGL scene. A brief periodic blink adds expression; reduced motion disables it.

Everyday access uses the installed Start menu/desktop shortcut or the repository's Open Orbit.cmd launcher. An ignored build/release/Orbit Setup.exe copy provides a simpler installer location.

## Illustrated cat direction

The user's cream cat reference led to a new original vector character: cream coat, dusty rose outline, relaxed smiling eyes, blue scarf, tail, paws and lilac/sage decorations. Decorative orbit rings are removed, including native level-growth rings; new levels add small stars instead. Existing cosmetic inventory remains saved and needs the accessory migration planned in ORBIT-COMPANION-NEXT.md.

Typing in the current application document triggers alternating paw lifts and a scarf bounce. Repeats and modifier shortcuts are ignored, reactions are throttled, and no key values are retained or transmitted. Reduced motion and quiet mode stop reactions. It does not respond to typing in other programs.

Launcher icons now render directly from the scalable mascot SVG through scripts/render_mascot_icons.cjs (development-only Playwright and installed Edge), avoiding a separate approximation of the artwork.

## Layout repair

An SVG replacement incorrectly crossed formatted closing SVG tags and removed sidebar/navigation markup. Restored the complete application markup from the prior committed version while retaining the current behavior, then replaced only the two explicit brand-mark containers. My Day and Atlas characters remain mounted by their existing runtime helper. Future logo edits must target exact containers or parsed DOM nodes, never broad replacements spanning arbitrary SVG tags.

Rendered desktop review confirmed five sidebar navigation buttons, a separate workspace column and no JavaScript page errors. Atlas navigation and narrow-screen layout were also inspected using an isolated browser. Existing personal browser data was not accessed or replaced.

Build compilation performed. No new automated interaction tests were requested or run for this pass; pointer appearance should be reviewed in the user's browser and native window.
