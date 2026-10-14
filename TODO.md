# Scheduler implementation checklist

## October 14 — floating island and growing cats

- [x] Rounded frameless island, wide layout, custom controls, bounded compact size, and temporary expansion.
- [x] Buddy-only pinning enabled by default following user feedback.
- [x] Cat face refinement, independent motion, four growth stages, and captured per-course focus ledger.
- [x] Thirty-minute crates, visible level bars, preview collection, and 36 additional cosmetics/habitats.
- [x] Full-viewport popup wave wipe and cancellation/reduced-motion checks.
- [x] Twenty-one Rust tests and isolated browser reward/growth/layout checks.
- [ ] Complete physical scaling, monitor, sleep/reboot, notification, and uninstall review.

Current evidence: `design/ORBITER-ISLAND-VERIFICATION.md`.

## October 14 — Orbiter unified Windows application

- [x] Bundle planner and buddy into one Tauri window with native controls and preserved drafts.
- [x] Repair compact layout; add persistent size presets/custom bounds and buddy-only pinning.
- [x] Add original procedural 3D cats, persistent course traits, fresh-load variation, and independent interactions.
- [x] Centralize start/resume switching; remove Focus Room destinations while preserving browser timer use.
- [x] Review GitHub #9–#12 locally; improve shared theme tokens and exam wrapping.
- [x] Run 15 Rust tests, isolated browser checks, and actual native maximize/restore/minimize checks.
- [ ] Reach the under-200-MB visible memory target; review full-planner animation cost.
- [ ] Complete physical lock/sleep/reboot, multiple-monitor/scaling, notification, and uninstall acceptance checks.

See `design/ORBITER-UNIFIED-VERIFICATION.md` for evidence, measurements, and remaining limits.

Canonical project: `C:\Users\kgsat\Documents\Scheduler`.
Keep changes local and uncommitted until explicitly asked to commit or push.

## 1. Abstract UI — in progress
- [x] Review accessible supplied reference pages; record unavailable assets.
- [x] Create original CSS orbital sculptures, flowing highlights and asymmetric surfaces using the existing slate/mint/lilac/apricot palette.
- [ ] Visually inspect desktop and mobile layouts when browser access is available.
- [ ] Refine assignment, rhythm and focus layouts with real content, long titles and empty states.
- [ ] Preserve neutral readable text, visible focus, reduced-motion and solid-material preferences.

## 2. TypeScript foundation
- [x] Add a pinned TypeScript build without introducing a required network connection at runtime.
- [x] Move pure scheduling/date/workload functions into typed source.
- [x] Bundle generated JavaScript into canonical HTML for the existing native and preview sync workflow.
- [x] Document source ownership and build commands; preserve existing backup compatibility.

## 3. Assignment breakdown
- [x] Add editable milestones with duration estimates and completion state.
- [x] Offer an explicit preview of proposed study sessions before saving calendar events.
- [x] Avoid occupied time; surface work that cannot fit before a deadline.
- [x] Link sessions to their parent assignment and prevent duplicate planning.

## 4. Workload forecast
- [x] Show planned time and available study capacity by day.
- [x] Merge overlapping events before calculating occupied time.
- [x] Let the user set study hours and a daily study target.
- [x] Suggest free blocks; distinguish suggestions from saved events.

## 5. Quick capture
- [x] Open a compact assignment form from every main page without navigating away.
- [x] Add a keyboard shortcut that does not interfere with typing or existing dialogs.
- [x] Preserve focus, show save errors and keep entered text after failed saves.

## 6. Personal themes
- [x] Add mint/lilac/apricot accent choices within the existing palette.
- [x] Add sculpted/glass/quiet material choices with live preview and persistence.
- [ ] Keep readable neutral text and respect reduced-transparency/contrast preferences.

## 7. Focus companion
- [x] Store a stable assignment ID on the timer and completed sessions.
- [x] Display actual focused time by assignment without treating time as task completion.
- [ ] Handle deleted assignments, reloads and timer recovery without duplicate sessions.
- [x] Add a session-complete action to continue, take a break or mark work done.

## 8. Swift / Apple features
- [x] Add optional native haptic feedback to deliberate user actions.
- [x] Add permission-based local reminders with cancel/reschedule behavior; native device review remains pending.
- [ ] Add an actual WidgetKit extension and shared data container; configure signing and entitlements.
- [ ] Build on macOS and review on physical Apple hardware before TestFlight.

