# Folder cleanup — 17 October 2026

Removed 22.24 GiB of generated Rust compiler caches from the default native target and the older `build/desktop-target-031` and current `build/desktop-target-040` targets. Removed 12 unpublished 0.6.0–0.6.5 trial installer/signature files from `build/release`.

Kept the current 0.5.0 installer, updater signature, manifest, checksums, launcher installer alias, production executable, website package, and 0.4.2 rollback installer. Existing packaging bundle directories remain available to `scripts/prepare_update.py`.

Kept application sources and generated application copies, editable Blender artwork and design history, performance evidence, dependencies, private signing keys, local profiles, and data. Portable Blender tooling remains available for model editing. No production code was removed on an assumption of being unused.

The next native build recompiles dependencies and takes longer. Use the existing `scripts/build_update.ps1` workflow with the original signing key to rebuild signed update artifacts. Nothing was committed, uploaded, or published by this cleanup.

## Updating an installed copy

A local commit does not activate updates. The installed updater reads `https://github.com/kg-sato/Orbiter/releases/latest/download/latest.json`. Publish a GitHub release with the versioned installer and matching `latest.json`; retain the signature and checksum files alongside them. Review and commit the source before tagging the release so its code can be reproduced. Publishing remains a separate action.

An installed 0.4.2 can update to 0.5.0 once those assets are published. A local experimental 0.6.x install needs the manual 0.5.0 installer because automatic updates do not downgrade versions.
