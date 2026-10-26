# Lightweight companion trial — 2026-10-26

The user approved one pre-rendered kitten animation plus a still pond, compared with current live 3D, before deciding on a broader conversion. This is an isolated design/performance study. It does not change the default application renderer, planner storage, native rewards, growth or equipment.

## View locally

From the Scheduler root in PowerShell:

```powershell
python scripts/prepare_companion_trial.py
python -m http.server 8014 --bind 127.0.0.1
```

Open [the trial](http://127.0.0.1:8014/design/companion-lite/index.html?mode=lite). The two mode links reload into either sprite playback with a still pond, or the current production cat/pond bundle. The production bundle is extracted into ignored `build/companion-lite/live-cat.js`; only its last-cat storage key is namespaced to the trial. No planner workspace is loaded. A port-8014 local preview server was started for this review; reuse it if still running.

## Assets and reproduction

`assets/kitten-idle.webp` is a horizontal lossless WebP strip: 16 transparent 192×192 frames, 8 FPS, 2-second loop, 3072×192 overall, **215,726 bytes**, **2.25 MiB decoded RGBA**. CSS steps through it; it does not load Three.js, the GLB or a WebGL scene in lite mode. CSS image compositing still has a graphics/memory cost. Offscreen/hidden playback pauses and reduced-motion settings show a still frame.

The original kitten GLB was imported read-only into Blender 5.3 Beta and rendered using Cycles CPU at eight samples. `render_trial.py` selects ear variant 0, uses the original Blink morph and adds a small periodic breathing/head motion. It changes no original model or blend file. The manifest records source/asset hashes, render conditions and limitations. Pillow verifies lossless packing, all 16 distinct frames, alpha bounds and an unclipped silhouette.

To reproduce, run the installed Blender executable with `--background --factory-startup --python design/companion-lite/render_trial.py -- --frames-dir build/companion-lite/frames`, then `python design/companion-lite/render_trial.py --pack --frames-dir build/companion-lite/frames`. Blender and Pillow are authoring tools only; playback does not need them.

**Scope:** one neutral identity, view and authored stage, without runtime scarf, charm, procedural coat paint, earned cosmetics or growth variations. It is not a pixel-identical visual replacement for the runtime kitten. Converting the complete identity/equipment library requires additional artwork and a bounded caching/layering plan; a giant atlas of every combination would waste memory.

## Measured comparison

`scripts/test_companion_trial.cjs` runs three alternating paired trials, each in a fresh headless Edge process with the same 1366×900 viewport, device scale 1, 3-second warmup, 6-second sample and identical small scripted interactions. It records CDP page metrics, process churn, graphics backend and production renderer stats. Local intercepted origins prevent account/network activity. Phone geometry is also checked at 390px; reduced-motion playback is checked.

Hardware/backend observed: **NVIDIA RTX 4060 Ti, ANGLE Direct3D11**, Edge 156.0.4314.42. This is not a low-end-device or installed-app benchmark.

| Median of 3 samples | Sprite + still pond | Live 3D + pond |
| --- | ---: | ---: |
| Application WebGL contexts | 0 | 1 |
| JavaScript heap used | 1.77 MiB | 12.56 MiB |
| Main-thread task time over ~6 s | 95.9 ms | 208.9 ms |
| 95th-percentile timer delay | 4.7 ms | 3.7 ms |

The trial lowers measured heap and main-thread work. Both variants remained responsive; these samples do not show improved input latency. Heap excludes decoded image pixels, GPU textures and browser/native-process overhead. Some browser process IDs changed during samples, so the comparative aggregate CPU result was suppressed rather than treating incomplete counters as total CPU. GPU-process CPU and individual GPU frame samples are not overall GPU utilization. Battery, whole-app RAM, actual mobile and low-end-PC results remain unverified.

**PASS:** six scene runs, sprite/no-WebGL/no-3D-bundle assertions, button response, desktop/phone fit, reduced motion, atlas integrity and original model hash. Actual stills and blink frame inspected. Raw comparison and captures are under ignored `build/companion-lite/`; earlier incomplete process CPU values remain in raw per-run data with the explicit churn flag and must not be used as comparable totals.

A separate local-preview playback check captured open-eye and blink frames at controlled animation times; Pillow confirmed different decoded browser pixels. Offscreen pause/resume and reduced-motion checks passed while the lite page retained zero WebGL contexts. The timing probe above measures timer scheduling and synthetic button activation, rather than physical input-to-paint latency.

**Recommendation from this trial:** continue with an optional lightweight mode and a small representative growth/equipment set, then measure it inside the full application on target hardware. Preserve full 3D as the current default until the complete identity/equipment and interaction behavior is ready and verified.