## 9. SQL, accounts and cross-device sync
- [ ] Implement schema and ownership policies for events, assignments, milestones, preferences and focus sessions.
- [ ] Choose/configure backend project and callback/domain settings with the user.
- [ ] Add sign-in, recovery, account deletion and authenticated data access.
- [ ] Implement offline queue, version checks, deletions and conflict resolution.
- [ ] Migrate device-local data explicitly and partition caches per account.
- [ ] Deploy website and distribute the Apple beta only when explicitly authorized.

## October 5 afternoon additions

- [x] Course Atlas with original 3D orbital cards, assignment progress and course context.
- [x] Per-course notebooks and a self-reported confidence control; explicit save and draft warnings.
- [x] Search workspace with Ctrl/Command K, keyboard navigation and local results.
- [x] Week in orbit: completed-focus sculpture, due-work status and saved weekly reflections.
- [x] Find study time: available windows over seven days with an editable event draft before saving.
- [x] Calendar-file export with optional deadlines, Unicode-safe RFC 5545 formatting and native Files handoff.
- [x] Installable web manifest, HTTPS-only offline shell and home-screen shortcuts.
- [x] Original orbital web/native app icons generated from source.
- [x] Phone toolbar menu, touch-sized controls and narrow-dialog overflow corrections.
- [x] Extend the unapplied SQL draft for course notebooks and weekly reflections.
- [x] Visually inspect the desktop Atlas and 390px phone Atlas/reflection layouts.

## Release work still required

- [ ] Full browser interaction, accessibility and performance review, including keyboard-only use and long data.
- [ ] Calendar import review in Apple Calendar, Google Calendar and Outlook.
- [ ] Hosted installation, offline relaunch, upgrade, cache eviction and multi-window review.
- [ ] Build the native project on macOS; review Files exports, haptics and notifications on an iPhone.
- [ ] Configure a backend and implement account identity, sync, conflict recovery and account deletion.
- [ ] Add WidgetKit only after shared data/signing decisions are made.
- [ ] Add course archive/rename and semester onboarding without losing event/task relationships.
- [ ] Consolidate accumulated CSS layers after visual direction approval.

## Handoff

October 6 handoff: the user requested completion of the current work and a short commit message. This implementation pass is finished locally; all changes remain uncommitted for review. No automatic continuation is scheduled. The release work above remains outstanding.

Checked items mean implemented in code, not release-tested. TypeScript compilation succeeded and HTML was formatted. No automated tests, native builds, calendar round trips, offline installation tests or SQL migrations were run. The in-app browser became available and was used for visual inspection with fictional preview data; the earlier Firefox limitation was not bypassed.

Read `docs/STUDY-FEATURES.md`, `docs/WEB-APP.md` and `design/RESEARCH-OCT05.md` before continuing. The root Application.html is the UI source of truth; `npm run build:core` embeds TypeScript and refreshes native/preview copies. The preview server runs locally on port 8002 while its process remains open.

## October 7 observatory overhaul

- [x] Rebuild sidebar and top bar with a floating glass shell and clear action hierarchy.
- [x] Add original shaded orbital background artwork, bounded parallax and finite transitions.
- [x] Simplify headings, assignment summaries, typography and secondary controls.
- [x] Add a contextual focus-session return indicator without changing timer persistence.
- [x] Improve tablet/phone layouts and retain solid, calm and higher-contrast variants.
- [x] Explain active device accessibility preferences in appearance settings.
- [x] Regenerate native/fictional preview copies and offline shell fingerprint.
- [x] Perform local visual review with fictional data; fix overflow and indicator positioning.
- [ ] Review on real iPhone/Safari and Firefox, including keyboard, screen reader and performance.
- [ ] Consolidate historical CSS layers after visual direction approval.

See `design/RESEARCH-OCT07.md` for source decisions, inaccessible references and review limits. Today's work is local and uncommitted; no push or deployment was performed.

October 8 closeout: remaining preference copy and focus-beacon keyboard handoff completed. UI pass finished locally; changes remain uncommitted for user review.

## October 9 dimensional UI pass

- [x] Strengthen card, calendar-selection, sidebar and button elevation without adding UI copy.
- [x] Explore a WebGL orbital scene; superseded after user feedback by the folded-light direction below.
- [x] Replace floating background objects with original full-viewport mint, lilac and pearl vector relief.
- [x] Remove the superseded WebGL renderer and preserve bounded, event-driven pointer parallax.
- [x] Adapt the composition to phone screens and retain quiet, solid, reduced-motion and higher-contrast appearances.
- [x] Regenerate app copies and document current implementation in `design/FOLDED-LIGHT.md`.
- [ ] Review physical iPhone/Safari and Firefox appearance and performance before release.

