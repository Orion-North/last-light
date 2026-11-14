# STORY-03 — curiosity before interpretation

- Agent / owner: narrative agent, assigned by Codex.
- Branch / worktree / base commit: shared checkout `main`, baseline `3aeb99c`; disjoint file ownership.
- Allowed paths: `src/content/story.js`, `docs/handoffs/STORY-03.md`.
- Acceptance criteria: short question-first approach copy, faithful science, no photography-system promises, unchanged scene/choice IDs and historical outcome.
- Changes and rationale: Last Chance and Berry Bowl have optional `approachTitle` fields and question-first subtitles. Their discoveries connect visible layers/grains to the sourced inference. Berry Bowl asks players to inspect the grains and cleared patch, rather than promising interactive brushing. Choice prose describes selecting memories rather than controlling camera framing. `last-image` uses a partial-image receipt without invented rover words; Earth attempts use silence; the months scene saves remembrance in the archive.
- Files changed: the two allowed paths above.
- Interface/dependency changes: optional scene fields `approachTitle` (string) and `receiptMode` (`partial`, `silence`, or `archive` here); no new dependency. Integrator owns consuming these fields. Existing fields, IDs, source links, memory content, scene count, dates and fixed outcome remain intact.
- Checks actually run and results: `node scripts/check.mjs` passed (16 syntax checks, 12 scene contracts, assets/model/license); `node tests/engine/game.test.js` passed all 10 tests. A source comparison against HEAD confirmed every source/scene/choice ID and each scene source reference unchanged, and 12 observations retained. Node used the assigned absolute runtime path. Claims reviewed against `docs/SOURCES.md` N6/N7 and recovery/image entries; no materially new facts added and no external research needed.
- Unrun checks / blockers: no browser, visual, touch, audio, reduced-motion, or emotional playtest performed by this lane. Full save/2,048-path session suite and integrated receipt behavior belong to integration; optional fields alone do not implement UI behavior.
- Commit(s), if any: none; no publication.
- Next action for integrator: consume approach titles before inspection and receipt modes after deliberate send; verify the journal only reveals interpretation after inspection and archive remembrance does not imply another radio attempt.
