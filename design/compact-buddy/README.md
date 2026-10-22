# Compact buddy controls and focus feedback

2026-10-22. Implemented in `desktop/ui/native-shell.js` and `desktop/ui/buddy.css`; generated native frontend in ignored `build/native/`. No installer or installed-app change is established by this work.

## Research and original adaptation

- [Forest](https://forestapp.cc/) presents starting focus and earning a grown tree as a coherent visual progression. Use the same relationship between action and companion environment: accepted Start/Resume sends a short dew arc into the kitten's pool; native completion opens a lily and releases starlight. Preserve Orbiter's existing reward rules rather than copying Forest's tree/loss mechanics.
- [Things](https://culturedcode.com/things/features/) describes smooth transformations, clear structure and details revealed when needed. Give the primary action a consistent filled surface, use one family of drawn icons and keep timer text stationary. Completion decoration remains behind the kitten/controls; the existing recap follows afterward.
- These are observations from the official product descriptions and displayed product illustrations, not reverse engineering of their running app animations. Orbiter's artwork, timing and implementation are original. Comparable polish is a design aim, not a measured claim of product parity.

## Actual problem and correction

The recorded baseline at 360×200 showed both action/reward-row overlap and a collection-button/resize-handle collision. Its grid reserved 34px for a reward strip with a 44px minimum, while the timer stack needed additional space. The corrected compact grid reserves explicit header/footer space and fits the timer stack at the minimum height. The collection button leaves a separate resize lane.

Window actions, planner, start/pause, finish and collection controls now use consistent inline SVGs with accessible names. Header controls are 28×28px; primary/action controls are 32–34px high, fitting the native compact desktop window. These are compact pointer controls, not a claim of phone touch-target compliance. Long intentions/statuses truncate with full text available as a tooltip. Shared glass styles are explicitly overridden for readable dark primary text on the mint surface, including solid/quiet material modes.

## Motion and authority

Start/Resume feedback begins only after an accepted inactive-to-active native snapshot. Pausing or a rejected command does not produce a success animation. The browser's interpolated countdown reaching zero never grants rewards or triggers victory: a new native recap plus an active-to-stopped transition triggers the lily/starlight sequence. Duplicate snapshots and pending-to-confirmed reward updates do not replay it. The recap follows after the short celebration; reduced/zero motion shows the existing recap promptly without animated decoration.

No extra canvas, WebGL context, stored preference, timer rule or reward operation was added. Decorative nodes ignore pointer input and remain outside the grid. A soft mask clears the kitten's face/body while allowing the bloom to remain visible over the shared pond canvas. Pause, resize, hidden pages and planner/presentation changes clean them up. Quiet mode, calmer motion, OS reduced motion and zero intensity suppress the new animations; positive intensity scales their visibility.

## Verification

`scripts/test_buddy_focus.cjs` loads the actual generated native HTML with disposable browser profiles, intercepted local assets, fictional study data and simulated Tauri responses. It records baseline/final geometry and early/middle/settled animation frames. The matrix covers idle/running/paused states at 360×200, 360×300, 420×220, 520×260, 560×200 and 560×300, including long titles/reasons. Assertions cover pairwise button intersections, row separation, island bounds, pointer hit testing, primary colors, failed actions, local-zero versus native completion, recap deduplication, reduced-motion completion with duplicate updates, settings scrolling and mode cleanup. Existing island/unified tests provide neighboring discoveries, equipment, draft and mode coverage when run.

Review outputs are ignored under `build/buddy-focus/`: `baseline-layout.json`, `layout-results.json`, before/after screenshots, start/resume/victory frames and `buddy-focus.webm`. Test output is evidence for generated HTML with simulated authority; it does not validate the installed Windows binary, tray behavior, physical-monitor scaling or real native timer expiry. Those remain separate checks.
