# Orbiter 0.4.2 · Connected orbits

**Your study space, connected. Your companion, easier to keep up to date.**

This release introduces account sync in beta, adds update controls inside the Windows app, and improves course management in Atlas.

## ✦ Across your devices

Connect the desktop app and website with the same account.

- **Email-link sign-in** — connect without creating another password.
- **Bring your workspace along** — choose how to connect existing local data to your account.
- **Keep working offline** — queue edits for synchronization when the connection returns.
- **Review conflicting edits** — resolve differences between devices before replacing your work.
- **Shared progress** — connected views can share study progress and discoveries.

> **Account sync is in beta.** Keep a workspace backup before connecting. Full desktop-to-website validation is still pending.

## ↗ Updates inside Orbiter

Find **Check for updates** in planner preferences or buddy settings.

- Read release notes before installing.
- See download progress and verify the package's updater signature.
- Enable optional startup checks; installation still requires your confirmation.
- Save open edits before proceeding. Orbiter pauses and persists the focus timer and creates a workspace recovery backup before starting installation.

> **One manual installation is needed:** install 0.4.2 to enable future in-app updates. The GitHub update feed must be published before checks can return releases. A live automatic upgrade has not yet been verified.

## 🐾 A clearer Course Atlas

- **Delete courses with confirmation.** Course notes are removed; linked tasks and calendar events stay as uncategorized items. Focus history and rewards are retained.
- **Keep the selected cat moving.** The selected course card uses the live animated 3D model. Other cards use cached portraits to limit rendering work.

---

## Install on Windows

1. Export a workspace backup, save your edits, and choose **Quit Orbiter** from the tray menu.
2. Download **[Orbiter_0.4.2_x64-setup.exe](https://github.com/kg-sato/Orbiter/releases/download/v0.4.2/Orbiter_0.4.2_x64-setup.exe)** from this release.
3. Run the installer and reopen Orbiter. Existing study data stays in its current application-data location.
4. To connect devices, open **Account & sync** and sign in using the same email on desktop and the website.

**Platform:** Windows x64 · Per-user installation · No Python or Node runtime required

<details>
<summary><strong>Release files and signing</strong></summary>

| File | Purpose |
| --- | --- |
| `Orbiter_0.4.2_x64-setup.exe` | Windows installer |
| `Orbiter_0.4.2_x64-setup.exe.sig` | Signature used by Orbiter's updater |
| `latest.json` | Version, release notes, and download information for the updater |
| `SHA256SUMS.txt` | Checksums for checking downloaded release files |

The installer is **not Windows Authenticode signed**. The updater signature is separate: it verifies that update packages were signed with Orbiter's release key.

</details>

## Feedback

Found an issue? [Report it on GitHub](https://github.com/kg-sato/Orbiter/issues), including your Orbiter version, what you were doing, and a screenshot when helpful. Leave private workspace data and sign-in links out of reports.