Changes remain local for review; no commit or push was performed.


## October 10 motion system

- [x] Review provided animation references and independent browser/design guidance; record access limitations.
- [x] Add coordinated, interruptible page and calendar entrances.
- [x] Add sliding glass selection lenses to calendar, view switch, focus presets, and phone navigation.
- [x] Add task completion acknowledgement, exact-position reflow, and new-card/filter motion.
- [x] Connect the dashboard timer to the Focus room through a desktop spatial transition.
- [x] Add one-time timer state feedback, hero light sweep, tactile controls, and course detail motion.
- [x] Enhance auxiliary dialog exits where browser support allows; retain native close/focus semantics.
- [x] Respect live and saved reduced-motion preferences; cancel transient effects on page changes/backgrounding.
- [x] Regenerate derived app copies and inspect fictional desktop/phone motion frames.
- [ ] Review real-device Safari/Firefox responsiveness, screen-reader/keyboard flows, and long-list motion before release.

See `design/MOTION-OCT10.md` for timings, sources, implementation decisions, and review limits. Changes remain local and uncommitted.


## Next design pass ? approachable inputs (user reminder, October 10)

- [ ] Redesign Capture as a welcoming quick-entry surface with concise prompts and optional details.
- [ ] Make New event / study block creation feel conversational, progressively revealing advanced fields.
- [ ] Refresh Search as a friendly command palette with useful empty states and recent destinations.
- [ ] Refresh Your Workspace / profile preferences with clear grouped choices and previews.
- [ ] Preserve labels, keyboard navigation, validation, saved data, and reduced-motion support throughout.

## Liquid instruments and spatial continuity

- [x] Refresh the central event action and timer with translucent instrument styling.
- [x] Add event-driven scroll depth and scene-specific liquid orientations and palette shifts.
- [x] Extend spatial panel transitions to the planner, workload forecast and assignment rail expansion.


## Account infrastructure

- [x] Replace network-wide hosting with loopback-only account hosting; leave firewall unchanged.
- [x] Add SQLite account storage, hashed passwords, protected sessions and explicit revision-checked snapshot sync.
- [x] Add account UI and pre-download local backup.
- [ ] Choose HTTPS hosting and production authentication/recovery strategy for actual cross-device sync.
- [ ] Complete server-side event schema validation, automated auth/sync security tests, recovery/deletion flows and deployment review.


## Sculpted popup and morphing pass

- [x] Redesign Event, Capture, Search and Workspace preference panels with a shared glass header and clearer grouping.
- [x] Add interaction-driven liquid sigils, focus surface morphs and button corner changes alongside the existing highlights.
- [x] Move optional event notes/repeat controls into a disclosure while preserving saved values.
- [x] Inspect desktop Event and phone Capture frames; correct header spacing and preserve reduced-motion behavior.
- [ ] Review actual iPhone/Firefox form entry, native time/date pickers and keyboard interactions before release.

- [x] Sidebar-inspired top command tabs; running timer wave tracks; original WebGL ribbon constellation with satellites and orbital arcs.
- [ ] Review the new sculpture and running waves on physical iPhone and Firefox before release.

- [x] Reserve popup header space and strengthen borders.
- [x] Derive five-stage orbit evolution from saved courses, unique events, tasks, completed steps and focus time; apply to My Day, Atlas and companion UI.
- [ ] Review popup layout and orbit growth on Firefox and phone before release.

- [x] Unique task artifacts and transparent Atlas assignment titles.
- [x] Repeating assignments with daily targets, outside-timer logging and linked focus history.
- [x] Connected Orbit companion browser mini-window.
- [ ] Validate practice/date rollover and companion controls on Firefox and phone.
- [x] Package an OS desktop companion for always-on-top behavior (Orbit Windows personal build; see desktop verification report).

- [x] Review-popup body insets and old overlapping ornament cleanup.
- [x] Distinct exams, one test date, daily preparation visibility, and decreasing study budgets.
- [x] Precession, nutation and depth motion for the 3D eclipse, with an orbital fallback.
- [ ] Review exam budgets and popup spacing on desktop and phone before release.
