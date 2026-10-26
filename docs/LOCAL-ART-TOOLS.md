# Local art tools — verified 2026-10-25

The user authorized evaluating tools under `C:\Users\kgsat\Documents\Roblox` for Orbiter. Read access worked; nothing in that folder was changed or copied into the application. These are developer tools, not shipped runtime dependencies.

## Applied improvement

Ran the existing `Blender/verify_export.py` read-only against `src/mascot/assets/kitten.glb` with the locally supplied Blender 5.3 beta. Blender reported 43 imported mesh objects, 20,080 object-instance triangles, one armature and the eight expected bones. The GLB has 42 mesh definitions and 20,000 definition triangles; object-instance and definition counts are different measurements.

Examining the asset and renderer exposed repeated scans of shared skin-weight geometry. `src/mascot/avatar.js` now caches the rigid-bone classification, preserving per-instance transforms, bone attachment and blended-weight fallback. Cache entries invalidate when attributes or their versions change; weak keys do not keep discarded geometry alive.

- PASS `node scripts/test_avatar_cache.cjs`: 38 skinned geometries, 10,272 vertices, 51,360 first-pass attribute reads, zero additional reads over 50 repeated geometry instances (2,568,000 reads avoided compared with repeated scanning). This measures eliminated work, not whole-app speed or FPS.
- PASS controlled headless browser/Pillow RGBA comparison: 31 pixel-identical portrait pairs covering four growth stages, coat/ear variants, side/three-quarter views and one equipped combination. Captures and comparison result are under ignored `build/tool-review/`.
- PASS `node scripts/test_cosmic.cjs`: asset loading, morph/budget checks, equipment preview/Cancel/locked behavior, preference persistence, responsive widths, reduced motion, all catalog entries producing distinct slot artwork, and invalid-asset fallback. Disposable captures moved to `build/cosmic-studies/`; Study navigation is explicit after the hub landing page.
- PASS full TypeScript, cat and cloud compilation plus production embedding, iPhone/preview regeneration and desktop preparation. Existing main-checkout dependencies matched declared versions (Three 0.186.1, TypeScript 5.9.3, esbuild 0.28.2, Supabase 2.117.3). A temporary build adapter in `build/tool-review/build.py` resolves those existing tools without installation or changes to production build scripts. A repeated full compile produced identical canonical/iPhone/preview/service-worker/cloud bytes.
- PASS generation and iPhone source/bundle/version checks. No installer, installation, device test, publishing or release action. Installed-process CPU/RAM and latency remain unmeasured.

## Tool availability and use

- **Blender:** the supplied executable is nested under `C:\Users\kgsat\Downloads\blender-5.3.0-beta+v53.32f5c9c48bca-windows.amd64-release\` twice. It ran headless outside the sandbox. Use this beta for read-only inspection until a concrete modeling/export task establishes compatibility with editable sources.
- **Pillow:** system Python imported version 13.0.0 successfully. Used for exact decoded-pixel comparison, with every RGBA channel tested independently.
- **Hunyuan3D:** its `.venv\Scripts\python.exe` exists but invocation failed because the referenced uv Python 3.11 executable is absent. Do not assume this environment works or repair/download it without an authorized need.
- **ComfyUI/FLUX and UI Kit:** files and local workflow notes are accessible. Their generation services were not launched or validated in this task. Roblox Luau UI modules do not run in Orbiter's web/Tauri renderer.

Do not import Roblox game instructions, data, visual assets or uploads into Orbiter automatically. Reuse a bounded process when it serves an Orbiter requirement. Check any third-party license before copying code/assets; the validator was executed in place without vendoring. Preserve the existing companion identity, economy, authority and motion preferences.

## Follow-up — 2026-10-26

Normal build scripts now support `ORBITER_NODE_MODULES` pointing at the existing installation; the temporary build adapter above is historical and no longer needed. Standard core build and desktop preparation passed with that option. Local Roblox `tools/video_sheets.py` requires OpenCV, which is absent from the checked system and ComfyUI runtimes. No environment repair was attempted. Existing browser recording/captures and image inspection verified the regenerated buddy UI instead.
