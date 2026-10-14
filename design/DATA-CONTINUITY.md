# Orbiter data continuity

## Current saving modes

1. Ordinary website: committed changes automatically save to browser localStorage under `week-by-week.schedule.v1`. Different origins, including different ports, have separate browser storage. Use the same browser profile and `http://127.0.0.1:8003/Application.html` for the previous local workspace. Do not clear site data while recovering it.
2. Orbiter desktop + paired website: native Rust persists changes to SQLite at `%LOCALAPPDATA%\com.kgsato.orbit`. Open the website through the Orbiter tray so pairing connects it to this shared database. This database survives browser closure and the Orbiter name change.
3. Account development server: the existing account database remains at `%LOCALAPPDATA%\Scheduler\server\accounts.sqlite3`. Account synchronization is separate from browser-local storage and native pairing.

## Recovery and recommended everyday use

- Restore the old origin in the same browser. Export a Scheduler/Orbiter JSON backup once the previous data is visible.
- Import that backup through Study Buddy Settings. Importing replaces the native study workspace and creates a pre-import recovery export; review before replacing any newer native work.
- Thereafter use Study Buddy and its tray-opened paired website for one shared automatically saved local workspace.
- JSON exports provide independent recovery copies. Current native backups are pre-import snapshots, not a complete automatic off-device backup service.

A purchased domain is not necessary for local automatic saving. Cross-device internet access requires a hosted backend, authentication, ownership rules and backups; a domain name alone provides none of those.

## Frozen-controls repair

The account server formerly computed inline CSP hashes only at startup. Source updates then caused browsers to reject the changed scripts. It now caches hashes by file modification metadata and refreshes them when public HTML changes, retaining hash-based script authorization. Duplicate local account-server instances were stopped before restarting one current instance at port 8003.

The old browser workspace has not been inspected directly or confirmed recovered. The native database and old account database exist; their existence does not prove browser-local data has been recovered.
