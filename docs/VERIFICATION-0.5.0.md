# Orbiter 0.5.0 · integration verification

## Delivered locally

The approved blue pond now replaces the previous background in the complete application, not only the design demo. My Day, assignments, Atlas, My Rhythm, dialogs and the native planner retain their real controls and persistence. The buddy uses the same pond scene and native timer. Main scene, companion, identities, growth, equipped props and inventory remain in the existing architecture.

The source version is **0.5.0**, following the user's installed 0.4.2. Local 0.6.x versions were unpublished design iterations. `com.kgsato.orbit`, the existing updater public/private-key pairing, database path and browser storage keys were retained. No commits, publishing, deployment, installed-app replacement or production data migration were performed.

## Checks

- **33 Rust tests passed**: timer/recovery, credit/rewards, course attribution, migrations, import/history, recap atomicity and cloud behavior.
- Existing `test_unified.cjs` passed: browser identities, real navigation, theme controls, native reciprocal switching, drafts, timer mode, controls and sizing.
- Existing `test_refinement.cjs` passed: intentions, Apply/Cancel, stale saves, all accents/presets, phone layouts, selective waves, recap formatting, habitat growth and graphics fallback.
- Existing `test_island.cjs` passed: reward previews/equipment, growth, size handling and full-viewport wave behavior.
- `test_pond.cjs` passed against root Application.html: retired backdrop hidden, four real navigation destinations, live pond/mist time progression, cursor gust input, one context, Low/reduced-motion suspension, phone width and bundled fallback.
- The custom test initially assumed a fresh workspace already had a study object; that fixture assumption was corrected with optional empty-study handling, then the checks passed.
- Original integrated background motion was recorded in `design/releases/v0.5.0/pond-motion.webm`. Full-app screenshots are beside it. These use disposable test data, not the user's private workspace.
- `git diff --check` passed; line-ending notices were informational.

## Renderer and motion

One WebGL context renders both the pond and kitten. The pond output is copied into a lightweight background presentation canvas before the companion is rendered into the same WebGL canvas. Native shadow content receives its own background presentation canvas when active; it does not create another renderer.

The 128-square flow field covers the full pond with low-density mist. Cursor velocity transports/disperses density locally. The drifting detail moves faster than in the last prototype so motion is easier to perceive. Low quality, reduced motion, quiet mode and zero motion intensity keep it still. The settings panel explains that behavior instead of silently overriding accessibility preferences.

Auto begins conservatively and can reduce scene resolution without switching to a still; only explicitly selected Low does that. Rendering suspends when hidden, and webview destruction releases the native buddy graphics resources. Fallback backgrounds are compressed original art embedded in the application; no wallpaper download or new server is required.

## Native release measurements

Separate `com.kgsato.orbit.performance` executable and disposable profile directories; installed data and normal app processes were not reused. Twenty-second visible/tray process-tree samples; machine CPU normalized over logical processors. Memory is summed private bytes. These are indicative runs, not controlled statistical comparisons.

| View | Startup | Visible CPU | Private memory | Tray CPU | Tray memory |
|---|---:|---:|---:|---:|---:|
| Historical 0.4.2 buddy baseline | 1.311 s | 0.882% | 227.5 MB | 0% | 7.0 MB |
| 0.5.0 buddy | 3.346 s | 0.702% | 373.2 MB | 0.000% | 9.9 MB |
| 0.5.0 full planner | 2.754 s | 3.684% | 538.0 MB | 0.000% | 10.2 MB |

The buddy sample was 420 × 220 logical pixels. The maximized planner was 1920 × 1009 at 100% Windows scale. Both reported one WebGL context, the intended mode, no UI errors, and advancing native pond/mist diagnostics. Closing to the tray left a single native process. Raw evidence is in ignored `build/performance-050/{buddy-profile/buddy,planner-profile/expanded}.json`.

### Unmet targets and remaining gates

- **Visible memory exceeds the 200 MB target** in both modes. This remains a release-promotion limitation.
- **First buddy startup exceeds three seconds** by 0.346 s. The full planner sample meets that threshold; cache/run differences prevent attributing the difference solely to view size.
- Buddy CPU meets the <2% target; tray CPU meets <1%. The full planner exceeds 2% if that stricter buddy target is applied to it.
- GPU timing diagnostics are sampled queries, not frame averages or total GPU utilization. The prototype showed outliers; further profiling is still required before claiming a smooth worst-case GPU budget. No false GPU-performance pass is claimed here.
- Real-profile 0.4.2 upgrade/uninstall, physical lock/sleep, multiple monitors and all DPI scales remain manual validation gates.
- Hosted account-preference migrations, live multi-device/offline reconciliation and a published updater path remain separate live-release gates. No Supabase/Cloudflare/GitHub changes were made.

## Package and operation

Per-user x64 installer: `build/release/Orbiter_0.5.0_x64-setup.exe` (**4.37 MiB**). The initial PNG fallback package was 12.16 MiB; converting only the bundled static fallbacks to high-quality JPEG reduced it to 4.37 MiB without changing the live procedural scene. Editable/high-resolution design originals remain available.

Updater signature, latest manifest and SHA256 checksums were staged with the existing verification key. The installer is **not Authenticode signed**. No Python/Node/Blender runtime is required by the installed app. The private-beta website ZIP was regenerated but not deployed.

Save edits and Quit Orbiter from its tray menu before installing. Existing 0.4.2 users can use the normal installer. A user who installed an unpublished local 0.6.x build must manually run this installer, since the updater correctly will not offer a lower semantic version.
