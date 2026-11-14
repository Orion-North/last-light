# TIME-STORY-07 handoff

Owned paths: `src/content/time.js`, `src/content/story.js`,
`tests/engine/time.test.js`, `docs/reviews/TIME-STORY-07.md`, this handoff.
No commit made; shared develop/v0.7 checkout, disjoint ownership.

Implemented the selected 7-second 2004→2015 passage (three beats) and 3-second
2015→2018 passage (one beat). `missionTime(sceneId)` returns
`{year,label,ageYears}` or null for unknown IDs. `timePassage(fromId,toId)` returns
the agreed presentation descriptor or null. Labels replace the existing date
eyebrow and retain NASA-backed exact milestones. Operational age freezes at 14
after last contact; it does not simulate activity during recovery. No Earth
montage, new scene, interaction, or save field. Five existing story lines revised
to establish familiar routine and months of recovery.

Sources checked: NASA N8 marathon illustration and N2 mission-end announcement,
linked in review. Routine captions are explicitly imagined; no invented dated
logs or received post-contact rover messages.

Validation actually run: absolute bundled Node `tests/engine/time.test.js` —
3 tests passed. Covers exactly two seams, unknown IDs/prototype names, ages and
Earth chronology. No browser checks run in this lane. Integrator owns passage
clock, rendering, skipped/reloaded paths, controller and accessibility checks.

Critic feedback resolved: replace existing heading rather than duplicate HUD;
avoid invented intermediate transmission counts; choose a short second rover
seam rather than advancing the Earth recovery chronology ahead of final call.
