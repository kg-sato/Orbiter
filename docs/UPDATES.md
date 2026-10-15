# Orbiter Windows updates

## Use

Install the updater-enabled Orbiter Setup.exe once. Planner preferences and buddy settings offer **Check for updates**. The update dialog includes an optional startup check (off by default), version, release notes, and **Download and restart**. Checks never install automatically.

Save and close editors before installing. Orbiter blocks installation while planner drafts remain. A failed download/signature check leaves the timer running. After verification, Orbiter pauses/persists focus and writes a JSON workspace backup under the existing application-data backups directory before launching NSIS. Resume focus deliberately after restarting.

The channel uses public GitHub Releases: `https://github.com/kg-sato/Orbiter/releases/latest/download/latest.json`. Until a release with that asset is published, the app reports that the feed could not be reached. A browser deployment does not update the installed Windows app.

## Release maintainer

The initial private signing key is in **.release-keys/orbiter-updater.key** (ignored by Git). Back it up securely outside this repository. Never upload it or key-generation logs to GitHub or Cloudflare. Losing it prevents seamless updates for existing installations. Its public counterpart is embedded in tauri.conf.json. This key is distinct from paid Windows Authenticode signing.

1. Keep package.json, package-lock.json, Cargo.toml, and tauri.conf.json versions aligned; increment the version for each published update.
2. Run `powershell -ExecutionPolicy Bypass -File scripts/build_update.ps1`. For a backed-up key, pass `-SigningKey <path>`. The script reads the signing key through the build environment, never prints its contents, and clears the variables afterward.
3. Review the generated installer and `build/release/latest.json`. Update release notes for the new version. Test the actual upgrade on a disposable profile with both old and new builds before promoting it.
4. In kg-sato/Orbiter, create a GitHub Release tagged `v<version>` and attach the **versioned installer**, its **.sig**, **latest.json**, and **SHA256SUMS.txt**. Save a draft while reviewing. Publishing a stable latest release activates the update feed; prerelease/draft releases do not supply this latest endpoint.
5. Keep the versioned installer name and manifest URL exactly aligned. Do not publish latest.json until the matching installer is uploaded. Never replace a version's signed installer with different bytes.

No GitHub publishing or credentials are automated. Source changes stay uncommitted. Native privileges are limited to bundled content; the website cannot invoke this updater. Verification of an actual published end-to-end upgrade remains required before calling the channel validated.

Reference: https://v2.tauri.app/plugin/updater/
