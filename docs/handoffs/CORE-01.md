# CORE-01 + AUDIO-01 — progression and procedural sound

- Agent / owner: Codex systems subagent.
- Checkout: shared `last-light`, disjoint ownership; base `27a5b38`.
- Allowed paths / changed files: `src/engine/game.js`, `src/audio/sound.js`,
  `tests/engine/game.test.js`, this handoff.
- Acceptance: guarded pure progression, unique memories, historical ending for
  all choices; optional, user-activated, network-free audio with mute and pause.

## Implementation

The engine follows the shared contract exactly: observe → choose → transmit →
received → next. Entering the epilogue sets phase `complete` and preserves its
scene index. Invalid actions are no-ops; pause freezes progression; restart
returns a fresh archive. Scene power values never affect success or survival.

Audio uses filtered procedural wind, quiet sine drones, and gentle radio/memory
cues. Scene changes ease between timbres. Construction never requests an audio
context; `start()` must be called on a user gesture. Unsupported/failed audio
returns false without blocking the story. Pause fades to silence; resume restores
the chosen mute setting. `destroy()` stops sources and closes the context.

No dependencies, external audio, shared contract changes, or commits.

## Verification

Bundled Node v24.22.1: `node tests/engine/game.test.js` passed **10 tests**,
including all eight choice paths in a three-scene fixture, frozen input,
duplicate-action rejection, pause/resume/restart, archive uniqueness, no-Web-Audio
fallback, and mocked Web Audio creation/mute/pause/resume/destruction.
`node --check src/audio/sound.js` and `git diff --check` passed.

The runtime's `node --test` reporter summarizes this as one file-level test;
direct execution displays all individual assertions. Its Node binary does not
accept `--experimental-default-type=module`; root `package.json` enables modules.

Not verified here: audible balance on physical speakers/headphones, Safari's
audio gesture handling, or actual UI integration. The mocked audio test validates
lifecycle and envelopes, not perceived sound quality. Parent should test the final
content path and browser behavior and listen at low volume during playtesting.
