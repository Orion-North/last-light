# SOUND-11 — original adaptive chamber score

Owner: SOUND-11 / Codex Sol. Shared `develop/v0.11`, disjoint sound paths.

## Delivered

- `src/audio/score.js` (new): pure authored score events, seven audible dramatic
  sections plus silence; independent geology/routine/Earth material, storm's
  displaced/unfinished call, four statement variants and long composed rests.
- `src/audio/sound.js`: integrates score module; distinct locally synthesized
  glass and reed families alongside felt/harp; score-only bus and cue/pressure
  ducking; geology mapping; Earth wind removed; Earth-side false receipts blocked.
- `tests/engine/music.test.js`: 3 added behavior tests (13 total), structural
  composition checks, transition cancellation, Earth semantics and mix routing.
- `docs/SOUNDTRACK.md`: rewritten composer brief, pitches/rhythms, arrangement,
  timbre design, adaptive behavior, SFX hierarchy, mix and honest listening status.

## Contract / integration

No public API changes, dependencies, samples or external assets. Existing
`setScene` then `setNarrative` integration suffices. Geology maps to scene 1/2;
ending to 11; silence to scene 7/10 at received. These index contracts already
existed for silence; update mapping if narrative order changes. Earth-side
received requests (index >=8) are now ignored intentionally. Archive cues must
not masquerade as rover replies.

Same-section phases retain music. Section changes cancel old material then take
a short breath before the new arrangement; no seamless crossfade claim. All old
sound-off/mute/pause/hidden/stale-input/destroy behavior is preserved. Additional
music timbres use the existing bounded cached-buffer path, not a new scheduler.

## Checks actually run

Using bundled Node:
- `node tests/engine/music.test.js`: PASS, 13/13.
- `node scripts/check.mjs`: PASS, 37 JS syntax checks, 12 scene contracts, local
  entry assets, NASA GLB and vendor license.
- `git diff --check -- src/audio tests/engine/music.test.js docs/SOUNDTRACK.md`: PASS.

No build/browser/audio listening/physical controller/public playtest operation
was performed in this lane. Graph tests cannot judge musical quality. Root should
run combined build/integration checks and arrange actual full-game listening.
Particularly listen for glass brightness, reed audibility, pressure duck recovery,
and whether unscored rests support rather than drain the scene. No audition
export or claim of hearing the result is supplied.

No commit: shared checkout changes are ready for integrator review/commit.
