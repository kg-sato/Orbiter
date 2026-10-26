# Optimization audit — 2026-10-25

Source base: `d7a8456`, clean detached checkout at intake; source manifests 0.6.0. Changes remain uncommitted. This is a first evidence-based pass, not a claim that all bugs or unnecessary features have been eliminated.

## Integrated findings

| Surface | Finding and change | Evidence |
| --- | --- | --- |
| Web timer | The hub rewrote unchanged text, controls and attributes every 500 ms. Compare before writing while preserving polling and native authority. | PASS `node scripts/test_life_timer.cjs`: unchanged polls produce zero writes; changed clock updates two labels; native state, visibility and recreated nodes covered. |
| Native timer | Failed completion persistence left an active expired timer and zero-delay retries. Delay repeated failed completion by one second, preserving rollback and initial expiry. | PASS `cargo test --offline --manifest-path desktop/src-tauri/Cargo.toml engine::tests::`: 26 passed, including injected SQLite rejection and recovery. Rust formatting passed. |
| Generation | Life-block reinsertion added six newlines per build, changing the service-worker version unnecessarily. Consume each block's trailing newline. | PASS `python scripts/test_generation.py`: actual generators in disposable fixtures produce stable bytes and ordered unique modules. External compilers are mocked in this regression. Original scripts fail both regression tests. |
| Preview | Cloud script and account CSS used paths relative to a nonexistent preview web directory. Rewrite shared web resource paths together. | PASS generation regression resolves external preview scripts/styles to existing files. |
| Guidance | Add linked current-cycle rules to active routing and workflow, retaining previous preferences and historical reports. | Reviewed additive documentation diff and local routing targets. |

## Final checks and artifact boundaries

- PASS existing `test_life_model.cjs`, `test_health_data.cjs`, `test_native_life_journal.cjs`.
- PASS `test_life_hub.cjs` against final generated HTML: CRUD/reload/export, draft and owner guards, import rejection, timer authority, responsive layouts and iPhone no-write. Sandbox Edge launch failed; the authorized outside-sandbox retry passed using a disposable profile.
- PASS `python scripts/check_iphone.py`: source/bundle and version checks only.
- PASS syntax and diff whitespace checks. No staging, commits, version bump, packaging, installation or publishing.
- Canonical, iPhone, fictional preview, service-worker hash and ignored native frontend were regenerated. Existing embedded cat/core compiler output was reused while actual changed shared hub sources were embedded by the production generator. Full `build:core` remains UNVERIFIED: this worktree has no `node_modules`; an attempt to reuse main-checkout tools compiled TypeScript but cat bundling could not resolve `three`. No dependencies were installed.
- Installed Windows behavior, whole-process CPU/RAM, physical iPhone behavior and live account reconciliation are UNVERIFIED.

## File waste and remaining coverage

### Preview handoff repair — 2026-10-26

The user reported generic fallback art appearing when inspecting items or selecting kitten views, then authorized further improvement after checking commit status. A failing-before/passing-after browser regression confirms the shared renderer now leaves a matching image of the actual kitten in its old host and returns the same canvas on Cancel. Snapshots are bounded to 240px and eight hosts, use a temporary released 2D buffer, and require no extra WebGL context or continuous loop. Scoped web and shadow-root CSS tolerates course-card replacement. Controlled captures show zero restored-image difference and a small downscaling difference for the parked image. Build/generation, equipment and Field Guide regressions passed. No installed/device performance claim is made.

The planned 01:55 commit had not occurred by the 11:35 Git check; its expired automation was paused. All source changes remain uncommitted pending a new commit instruction.

### Follow-up — 2026-10-26

- Integrated bounded native diagnostics (latest 100 entries, each 250 characters) and paired-browser save readiness/recovery cleanup with generation guards for concurrent rejected drafts. PASS `test_native_diagnostics.cjs` and `test_desktop_sync.cjs`; PASS 18 generated native buddy state/size and interaction regressions.
- Added optional explicit `ORBITER_NODE_MODULES` resolution in core/cat/cloud build scripts. Standard core build and desktop preparation now work against the existing matching main-checkout packages without a per-worktree dependency copy. This resolves the earlier missing-dependency compilation gap; no package installation or lockfile changes.
- Read-only local video tooling was inspected but OpenCV is absent from both system and ComfyUI Python environments; no installation attempted. Used the existing browser capture and Pillow/image inspection workflow instead. Actual buddy completion frame inspected after regeneration. The earlier geometry cache/Pillow checks remain valid because avatar source is unchanged in this follow-up.
- Commit authorization is the dated one-time action in `docs/agents/COMMIT-SCOPE.md`. Everything remains uncommitted until that scheduled attempt. Runtime resource, installed, live sync and physical-device boundaries remain unchanged.

Tracked files total roughly 60.4 MB. Large exact duplicates include editable/reference Blender and GLB assets and historical screenshots. Their purpose and preservation requirements do not justify deletion solely by hash. No tracked files or features were removed without evidence of obsolescence. No user data, keys, dependencies or local release artifacts were deleted.

Web/shared modules, native engine/UI, generators, tracked file sizes/references and active guidance received targeted inspection. This was not exhaustive verification of every module or feature. Additional observations needing reproduction before changes: native diagnostic history grows without a cap, a paired-browser successful save may leave an old recovery draft, and planner timer rendering repeatedly computes task/session summaries. These remain audit leads, not verified defects or completed fixes. Native resource profiling, live sync failure paths and device testing require their own representative environments and evidence.
