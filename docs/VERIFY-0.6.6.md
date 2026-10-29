# Orbiter 0.6.6 delivery verification

Verified 2026-10-28 on Windows, from the final source in the `codex/stillwater-0-6-6` worktree. This report records local package verification and source checks, not installation or release publication.

## Artifact

- Installer: `build/release/Orbiter_0.6.6_x64-setup.exe`, **4,403,643 bytes**.
- SHA-256: `16c3241d911096a77682d17f4e3a5a64cb90f3a3b21282a3cd1c71fc28f699db`.
- Companion files: versioned `.exe.sig`, `latest.json`, `SHA256SUMS.txt`, and matching `Orbiter Setup.exe` alias.
- Actual application and installer ProductVersion/FileVersion: **0.6.6**. Source manifests, including both iPhone marketing fields and the application Cargo-lock entry, agree.
- Native identifier remains `com.kgsato.orbit`; original updater public key is unchanged.

## PASS

- Full core build, native frontend preparation, optimized Rust/Tauri build and NSIS installer creation using the original updater signing key. No dependency installation or key replacement.
- Cryptographic installer-signature and trusted-comment verification, key continuity, tamper rejection, manifest signature/URL/notes, checksums and installer alias equality.
- Final native shell, buddy CSS, reward CSS and every generated HTML inline script/style verified inside compressed assets embedded in the actual application binary. The new kitten GLB is embedded by the bundled renderer in those checked blocks.
- All 92 frozen runtime/build/release inputs unchanged through packaging. Ignored evidence: `build/package-inputs-0.6.6.json` and `build/release/verification-0.6.6.json`.
- Final 0.6.6 discovery-preview, chest-opening and cloud-browser suites, two generator regressions and iPhone source/bundle/version checks. Fixtures use fictional authority and intercepted HTTP, with no real email or account writes.
- Equipment/cosmic and avatar-cache checks passed against the final artwork before the metadata-only version bump. Fixed-identity turnarounds, all ear/coat variants, representative growth and Petal Bow fit plus phone/buddy result typography were inspected during implementation.

Windows Authenticode status is **NotSigned**, distinct from the verified updater signature. No installed upgrade, running-app replacement, physical iPhone/VoiceOver, live cloud reconciliation or whole-process resource claim is made. The Windows binary was not launched for verification, avoiding single-instance interference with study sessions.

## Scope and reproduction

Source changes include actual discovery portraits, the selected moonlit-storybook kitten/text, Petal Bow and matching fallback, recoverable browser enrollment, and version 0.6.6. The separate local Obsidian vault is not included as a repository/binary payload.

The normal packaging script now honors the existing `ORBITER_NODE_MODULES` dependency-reuse setting, as core builds already do. From PowerShell with a matching existing dependency installation and the original key:

```powershell
$env:ORBITER_NODE_MODULES = 'C:\Users\kgsat\Documents\Scheduler\node_modules'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build_update.ps1 -SigningKey C:\Users\kgsat\Documents\Scheduler\.release-keys\orbiter-updater.key
```

Do not regenerate a signing key or overwrite published versioned assets. Review release notes and artifact identity for each build. Choose **Quit Orbiter** from the tray before a separately authorized manual installation; × leaves it running. Creating/pushing this PR does not merge it or publish the stable update feed.
