# Orbiter 0.4 interaction polish — October 14, 2026

- Centered the Discoveries close glyph and native window control glyphs with explicit grid alignment.
- Gave both Test creation buttons an intrinsic width, 94 px minimum, and no-wrap label.
- Weekly review retains precise stored focus but formats whole-minute labels; regenerated browser, preview and native copies.
- Redesigned exports as padded glass command cards with readable calendar options.
- Separated the buddy crate strip, Discoveries header and independently scrolling inventory.
- Grouped buddy settings into Focus, Appearance, Daily comforts, Companion and Workspace. Collection opens through its own action instead of filling settings with inventory.
- Shortened the full-viewport wave wipe from 1,050 to 620 ms; crate reveal wait from 650 to 420 ms. Accessibility motion overrides remain.

Design follows the previously reviewed reel's atmospheric, sculpted and bento direction; functional forms remain readable and keyboard accessible.

Validation: isolated browser/native-adapter UI suites passed, including decimal labels, Test width, export padding, settings grouping, reward/header separation, mode switching, drafts, and full-viewport wave coverage. Screenshots are generated under build/. These fixtures do not manipulate the installed application's database. Physical Windows checks and resource targets are not certified by browser fixtures.

Changes remain uncommitted. Account sync and GitHub release publishing are separate unfinished work.

Delivery: unsigned Orbiter 0.4.0 x64 per-user installer built successfully and copied to build/release/Orbiter Setup.exe. The running app was not replaced or interrupted. Full native performance certification, account synchronization, and GitHub publication remain outstanding for the larger release.
