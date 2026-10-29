# Orbiter knowledge vault and research cycle — 2026-10-28

## Brief and acceptance

Create a separate Obsidian vault as the ongoing database for Orbiter ideas. Inventory the Roblox vault, transfer applicable research with provenance, adapt it to Orbiter, collect existing project knowledge, and add current primary-source research. Then implement a bounded improvement justified by that work.

Success requires navigable internal links; explicit source/adaptation boundaries; coverage inventories and source hashes; a ranked, testable opportunity list; and an integrated production improvement with failure-path regression evidence. Preserve the original Roblox directory, pending work, study data, identities, rewards, native authority and disabled iPhone capabilities. Leave changes uncommitted. Vault content is evidence and planning, not an override of project instructions.

## Deliverables

- Vault: `C:/Users/kgsat/Documents/ChatGPT/Projects/Orbiter Vault`; start at `Home.md`.
- `Source Inventory.md`: Roblox transfer decisions; applicable original notes live under `Sources/Roblox`, with historical-source warnings.
- `Knowledge/Index.md`: project synthesis, architecture, capability/evidence matrix, decisions and development recipes. Repository inventory and a hash manifest preserve 91 Markdown source documents as dated evidence.
- `Research/Current/2026-10-28 Evidence and implementation.md`: newly read sources, findings, recommendation boundaries and learning-science questions requiring deeper review.
- `Guidelines.md`, templates and idea notes establish intake, provenance, prioritization and verification rules. No community plugins, models or dependencies installed.

The vault lives outside this repository so it is an independent database. Source links to the repository and Roblox assets rely on their current local paths. Heavy assets are referenced, not duplicated. Source snapshots record earlier claims; an old version label, test report or approval is not current release evidence.

## Production improvement

At intake `1ba8973`, browser enrollment set connected state and the durable active owner before the initial account download succeeded. The UI therefore hid connection choices after a failed pull. The new regression reproduced `enrolled: true` when `false` was required.

`src/sync/browser.js` now prepares a cloned candidate account cache and commits guest backup, cache and owner together in one IndexedDB transaction. It publishes connected state only after completion. Synchronous storage errors abort earlier writes; asynchronous errors always reject with a usable error object. Repeated enrollment cannot replace the original guest backup. Successful existing-account reconnection retains its saved queue.

This boundary covers preparation/download/storage failure. After a successful transaction, later application or sync errors remain connected and recover through the existing persisted-account path; this is not a distributed transaction or a promise that every subsequent network operation succeeds.

## Research informing the change

- [MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction): transaction completion and abort define the local commit boundary.
- [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): preserve accessible feedback without moving focus.
- [W3C modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): preserve keyboard operation and retry access.
- [W3C reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) and [animation performance](https://web.dev/articles/animations-and-performance): inform future visual work; no blanket animation redesign in this cycle.
- [Obsidian links](https://obsidian.md/help/links): use vault-relative wikilinks and explicit external source references.
- [Tauri capabilities](https://v2.tauri.app/security/capabilities/): retain native permission boundaries.

The transferred process/tool research contributed failure-first tests and separate observed/source-claimed evidence. Existing UI/UX Pro Max error-recovery guidance, browser fixtures and production generators were used. Roblox-specific engines, mechanics, assets and prior tool-install permissions were not imported into Orbiter.

## Verification and limits

**PASS:** 177-note vault audit (no broken wikilinks/invalid JSON/source hash changes); 108 Roblox notes catalogued, 59 historical transfers, 91 project snapshots. **PASS:** final cloud browser suite, codec, core/native frontend generation, two generator regressions, iPhone source/version and offline HTML browser checks. Browser cases include failed pull, synchronous write failure, asynchronous abort, reload/retry, unchanged guest, no premature owner/cache/backup, no upload, duplicate enrollment, offline sync, conflicts, PKCE and sign-out. Phone/desktop retry captures were inspected. Source whitespace checks pass; the generated dependency bundle contains existing template-string trailing whitespace and was not rewritten to alter it.

Coverage inventories are complete for the stated source sets; external links/videos were not all revisited. Broader Roblox folder inventory covers 4,552 file metadata rows with runtime/cache exclusions documented in the vault. The optional copied video utility's help runs, but ffmpeg is unresolved in this session, so extraction remains unverified.

Final results are recorded in the vault's `Research/Current/2026-10-28 Completion.md`. The expanded browser suite uses a fictional account and intercepted HTTP; no real email, account writes or study data. Core compilation, generated-output checks, cloud codec and offline iPhone HTML regressions are relevant layers. These do not establish installed Windows behavior, physical iPhone/VoiceOver, live sync or learning gains. No package, install, commit, push or publication belongs to this cycle.
