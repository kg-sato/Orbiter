# Orbiter

A study planner with a small companion to keep you company while you work. Plan your week, manage assignments and tests, keep course notes, and turn focused study into growth for your kitten and its pond habitat.

**Current source version: 0.6.1.** Orbiter includes a Windows application, a browser workspace with optional private-beta accounts, and a prepared offline iPhone wrapper. These have different capabilities and verification status.

## What you can do

- **Today, Study, Health and Life:** move between the planner, a separate optional browser journal and a focus sanctuary. Manual journal records and imported observations remain separate from native study rewards. The iPhone journal and Apple Health connection are source-prepared but disabled pending device validation; account journal sync is not connected in this checkout.
- **My Day:** see your schedule, choose a study intention, capture tasks and start a focus session.
- **Assignments, tests and daily practice:** track deadlines, preparation and recurring study work.
- **Atlas:** organize course notes and keep a distinct companion identity for each course.
- **My Rhythm:** arrange study time and review your week.
- **Focus:** start, pause, resume and finish sessions; review credited time and companion growth afterward.
- **Discoveries:** earn cosmetics through native Windows focus, preview equipment and build your companion's collection.
- **Companion field guide:** open it from the Study focus panel to choose a main/course kitten, inspect three portrait angles, preview all four growth stages and see native growth/equipment details. Previews do not change earned progress.
- **Seven-day rituals:** in Life, review and update each habit over the seven days ending on the selected journal date. History uses existing journal records and preserves drafts and earned progress.

The interface uses a blue pond with koi, lily pads and moving mist. Tidal Night, Lunar Mist and Opal Dawn provide different lighting. Appearance controls include accent, material, atmosphere, motion intensity and graphics quality, with reduced-motion and static fallbacks.

A separate [lightweight companion trial](design/companion-lite/README.md) compares Blender-rendered sprite playback with the current live scene. It includes measured results and a local preview; the application's default renderer remains unchanged.

## Choose your version

| Surface | Current behavior |
| --- | --- |
| Windows | One native app with a full planner and compact floating buddy. Rust/SQLite own the timer, rewards, growth and local persistence. Optional account sync and a paired browser are separate connection paths. |
| Browser | Planner and local browser storage; hosted private-beta accounts can connect supported workspace data. Browser-only study history does not replace native Windows credit authority. |
| iPhone | Prepared offline SwiftUI/WebKit beta with study storage, Files transfer and optional local reminders. Protected journal and Apple Health sources remain gated off; account sync is unavailable. Earlier simulator smoke checks passed, but the newer native journal/Health source still needs Apple SDK compilation and physical-device validation. Local Xcode development is the current target. |

### Windows companion

The compact buddy defaults to **420 × 220**, with supported sizes from **360 × 200 to 560 × 300**. Open the full planner from the kitten or planner icon, and return to the buddy without losing the running timer or planner drafts.

The current compact controls use SVG icons and a filled Start/Pause/Resume button. Start and Resume send a dew-light arc into the pond. Native session completion opens a lily-and-starlight celebration before the session recap. Calm, quiet, reduced-motion and zero-motion settings suppress that decoration.

See [Windows use and installation](desktop/README.md).

### Browser preview

Use the existing project server if one is already running. In VS Code, choose **Tasks → Run Task → Preview Scheduler**, or run this from the repository root in PowerShell:

```powershell
python -m http.server 8002 --bind 127.0.0.1
```

Open the [planner](http://127.0.0.1:8002/Application.html) or the [fictional preview](http://127.0.0.1:8002/design/scheduler-ui-preview/).

Browser storage belongs to the exact address and browser profile. Changing ports does not move saved data. This static preview does not enable hosted accounts or validate the installed Windows app. See [private-beta accounts and hosting](docs/PRIVATE-BETA.md) for that setup.

## Data and installation

Windows saves its workspace, timer, growth, inventory and settings locally. JSON import/export transfers study data; it does not grant native reward balances. Back up your workspace before replacing data.

A source update does not replace a running app. Save your work and choose **Quit Orbiter** from the tray before installing a new Windows build; closing the window leaves it in the tray. Avoid launching older portable copies alongside the installed app because they share its single-instance identity. The repaired installer checks for those copies before replacing application files.

Local installers and signed updater files are generated under ignored `build/` directories. They are not included in a Git clone, and building them does not publish an update. See [Windows update delivery](docs/UPDATES.md).

## Development

Root `Application.html` is canonical. Shared renderer and presentation modules are embedded into it by the existing build scripts; generated copies should not be edited directly.

With project dependencies installed, run from the repository root in PowerShell:

```powershell
npm.cmd run build:core
npm.cmd run desktop:prepare
```

The first command embeds shared modules and regenerates the offline iPhone and fictional preview copies. The second prepares the Windows frontend. Native development, build prerequisites and focused checks are described in [desktop/README.md](desktop/README.md#development).

To reuse an existing matching dependency installation in a worktree, set `ORBITER_NODE_MODULES` to its absolute `node_modules` path before those commands. For this computer in PowerShell:

```powershell
$env:ORBITER_NODE_MODULES = 'C:\Users\kgsat\Documents\Scheduler\node_modules'
npm.cmd run build:core
npm.cmd run desktop:prepare
```

This reads the existing packages without copying or installing them. Keep their versions aligned with this checkout's lockfile. Unset the variable to use this checkout's own dependencies. Browser regression scripts can use `NODE_PATH` pointing to the same folder.

| Path | Purpose |
| --- | --- |
| `Application.html` | Canonical planner UI and integration |
| `src/study-core.ts` | Shared study logic |
| `src/mascot/`, `src/pond/`, `web/` | Kitten, equipment, pond, motion and browser/account modules |
| `desktop/ui/` | Compact buddy, native planner adapter and updater UI |
| `desktop/src-tauri/` | Native timer, SQLite persistence, windows, rewards and sync |
| `Scheduler/`, `Scheduler.xcodeproj/` | iPhone wrapper and generated offline bundle |
| `design/` | Reference studies, review notes and design history |
| `scripts/` | Generation, packaging and verification tools |
| `build/` | Ignored generated frontends, captures and local installers |

## Project guidance and verification

The [current cycle](docs/agents/CURRENT-CYCLE.md) defines evidence-based optimization and cleanup while preserving existing product and workflow preferences.

- [Project instructions](AGENTS.md), [working workflow](docs/agents/WORKFLOW.md) and [current checkpoint](docs/agents/CHECKPOINT.md).
- [Compact buddy design and test scope](design/compact-buddy/README.md).
- [iPhone preparation and remaining TestFlight steps](docs/TESTFLIGHT.md).
- [Current iPhone development: local Xcode workflow](docs/XCODE.md).
- [Protected life-storage foundation and disabled capability contract](docs/NATIVE-LIFE-STORE.md).
- [Prioritized iPhone acceptance: notifications, device, Files, VoiceOver](docs/IPHONE-ACCEPTANCE.md).
- [Offline iPhone privacy-policy draft](docs/IPHONE-PRIVACY.md).

The compact UI passed browser tests against generated native HTML, including 18 size/state combinations, overlap and pointer checks, focus feedback and reduced-motion completion. Local Windows packages have also passed version, checksum and updater-signature checks. These results do not establish an installed upgrade, real native timer expiry, physical-monitor scaling, live cloud reconciliation or iPhone device behavior. Keep those checks separate when preparing a release.
