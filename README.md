# Orbiter

A study planner with a Windows Tauri application, floating companion, browser workspace and account sync, plus a SwiftUI/WebKit iPhone wrapper. Root `Application.html` is the application source of truth.

## Start here

- **Working on the project:** read [AGENTS.md](AGENTS.md), then the applicable [workflow section](docs/agents/WORKFLOW.md).
- **Continuing from another chat:** read the [current checkpoint](docs/agents/CHECKPOINT.md) and recheck repository status.
- **Using Windows Orbiter:** see [desktop operating instructions](desktop/README.md).
- **Accounts and hosting:** see [private beta setup](docs/PRIVATE-BETA.md).
- **Windows updates:** see [update and release instructions](docs/UPDATES.md).
- **iPhone signing and delivery:** see [TestFlight setup](docs/TESTFLIGHT.md).

Release-document filenames and commit titles are historical labels, not proof of the installed version or publication. Compare manifests and the actual artifact before a release.

## Local browser preview

Use the existing project server when one is already running. In VS Code, **Tasks → Run Task → Preview Scheduler** serves port 8002. Alternatively, from this folder in PowerShell:

```powershell
python -m http.server 8002 --bind 127.0.0.1
```

- [Application](http://127.0.0.1:8002/Application.html)
- [Fictional planner preview](http://127.0.0.1:8002/design/scheduler-ui-preview/)

This static preview is distinct from the account-development server and installed desktop application. Browser storage belongs to its exact origin/profile; changing ports does not move existing study data. The fictional preview is separate from the real workspace.

## Source map

| Path | Purpose |
| --- | --- |
| `Application.html` | Canonical planner UI and integration |
| `src/mascot/`, `src/pond/`, `web/` | Shared companion, pond, rewards presentation, motion and account UI |
| `desktop/src-tauri/`, `desktop/ui/` | Windows native authority, persistence, buddy and updater |
| `Scheduler/`, `Scheduler.xcodeproj/` | iPhone wrapper and generated application bundle |
| `design/` | Concepts, reference studies, visual history and fictional preview |
| `scripts/` | Existing build, generation, development and verification utilities |
| `docs/agents/` | Workflow routing and compact project handoff |
| `build/` | Ignored generated assets, diagnostics and local packages |

## Regenerate after implementation

With existing development dependencies installed, from the project root:

```powershell
npm.cmd run build:core
npm.cmd run desktop:prepare
```

The first command embeds shared modules and regenerates iPhone/preview copies; the second prepares Windows assets. Do not repair only a generated copy. Packaging uses the existing combined release script described in [Windows updates](docs/UPDATES.md), which already performs these steps.

## Data and verification

The native timer, rewards and growth records are authoritative in Windows. Account sync and browser-only operation have separate capabilities; see [beta documentation](docs/PRIVATE-BETA.md). Preserve `com.kgsato.orbit`, study data, storage keys, identities and ownership. Back up real data before an authorized import or installation.

Use task-specific evidence. A rendered browser page does not validate installed Windows behavior, and a local installer does not establish a published update. Follow the [verification routing](docs/agents/WORKFLOW.md#verification-routing) and consult release-specific reports for their exact scope and remaining gaps. Historical verification is not acceptance evidence for later changes.

Source edits stay local and uncommitted for review in VS Code. Commit, push, merge, install, deployment and publication are separate authorized actions.
