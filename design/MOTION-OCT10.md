# Orbital motion — October 10, 2026

## Intent

Give Scheduler an energized but focused character through responsive controls, spatial continuity, and small circular acknowledgements. Preserve the approved folded background and existing palette. Reading, typing, saved data, and countdown values remain immediate.

The original motion pass mixed several CSS entrance classes. This pass uses a small native Web Animations controller for event-driven choreography and CSS for tactile states and dialog transitions. No animation package, remote asset, or new runtime dependency was added.

## Motion map

| Interaction | Treatment | Timing |
| --- | --- | --- |
| Page navigation | Directional panel arrival; heading follows | 380 ms, up to 105 ms stagger |
| Day/week change | Agenda enters in the direction of travel; short title/detail response | 380 / 220 ms |
| Calendar, Day/Week, focus presets, phone tabs | Glass selection lens travels beneath stationary labels | 340 ms |
| Button press | Small compression; icon settles on activation | 130 / 240 ms |
| Complete assignment | Check settles, one expanding orbit, then remaining cards move into place | 280 ms feedback; 300 ms removal delay; 280 ms reflow |
| Assignment filters and saves | Existing cards retain visual continuity; new cards arrive with short stagger | 280 ms, up to 88 ms stagger |
| Focus room, desktop | Same focus card moves between dashboard and dedicated room | 420 ms |
| Focus start/pause/finish/reset | One halo and label transition; ring color reflects state | 620 / 240 ms |
| Timer progress | Existing countdown ring interpolates between real values | 800 ms linear |
| Course selection | Course detail settles into view | 380 ms |
| Course hover/focus | Small sculpture rotation; labels stay stationary | 480 ms |
| Hero arrival | Single faint light sweep | 850 ms + 80 ms delay |
| Notifications | Short upward arrival | 240 ms |
| Dialogs | Soft materialization; auxiliary dialog visual exits where supported | 280–300 ms in / 160 ms out |

Most entrances use cubic-bezier(.2,.8,.2,1). The larger focus transfer uses cubic-bezier(.4,0,.2,1). The timer remains linear because elapsed time is linear. These are authored easing curves, not a physics simulation.

## Implementation rules

- Root `Application.html` owns the CSS block `orbital-motion-system` and the controller around `motionTiming` / `playMotion`.
- Persistence runs before completion feedback. Animations do not decide whether an action succeeded. Assignment removal retains a short presentation delay; the saved completion state is already updated.
- A new animation cancels the previous animation on that element. Selection lenses read their current visual pose before changing destination.
- Page changes cancel outstanding controller animations. Heading and panels can then enter immediately. No navigation request is queued behind motion.
- Temporary halos and light sweeps remove themselves on completion/cancellation. Backgrounded documents cancel controller animations.
- Reduced motion uses the saved preference, the live appearance class, and the OS media query. Changing the preference cancels active controller effects. Text, checked states, progress and selected states still convey the result.
- Lens geometry updates only after selection/size/child changes. Reads are collected before task-reflow writes. No perpetual animation frame loop is added.
- Motion uses transforms/opacity; gradients, shadows and backdrop blur are static. Existing small progress-ring transitions still repaint their SVG stroke.
- Phone panel travel is limited to 8 px; desktop travel is 16 px. Whole-page navigation resets scroll immediately so it does not combine a long scroll with a content transition.
- Native dialog methods retain their focus and close behavior. CSS `display`/`overlay` discrete transitions progressively enhance auxiliary dialog exits. The event editor retains its existing 160 ms close lifecycle.
- Selection lenses and temporary accents are decorative, hidden from assistive technology, and cannot intercept pointer input.

## Reference review

Reviewed the accessible article text. Embedded animations/videos were not all playable through the research tool; this is not a claim that every demonstration was watched. The duplicated Toptal link is one source.

