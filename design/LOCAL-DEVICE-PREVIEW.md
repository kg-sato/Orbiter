# Local hosting - updated security boundary

Run `npm run dev` from the Scheduler folder for accounts and SQLite sync.
Open http://127.0.0.1:8003/Application.html, then Profile > Account & sync.

The account server binds exclusively to 127.0.0.1. The earlier LAN listener was stopped. Firewall settings remain unchanged. Phones cannot connect to this loopback address; HTTPS hosting or a separately approved private-network setup is required first.

`npm run dev:lan` is retained for compatibility but now starts a **loopback-only static preview** without accounts. Do not run both on port 8003. Stop an interactive server with Ctrl+C. Restart the account server after rebuilding HTML because its Content Security Policy hashes are computed at startup.

The real application and fictional preview remain separate. Opening a server URL does not automatically copy schedules from a file URL or another origin: use the existing export/import tools once to migrate your local schedule. Data is never automatically uploaded at sign-in.

See ACCOUNT-SECURITY.md for implementation boundaries and the deployment backlog.


## Separate phone preview

Run `npm run dev:phone` to serve the public app files on this PC's current home-network address, 192.168.0.22, port 8004. Open http://192.168.0.22:8004/Application.html on a phone on the same network, or /design/scheduler-ui-preview/ for fictional sample data. Keep the PC awake. Stop a foreground server with Ctrl+C.

This static server has no account API and the UI blocks sign-in on non-loopback HTTP. No credentials or SQL database are exposed. Each device keeps separate browser storage. Account hosting remains at 127.0.0.1:8003. This does not enable HTTPS-only install/offline features or cloud sync.

The dev:phone command is bound to the current Ethernet address, not every network interface. If DHCP changes that address, update the command in package.json. Windows Firewall and guest Wi-Fi isolation may prevent access. No router port forwarding is required or intended; this is home-network preview access only.
