# Open Scheduler as its own window

The existing manifest.webmanifest uses display: standalone and starts at Application.html.

## Firefox on Windows

Open the real workspace URL (not design/scheduler-ui-preview), then use the web-app button in Firefox's address bar. Firefox creates a Start-menu shortcut and an independent window; pin it to the taskbar if desired. This requires Firefox 143+, or 150+ for the Microsoft Store version. See https://support.mozilla.org/en-US/kb/web-apps-firefox-windows .

## Edge

Open the real workspace URL, then choose Settings and more > More tools > Apps > Install this site as an app. See https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge .

## Current limits

Local URLs still depend on the local server when loading uncached resources or using account sync. Keep the same browser profile and origin to retain the same local workspace; changing browsers or ports requires Export/Import. An installed window does not provide production cloud syncing.

A packaged desktop installer is a separate next step: bundle the frontend in a desktop webview and define its storage/update/backend behavior. The existing SwiftUI/WebKit iPhone wrapper is separate and still requires native release validation and signing.
