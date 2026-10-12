# Weekly event repeats

- Real calendars now start empty. Only unchanged legacy starter events are removed on launch; edited entries survive.
- Before cleanup, the prior workspace is saved under `scheduler.before-starter-cleanup` in localStorage. Persistence still rejects stale-tab writes.
- New event / Edit event exposes **Repeat every week** directly beneath Notes. Repeats keep the same weekday and time.
- Repeating edits and deletes apply to the selected week and saved future weeks. Earlier saved weeks stay unchanged.
- Turning repeat off retains the selected occurrence and removes the template and later saved copies.
- Optional `repeatFrom` stores the first Monday of a series. Older backups remain supported.
- My rhythm edits follow the same future-week behavior. The isolated design preview retains its fictional fixtures.
- Daily, monthly, custom interval repeats and series end dates are not included in this change.
- Build and formatting completed; interaction testing was not run.
