# Orbiter working workflow

Read the relevant sections for the task. This is a project supplement to the active personal guides, not a requirement to run every command.

## Start and finish with evidence

1. Inspect status, staging, current branch and the relevant diff. Identify the affected surface: demo, canonical HTML, generated native HTML or installed application.
2. Turn the request into a small brief: expected behavior, owned files, constraints and observable success. Resolve routine choices from source; ask only for consequential unknowns.
3. Use the matching Orbiter skill. Delegate bounded independent reading or verification when useful and authorized. Keep tightly dependent edits sequential; do not create workers merely to repeat exploration.
4. Reproduce before changing a visual failure. Make one scoped repair, regenerate affected outputs, and inspect the actual result before packaging.
5. Use the smallest applicable verification within the user's authorization and higher-priority instructions. Inspect check scripts first: some write images into design history or launch native single-instance processes. Use fictional data and disposable profiles.
6. Finish with the result, evidence, usable artifact if requested, and material gaps. Update the checkpoint when a decision or remaining blocker would otherwise be lost.

Do not repeat a successful build or check without a relevant source change or unresolved concern. Investigate failed checks before retrying. During a running command, wait on its session rather than launching another copy; send meaningful progress updates, not repeated unchanged status.

## Source and generation

| Location | Role |
| --- | --- |
| `Application.html` | Canonical planner HTML and application integration |
| `src/mascot/`, `src/pond/`, `web/` | Shared renderer, pond, rewards presentation, transitions and account UI modules |
| `desktop/src-tauri/src/` | Native commands, database, timer, rewards, growth and sync authority |
| `desktop/ui/` | Native adapter, shadow-root buddy, updater UI and scoped styles |
| `Scheduler/Application.html` | Generated iPhone application copy; preserve wrapper assets |
| `design/scheduler-ui-preview/` | Generated fictional planner preview |
| `design/living-pond/` | Artwork/motion study; its transition module imports the production controller |
| `build/native/`, `build/release/` | Ignored native frontend and local installer artifacts |

From the Scheduler root in PowerShell, when regeneration is in scope:

```powershell
npm.cmd run build:core
npm.cmd run desktop:prepare
```

`build:core` compiles and embeds shared modules and syncs the iPhone and fictional preview HTML. `desktop:prepare` creates the native frontend. Finish source edits before the final build; changes made during compilation make artifact provenance uncertain. Existing scripts and their current outputs take precedence over remembered paths.

## Lessons that must survive this chat

- **Motion:** inspect early, middle and settled frames. `display: contents` wrappers have no painted box to clip; reveal actual cards. Opaque panels, top-layer dialogs and shadow-root grid rules require checking actual stacking and geometry. Do not cancel on harmless queued scroll events. Keep one shared demo/application controller, immediate popup input, interruption cleanup and reduced-motion fallbacks.
- **Artwork:** preserve identity separately from equipment. Check full forehead and face coverage, all affected growth stages, actual buddy size and paused silhouettes. Report the exact implemented reward subset; a catalog description does not prove its artwork exists.
- **Installed UI:** a file served at a different origin has different browser storage. Browser HTML, native-mode fixtures and the installed EXE are separate evidence sources. A stale tray process or old binary can show different artwork; inspect before diagnosing.
- **Packaging:** compare manifest and binary versions with commit/tag labels. Keep the original updater key private and the native identifier unchanged. Updater signing is distinct from Windows Authenticode. Never overwrite published versioned assets or interpret a local manifest as a live update feed. Tray **Quit Orbiter** exits; × leaves the process running.
- **Release writing:** inspect actual changes against the requested boundary. Separate plans, approved production work, generated copies and local artifacts. Writing copy never authorizes Git or publishing actions.

## Verification routing

| Change | Relevant evidence; select only what applies |
| --- | --- |
| Motion | Moving demo and actual HTML, real card visibility, rapid navigation, keyboard input, Escape, phone/buddy sizes, reduced motion; existing `scripts/test_lake.cjs`, `test_island.cjs`, `test_unified.cjs` |
| Avatar/equipment | Live and static views, preview/Cancel/Equip, identity and growth fit; existing `scripts/test_cosmic.cjs` |
| Native state | Relevant Rust tests and disposable data; inspect native startup/single-instance behavior before running an executable |
| Packaging | Final-source build, actual binary and manifest version, installer path, checksum and updater signature; separately identify installed upgrade/live-feed checks |
| Documentation | Local links, referenced scripts/paths, factual statements against current source, final diff scope |

Read scripts before executing them and honor the active validation scope. Browser frame timing is not native startup, whole-process CPU/RAM or Windows scaling evidence. For a reported installed-app bug, name any missing installed-app reproduction instead of claiming it is verified.

## Documentation ownership

- Root `AGENTS.md`: stable constraints and task routing.
- This file: recurring project workflow and demonstrated pitfalls.
- `CHECKPOINT.md`: changing state, unresolved decisions and next steps; date updates.
- Existing release/verification documents: historical evidence for their exact revision.
- `design/`: visual proposals and review history.

Keep new guidance short and place it once. Do not delete older evidence as bulk cleanup, copy this transcript into instructions, store credentials, or promote old plans into current requirements.
