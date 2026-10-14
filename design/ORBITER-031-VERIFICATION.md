# Orbiter 0.3.1 — glass consistency patch

## Delivered

- Native My Day cat returns to buddy by pointer, Enter, or Space. The planner remains mounted; drafts and timer survive. Browser cats do not resize Windows or launch an executable.
- Shared accent-tinted glass controls cover planner, browser companion, rewards, and the isolated native buddy. Active controls, keyboard focus, disabled states, Solid mode, and reduced transparency retain explicit distinctions.
- Workspace is a responsive glass command deck with grouped import/recovery actions. Existing event, capture, preferences, export, and search handlers remain intact.
- Course notes use a glass surface. Confidence slider loses its dark inset block. Solid calendars keep their rounded outer surface; My Rhythm follows the chosen accent.
- Test creation actions keep their labels on one line. Crate progress has more breathing room. Discoveries has a separate header and scrolling collection, avoiding header/reward overlap.
- Weekly review labels show whole elapsed minutes, while stored session precision and reward accounting stay unchanged.
- Removed replaced orbit SVG markup, retired renderer selectors, unused spin keyframes, decorative ring rules, and the obsolete background animation hook. Preserved the animated SVG cat fallback, active browser companion, iPhone bundle, database migrations, and design history.
- Version is 0.3.1; database identifier remains `com.kgsato.orbit`. Native pinning remains enabled by default and applies only to buddy mode.

## Automated checks

- `node scripts/test_unified.cjs`: passed browser identity, unique course profiles, long exam actions at phone width, all three accents on My Rhythm, Solid/glass calendar geometry, Solid button precedence, glass notes, command-deck layout, fractional review labels, reduced motion, WebGL fallback, reciprocal native cat controls, draft survival, timer controls, and minimum/maximum buddy controls. No page errors.
- `node scripts/test_island.cjs`: passed viewport wave coverage at desktop/phone widths, Escape/reduced-motion cleanup, crate reveal/equipment, collection/header separation, reward strip, all growth stages, and one renderer context. No page errors.
- Rust tests: 21 passed, including persistence, crash recovery, exactly-once credit, atomic rewards, course attribution, legacy migration, stale writes, and pairing/security boundaries.
- Inspected generated Workspace, My Day, and Discoveries screenshots in `build/`.
- Regenerated root embedded assets, iPhone application copy, fictional design preview, service-worker shell version, and native bundled content.

## Installer and remaining manual checks

- Final unsigned x64 per-user installer: `build/release/Orbiter Setup.exe`. Built in `build/desktop-target-031` because the user's running release executable is locked. Installation was not run during the active study session.
- No commits, pushes, data imports, resets, or edits to the user's live database were performed.
- Existing native code applies always-on-top on buddy creation, mode restoration, and settings changes. Physical cross-application pinning, Windows scaling/multiple monitors, tray controls, and installer upgrade should be checked after installing this patch.
- Resource measurements were not rerun while the user's Orbiter process was active. The previous release's 200 MB visible-memory target remains unmet; this patch does not claim otherwise.
- The performance helper now refuses to run alongside an existing Orbiter process. A separate database profile does not isolate application-wide single-instance commands.
- `git diff --check` still flags whitespace inside generated upstream Three.js shader strings; these are not hand-written patch source errors.
