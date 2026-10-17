# Orbiter — interaction research and next-release roadmap

Research date: October 15, 2026. Status: proposal; application changes have not been implemented.

## Direction agreed with the user

- Prioritize **polish and useful delight**.
- Include both feature groups: **study actions + appearance previews**, then **habitat + study recap**.
- Keep full wave wipes for major moments. Frequent controls use short local transitions.
- If a further optional question goes unanswered for 15 minutes, use its recommended choice. No further answer is needed to complete this research.
- Preserve Orbiter's cosmic cat, mint/lilac/apricot accents, glass and Solid materials, native timer authority, study data, discoveries, and course identities.

## 1. What was actually reviewed

[Directoryyy](https://directoryyy.com/) currently presents itself as **perfolios**, a curated directory of personal portfolios. The live page showed **248 portfolios**, organized into Minimal, Thoughtful, Playful, Creative, and Showcase filters, with list/grid views and search. This is a source of design references, not an objective ranking of the best products in every field.

I opened eight listed sites directly. I visually inspected seven through browser screenshots and reviewed Emil Kowalski's homepage and motion articles. Some embedded videos reported that they could not play in the research browser; their timing and frame-by-frame behavior were not verified. Observations below distinguish visible evidence from proposed Orbiter adaptations.

### Reference matrix

| Reference | Observed on the actual site | Lesson for Orbiter | Priority / boundary |
| --- | --- | --- | --- |
| [Daryl Patigas](https://imdaryl.com/) | Drafting-sheet framing, numbered sections, restrained typography, fine rules, a work timeline with playback controls, sorting, and discipline filters. The timeline invites dragging. | Give My Day a clear reading order and make study progress understandable through a compact chronological record. Put small metadata beneath the main action. | High: borrow hierarchy and timeline clarity. Keep Orbiter's palette and type identity. Dragging performance was not benchmarked. |
| [Ève Bouffard — Wallpaper](https://www.evebouffard.com/home/wallpaper) | A large artwork environment and a dedicated appearance panel: wallpaper thumbnails, reading-column tab, framing, darkening, grayscale, effects, and reset controls. Content and scenery occupy visibly different planes. | Show a live miniature of the planner and buddy while editing appearance. Separate scene atmosphere from readable study surfaces. | High: provide a curated set of meaningful controls. Avoid exposing the full shader toolbox in everyday settings. |
| [Maxime Heckel](https://maximeheckel.com/) | A translucent dimensional emblem in a blue drafting-like scene, a compact floating navigation bar, and collections exploring light, refraction, painterly rendering, and responsive physics. | Treat light direction, contact shadows, and material roughness as a coherent system across cat, habitat, glass, and reward objects. | Medium: art direction first. Heavy full-screen raymarching and post-processing are experiments, not the desktop default. |
| [Chloe Yan](https://www.chloeyan.me/) | A sparse garden scene with planted clusters, directional shadows, atmospheric color, a welcome sign, clock/climate labels, a watered-plants counter, and plants linking to sections. | Let the companion's habitat communicate accumulated progress through a small environment that becomes richer over time. | High: derive changes from already credited focus. No public watering counter, geolocation, care penalties, or social backend is needed. The watering interaction itself was not triggered. |
| [Emil Kowalski](https://emilkowal.ski/) | A restrained homepage linking to practical motion demonstrations and essays about animation frequency, speed, easing, and control feedback. | Make repeated study actions immediate; use expressive motion for infrequent achievements. Animate from the trigger and acknowledge input without waiting for decoration. | High: directly relevant to popup speed and loading complaints. Read the articles linked below. |
| [Rauno Freiberg](https://rauno.me/) / [Craft](https://rauno.me/craft) | A bold editorial homepage and a craft index including toolbar morphs, inline conversion, spatial tooltips, sliders, and liquid swipe studies. | Give related controls spatial continuity: one small action area can change between ready, focusing, paused, and completed states. | High: study the control relationships. Craft-index titles establish what is explored; embedded motion was not individually validated. |
| [Lab01](https://lab01.dev/) | Embedded working interface examples. The first shows theme thumbnails, a transparent-sidebar toggle, and clear Cancel/Save actions; others show timelines, command rows, and boards. | Build appearance settings around visual previews, consistent grouping, and explicit commit/cancel behavior. Establish control consistency before adding decorative complexity. | High: adapt patterns using existing HTML/CSS and native commands. Do not import its entire UI stack. |
| [Raffi Chilingaryan](https://www.raffi.zip/) | A phone-home-screen composition with recognizable app objects, widgets, folders, and a dock, accompanied by a short introduction. Some folder media could not play. | Make buddy controls glanceable and group advanced tools away from the compact timer. Use recognizable objects for crates and inventory entry points. | Medium: borrow recognition and grouping. A simulated phone shell would add unnecessary layers to Orbiter. |

### Additional primary-source reading

- [7 Practical Animation Tips — Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips): immediate pressed feedback, trigger-aware origins, strong ease-out motion, and generally short UI transitions.
- [You Don't Need Animations — Emil Kowalski](https://emilkowal.ski/ui/you-dont-need-animations): frequency matters; repeated and keyboard-driven interactions should not wait for decorative movement.
- [On Crafting Painterly Shaders — Maxime Heckel](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/): original work on painterly post-processing, including the Kuwahara filter. Useful as a future rendering study, not evidence that the effect fits Orbiter's resource budget.

## 2. What Orbiter should learn

### A. Give each visual layer a job

Use three depth levels: scenery behind the workspace, calm panels for content, and a brighter floating plane for controls. Constrain decorative highlights to edges and empty regions. Course notes, form text, dates, and timer numerals need stable contrast regardless of the scene.

Keep the main canvas midnight with mint/lilac depth and occasional opal warmth. The cat keeps its cream, rose, and blue identity. Habitats can introduce muted mineral, moss, and pearl colors without changing every UI control's accent.

### B. Make the next study action obvious

The existing My Day hero, focus controls, and reward strip already provide the necessary pieces. Refine them into one reading sequence: selected intention → time budget → Start/Resume → progress. Avoid a second floating toolbar competing with the top navigation or obscuring the calendar.

### C. Use continuity rather than longer animations

Use local morphs for related states and direct response for frequently repeated actions. Keep a shared scene direction and material vocabulary across modes. A full-screen wipe should signal a meaningful transition rather than accompany every field, menu, or keystroke.

### D. Make progress feel inhabited

The habitat should develop from progress already earned. It should make a finished session feel consequential even if a crate did not unlock. Keep the timer and task readable while the environment remains secondary.

### E. Preview customization before saving it

A settings choice should immediately demonstrate its effect on both planner and buddy. Explicit Apply/Cancel makes exploration safe. Keep advanced options collapsed and provide a single reset action for appearance.

## 3. Proposed release sequence

Version labels are provisional. Complete the remaining 0.4.2 sync/upgrade validation before promoting the next feature release. No commits, publishing, or production data changes are part of this research task.

### Milestone A — daily interaction polish

**1. Contextual study actions**

- Refine the existing My Day hero and focus card into a coordinated intention/action area. No additional always-on floating panel.
- The active or paused timer's task wins. Otherwise retain the user's valid selection; with no selection, show the current calendar event or a prompt to choose an intention. Do not silently start the earliest exam or change an active timer's attribution.
- Idle controls: intention selector, existing duration presets/custom duration, and Start. During focus: Pause, Finish, and task details. Paused: Resume, Finish, and details.
- Keep actions in the same positions while labels/icons change. Confirm destructive reset separately. Mark task completion only through its explicit action.
- Desktop Start/Resume continues to call Rust and switch to buddy only after acceptance. Browser-only use keeps its existing timer behavior and never launches or resizes Windows.
- On narrow screens, stack intention and controls without obscuring the calendar. Keep the compact buddy's timer/actions within its supported minimum size.

**2. Appearance studio**

- Replace the appearance portion of existing preferences with a two-part layout: controls and live preview. Use a single column on phones.
- Offer the existing three accent choices, existing materials, and three original scene presets: Tidal Night, Lunar Mist, and Opal Dawn. Tidal Night is the migration default and retains the current scene direction.
- Show planner and buddy preview tabs. Both use the same effective accent/material/scene settings; the companion's coat remains its own color.
- Add a restrained atmosphere-strength slider, from 0 to 100, default 50. It affects decorative layer opacity/contrast only, not text opacity or control legibility.
- Store changes in a temporary appearance draft. Apply persists through the existing guarded adapter; Cancel/Escape restores the saved appearance. A stale save preserves the preview draft for review.
- Reset restores appearance defaults only. It does not change buddy size, pinning, account, timer, cat identity, equipment, or data.
- User/system reduced motion and Solid mode override decorative effects in the preview and final UI.

**3. Shared control and motion pass**

- Use the existing glass tokens for surfaces and buttons. Differentiate primary, secondary, selected, disabled, and destructive states through tint, emphasis, and icon/label rather than unrelated button families.
- Standardize close glyph centering, intrinsic label widths, input heights, icon stroke weight, visible focus rings, and generous hit areas. Keep text labels on unfamiliar actions.
- Default timings: press feedback 90 ms; menus/tooltips 140 ms; local state transitions 180 ms; panels/mode content 240 ms; crate reveal 420 ms, skippable.
- Use an ease-out curve for entered controls and transform/opacity for frequent transitions. Do not animate keyboard result selection or delay typing focus.
- Search, Capture, task editors, dropdowns, settings sections, and ordinary dialogs use local transitions. Native window resizing remains native; animate content rather than continuously issuing resize commands.
- Retain the 620 ms angled multi-layer wave for an actual scene-preset change after Apply and for the explicit weekly-review opening. Crate reveal uses a smaller wave within its own panel. No wave on initial load, repeated theme preview, or routine sync.
- One transition owner cleans up on interruption, Escape, resize, hidden state, and mode changes. Reduced motion bypasses decorative motion immediately.
- Loading indicators reflect actual pending actions. Never add a minimum waiting period or show a full-page loader for cached content.

### Milestone B — progress with personality

**4. Growing celestial habitat**

- Rework the existing course-card habitat shapes into small original moonlit environments: a quiet resting stone at Baby, a shallow tidal pool at Kitten, a small lantern and plants at Young Cat, and a fuller celestial garden at Adult.
- Use existing growth thresholds: 0 / 2 / 8 / 20 hours. Main habitat uses total tracked focus; course habitats use the existing authoritative course-growth ledger. No new XP or growth calculation in the renderer.
- Add habitat development to the existing selected-cat scene and cached portraits. Keep one active WebGL renderer, including when switching between My Day, Atlas, and buddy.
- Existing habitat cosmetics decorate the growing foundation; equipped IDs, ownership, and crate odds stay unchanged. Progress never removes an earned accessory or resets a cat.
- Head pats keep their existing interaction. Add one occasional stretch on deliberate interaction and a brief contented reaction after a credited session. No persistent sound by default, hunger meters, care chores, or decay while away.
- Static/reduced-motion fallback shows the same cat identity and habitat stage with readable progress text. Hidden or tray-only views do not render continuously.

**5. A concise session recap**

- Show one non-blocking summary after a deliberately finished or naturally completed focus session: intention, actual focused time, exam budget reduction when applicable, confirmed XP/crates, and growth toward the next stage.
- Present it inline in the expanded buddy, with a matching latest-session card on My Day. Finishing a timer must not automatically maximize the planner or interrupt another editor.
- Actions: Done, Open task, and Open crate when available. All remain keyboard accessible. Opening a recap never credits time, grants a crate, or marks a task complete.
- Distinguish local recorded focus from cloud reward confirmation. Pending cloud credit reads as pending rather than displaying a reward that the server has not accepted.
- Group midnight-split records under the same focus-session identity. Pause/resume, lock/suspend, checkpoints, mode changes, sync replay, and webview recreation do not create duplicate recaps.
- Persist the latest summary and its acknowledged session identity, so it can be revisited without replaying celebrations on every load. Earlier imported sessions do not produce new completion celebrations.
- If less than a minute was credited, format seconds accurately; otherwise use whole-minute labels and concise hours/minutes. Do not expose floating-point minute strings.

## 4. Minimum interface and compatibility changes

- Extend existing workspace appearance preferences with optional defaulted `scenePreset` and `atmosphereStrength`. Keep keys compatible through browser/native validation, JSON backup, account sync, and old-backup migration.
- Keep appearance previews ephemeral until Apply. No timer or persistence command is invoked merely to render a preview.
- Use the current timer actions and state events for study controls. Add a native session-completed summary event/snapshot only where current data cannot supply a stable grouped result. Include stable session identity, captured task/course, actual credited time, and reward-confirmation status.
- Store authoritative recap information with timer completion transactionally. Treat acknowledgment as UI state, not as a reward grant or a workspace record that can manufacture XP.
- Render habitat state from existing growth/equipment snapshots. Browser views without an authoritative companion connection explain reward availability and do not fabricate progress.
- Keep root `Application.html` as the app source of truth. Centralize shared appearance/motion behavior instead of adding another late CSS override block. Regenerate native, iPhone, and preview copies only during implementation.

## 5. Acceptance and release gates for implementation

### Daily use

- Starting/resuming from planner, buddy, tray, and paired website retains one native timer. A selection change cannot reassign already tracked focus.
- Task titles, exam labels, and every action fit at phone widths and minimum/default/maximum buddy sizes. Check 100/125/150/200% Windows scaling.
- Preview/cancel/reset/apply behave consistently across Mint, Lilac, Apricot, glass, Solid, reduced transparency, and reduced motion. Restart and export/import retain saved settings.
- An incoming sync change during appearance editing preserves the local draft and uses the existing conflict/revision guard.
- Repeated popup opening, Escape, resizing, and mode switching leave no orphan overlays or blocked inputs. Keyboard focus is available immediately.

### Progress and recap

- Check all four growth stages with original course identities and equipped cosmetics retained. No extra reward entitlement or rewritten historical course credit.
- Verify early finish, natural completion, zero/sub-minute focus, cross-midnight focus, lock/suspend, interrupted recovery, and cloud/offline reconciliation. Each completed session has one summary and one credit path.
- Clicking recap controls, reopening the webview, or reloading a paired client cannot duplicate XP, crates, or celebration.

### Efficiency and delivery

- Keep one WebGL context; use cached portraits for other courses. Cap active rendering at 30 FPS and stop hidden rendering. No animated full-screen blur or second continuous background WebGL renderer.
- Measure release CPU, memory, startup, and package size against 0.4.2 before promoting new artwork. Retain earlier targets: tray idle CPU under 1%, visible idle under 2%, visible combined memory under 200 MB, and opening under 3 seconds on this PC. Report measured misses rather than claiming targets passed.
- Run relevant existing UI/native checks when implementation is authorized. Keep test workspaces separate from the user's real data.
- After validation, build a versioned installer with the existing updater signing key. Publishing and committing require the user's explicit request.

## 6. Later experiments — not required for the next release

| Idea | Why it is promising | Gate before adoption |
| --- | --- | --- |
| A visual weekly study journal | Daryl's chronology and Chloe's environment could turn already recorded study into a small personal history. | First prove recap grouping and data accuracy. Keep it private and based on real sessions. |
| Search with contextual previews | Directoryyy's filtering and Rauno's interaction studies suggest useful previews of a course, task, or action before opening it. | Existing search must remain immediate and keyboard-first. |
| Soft painterly cat rendering | Maxime's work suggests more original surfaces and lighting than generic glossy geometry. | Start with lighting, colors, and textures. Adopt shader post-processing only after resource measurements. |
| A compact optional tool shelf | Raffi's recognizable grouping could make export, updates, and sync easier to find. | Keep it inside existing settings; avoid another launcher or taskbar entry. |
| Quick capture with reversible changes | Clear inline feedback would reduce modal use and make corrections easier. | Needs a separate undo/data model decision, especially with multi-device sync. |

## Recommended starting point

Implement Milestone A first and review it as a coherent everyday workflow. Then build Milestone B using the same controls, lighting, and motion rules. Reserve more experimental shaders and new navigation concepts for later prototypes in `design/`.

All references are inspiration for original Orbiter work. Their artwork, branding, code, and assets are not part of this plan's deliverables.
