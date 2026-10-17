# Shoreline interaction polish

The initial faint popup rings described below are superseded by the shared [water-to-glass controller](lake-transitions/README.md). Its moving preview, integration checks and resource limits are documented in that folder.

Implemented locally after the published 0.5.0 release. No version bump or new release was published for these edits.

- Assignments now shares the enclosing glass panel, heading/action spacing and inset cards used by Upcoming Tests and Daily Practice. Deadline grouping and completion controls remain functional.
- Updates has a dedicated, keyboard-accessible startup checkbox row with a stable 22px check and generous label target, instead of inheriting full-width field styles.
- General dialogs expand to 820px; profile settings to 1060px and weekly review to 900px, constrained to the viewport. Small screens stack settings into one column.
- Profile adds initials, actual tracked focus, Atlas course count and the saved weekly goal. Personal and study-hour settings sit side by side; appearance controls retain Apply/Cancel and use a larger preview.
- Ordinary popup openings use a short rising-water motion and two faint spreading rings. The decoration ends automatically, never intercepts input, and clears on keyboard input, close, resize, hidden pages and mode changes. Reduced motion skips it. Existing major-scene and weekly-review waves remain separate.

`web/shoreline.css` is embedded by `scripts/build_core.py`; root `Application.html` remains canonical. Application copies and desktop assets were regenerated. Browser interaction inspection confirmed the profile opens for a legacy workspace without a courses array and fits the inspected viewport without horizontal overflow. Browser screenshot capture was unavailable, so full visual comparison and native Updates rendering remain to be reviewed. No automated test suite was run for this change.