| User reference | Lesson applied / access limitation |
| --- | --- |
| [Medium: animation best practices](https://medium.com/design-bootcamp/animations-in-ui-ux-best-practices-58ac940239a2) | Public opening discusses brand-specific motion and purposeful feedback. The remainder is member-only; no attempt to bypass access. Applied a consistent orbital vocabulary. |
| [CareerFoundry: animation tools](https://careerfoundry.com/en/blog/ui-design/ui-animation-tools/) | Compares authoring/prototyping tools and runtime options. Chose native CSS/WAAPI for this existing app. Historical pricing/product descriptions were not treated as current facts. |
| [LottieFiles: website examples](https://lottiefiles.com/blog/design-inspiration/ux-ui-animations-website-design-examples) | Small feedback can make actions legible. Applied brief completion acknowledgement; omitted marketing carousels and attention-grabbing loops from the study workspace. |
| [Motion the Agency: what is UI animation](https://www.motiontheagency.com/blog/what-is-ui-animation) | Distinguishes microinteractions, status and transitions. Each added effect maps to a user action or state change. |
| [UX Planet / Tubik: mobile animations](https://uxplanet.org/ux-design-how-to-use-animations-in-mobile-applications-a8257ebffe90) | Feedback, transitions and progress should justify their distraction cost. Applied shorter phone motion, truthful timer progress and quiet study states. |
| [DesignerUp: complete guide](https://designerup.co/blog/complete-guide-to-ui-animations-micro-interactions-and-tools/) | Separate a motion concept from a usable product; plan triggers, hierarchy and accessibility. Implemented a motion map and interruption rules. |
| [Tubik: 15 concepts](https://tubikstudio.com/blog/ui-in-action-15-animated-design-concepts-of-mobile-ui/) | Original URL unavailable. Corresponding blog-subdomain URL returned 403. Search excerpts describe physical continuity; no claim to have reviewed the inaccessible full article. A Design4Users alternate redirected to a different mobile-interaction collection. |
| [Tubik: mobile apps](https://tubikstudio.com/blog/ux-design-how-to-use-animations-in-mobile-apps/) | Original URL unavailable and blog-subdomain returned 403. The user-provided UX Planet article by Tubik covers the related feedback/progress/transition taxonomy and tradeoffs. |
| [IxDF: Disney's principles](https://ixdf.org/literature/article/ui-animation-how-to-apply-disney-s-12-principles-of-animation-to-ui-design) | Use anticipation, staging, easing, and restrained secondary action. Applied press response, panel sequencing and a circular completion accent. Avoided large cartoon-like exaggeration. |
| [Toptal: practical guide](https://www.toptal.com/designers/prototype/a-practical-guide-to-ui-animation) | Define initial state, trigger and final state; preserve continuity between screens. Applied the focus-card transfer. Prototype demonstration durations were not copied into frequent controls. |
| [Icons8: interaction types](https://icons8.com/blog/articles/interaction-design-basic-types-ui-animation/) | Navigation and completion feedback carry meaning. Applied selection lenses and task acknowledgement. Scroll remains native. |
| [Motion the Agency: performance](https://www.motiontheagency.com/blog/how-to-make-ui-animations-run-smooth) | Prioritize response and layout stability. Its FID/TTI discussion is dated; modern responsiveness review should use INP, alongside frame and layout diagnostics. |

## Independent research and judgment

- [MDN: Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) and [Animation.cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel): native animation ownership and cancellation. Cleanup uses finish/cancel listeners rather than unhandled finished-promise rejections.
- [web.dev: high-performance animations](https://web.dev/articles/animations-guide): prefer transform/opacity, keep expensive painted effects static. This is an implementation choice, not a measured frame-rate guarantee.
- [web.dev: layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing): batch geometry reads for list reflow rather than interleaving them with writes for every card.
- [MDN: reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) and [W3C: animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): allow nonessential motion to be disabled while preserving the meaning of state changes.
- [MDN: dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and [Chrome: entry/exit animations](https://developer.chrome.com/blog/entry-exit-animations/): preserve native dialogs and progressively enhance their visual exits with display/overlay transitions and starting styles.
- [Emil Kowalski: Great Animations](https://emilkowal.ski/ui/great-animations): interruption and accessibility matter as much as appearance. Applied pose-aware lens retargeting and cancellation.
- [The Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint): rapid response for entrances, different easing for an existing object changing position, linear time progress. Applied faster response to controls and gentler motion to the larger focus transfer.
- [web.dev: FID](https://web.dev/articles/fid): FID is no longer a Core Web Vital; INP replaced it.

## Self-review and remaining work

- Captured intermediate and settled fictional-data frames in a separate local Edge profile: desktop calendar, page navigation, completion/reflow, focus transfer, timer start, auxiliary dialog exit; phone navigation, event dialog and solid capture dialog; reduced-motion phone navigation.
- The initial phone entrance briefly widened the viewport; reducing travel to 8 px removed this in the reviewed capture.
- Refined completion focus restoration so a delayed callback does not pull focus back after the user switches controls or opens a dialog.
- Changed task reflow from clamped offsets to exact previous positions to remove an initial jump.
- TypeScript/core build and HTML formatting succeeded; native/preview copies and offline fingerprint regenerated.
- No automated test suite, real-device performance benchmark, screen-reader session, Safari/Firefox review, or native Apple build was performed. Those remain release work.
- Full frame-rate measurements and long-list behavior should be reviewed on physical phones before release. Headless frame captures are useful for composition, not proof of real-device smoothness.

All implementation is local and uncommitted. No push, deployment or new scheduled task.

## Additional button and tab coverage

- Shared 130 ms press and 240 ms release feedback now covers enabled text and icon buttons, including dynamically created controls and keyboard activation. Dates and task checks keep their dedicated response; draggable calendar controls use a short opacity response to preserve geometry.
- Assignment filters now share the interruptible selection controller, using a sliding lilac underline. Main navigation, calendar view controls, timer presets and mobile navigation retain their coordinated selection transitions.
- Reduced-motion preferences suppress these decorative animations without delaying actions.

## Prominent motion refinement

Replaced the restrained shared button release with a 440 ms compression/rebound/settle. Every enabled button activation also produces a 640 ms mint rim and directional light sweep, including keyboard activation. Only one light plate exists at a time, is noninteractive and hidden from assistive technology, and removes itself afterward. Page entrances use a more visible 480 ms depth reveal. All effects respect reduced motion; no continuous particle field or added animation dependency.

## Glass editors and date clarification

Removed the opaque My Rhythm planner parent, made dialog shells and inputs translucent, and softened focus outlines while retaining visible keyboard focus. Transparency and contrast preferences still take precedence. Enlarged the date plaque to balance the heading (64 px desktop / 54 px phone). The header now always reads the real device date, refreshes while open and on tab return; the demo calendar remains explicitly labeled Oct 5-11, 2026.

## Tidal panel entrances

Added a 620 ms curved reveal to native dialogs, including Workspace preferences, event/task editors, Capture, Search and the dynamically created account panel. An 820 ms curved light wash passes over the glass and removes itself. The same wash accompanies the leading visible Workspace panel, preserving the existing spatial panel transfers. Expanded details use a short rise/fade. Native focus, Escape and form actions remain immediate. Reduced motion suppresses these effects; closed panels cancel owned motion and remove decorations.

### Stronger tidal continuation

Replaced the simple elliptical light plate with two original SVG wave fronts and a crossing secondary current. Dialog reveals now last 760 ms with short staggered field groups; the wave clears after 1050 ms. Main Workspace sections use the same curved reveal while retaining the focus/planner spatial transfers. Native controls are never delayed or intercepted.
