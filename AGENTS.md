# Orbiter project instructions

Orbiter is a study planner with a Windows Tauri buddy, browser account sync, and an iPhone wrapper. Use this Scheduler checkout as the main integration workspace in VS Code.

## Boundaries

- Leave edits uncommitted and preserve the user's staging. Commit, push, merge, pull requests, installation, deployment and publishing require the applicable explicit authorization.
- Root `Application.html` is canonical. Edit shared `src/` and `web/` modules where applicable, then regenerate embedded content and application copies. Never fix only generated HTML.
- Preserve study data, browser storage keys, cat identities, inventory, reward rules, native timer authority and the native identifier `com.kgsato.orbit` unless an explicit task changes them.
- Keep design concepts and reference studies in `design/`; put disposable logs, captures and build output in ignored `build/`. Preserve historical design evidence.
- Define observable success before work, inspect the final result, and distinguish verified outcomes from remaining gaps. A build is not an installed-app check.

## Read on demand

- Before implementation, debugging, design or packaging: [project workflow](docs/agents/WORKFLOW.md).
- At a fresh chat, handoff or release: [current checkpoint](docs/agents/CHECKPOINT.md). Recheck changing facts against the repository. Start with this compact handoff instead of importing the old conversation or reading every release/design document.
- For setup and source locations: [README](README.md).
- Apply the personal Codex-home guides supplied by the active instruction chain; do not duplicate them here. Keep instruction maintenance in this main chat. Follow the active orchestration guide for focused implementation work, subject to tool availability and these project boundaries.

## Task skills

Use the matching installed skill and read its `SKILL.md` before its workflow:

| Task | Skill |
| --- | --- |
| Pond, popup or navigation animation | `orbiter-motion-review` |
| Kitten, cosmetics or habitat artwork | `orbiter-companion-art` |
| Local EXE or updater packaging | `orbiter-package` |
| Commit message or release notes | `orbiter-release-writing` |

Load only relevant guides and skills. If a required skill is unavailable, report that and use the project workflow as the documented fallback; do not claim the skill ran.
