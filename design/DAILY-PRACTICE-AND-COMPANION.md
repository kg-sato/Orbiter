# Daily practice and Orbit companion

Unique task artifacts derive from each immutable task id, so edits keep the same object. The Atlas title bars are removed; keyboard focus outlines remain for accessibility.

Repeating assignments: daily, weekdays or weekly from the start date. Target defaults to 60 minutes. One saved task persists rather than spawning duplicate tasks. Completed task-linked focus sessions count toward that date; manual outside-timer logs are stored independently and can be corrected in the assignment editor. Keep up to 366 manual dated logs. Turning repetition off preserves its logs. Seven-day totals and a daily target appear under Assignments > Daily practice. Missing a day does not create overdue debt. Existing task records and backups remain valid. New repeat metadata is validated on import and travels in exports and account snapshots. The completed-focus weekly goal still counts timer sessions only, avoiding misleading manual-focus claims.

Orbit companion is a separate small browser window opened from Workspace > Open Orbit companion. An original eclipse character reacts to the running timer, accepts a harmless spark interaction, displays today's tracked minutes and the growth stage, and provides timer controls and recurring-project intentions. The main app remains the authoritative timer and data owner. Same-origin postMessage messages require the exact opener/window reference and a per-opening token; no passwords, account state, full backups or storage access enter the companion. Preview and real sessions use separate window names. Research: https://developer.mozilla.org/en-US/docs/Web/API/Window/open and https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage .

Limits: browser popup controls and window placement vary; not always-on-top, transparent desktop integration, or global keyboard/mouse tracking. Scheduler must remain open; closing it disconnects the companion. Native iPhone wrapper does not open the desktop companion. A packaged desktop wrapper is required for a persistent OS buddy. No scheduled startup or OS installation was performed.

Build/source review only. Interaction, popup permissions, date rollover and physical device review remain pending.

Use the companion through a local HTTP server or HTTPS deployment. Direct file URLs cannot reliably enforce same-origin companion messaging and show an explanatory message instead.
