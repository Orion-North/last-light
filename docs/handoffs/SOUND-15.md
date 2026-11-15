# SOUND-15 — bottom terminal articulation

## Scope and changed paths

- `src/audio/sound.js`: returned `textPulse({ speaker = 'rover', first = false } = {})`.
- `tests/engine/music.test.js`: two behavioral audio-graph/lifecycle checks.
- This handoff only. No main/UI, score, dependencies, assets, commits or publication.

## Design and integration contract

The terminal sound is a rounded dry key made from a cached 65ms deterministic
noise buffer through a low-pass filter, with a 4ms attack and a short exponential
decay. It is not an oscillator or musical interval. Rover uses a 1150Hz cutoff;
Earth is warmer at 760Hz; archived records are more muted at 440Hz. Their maximum
pre-master gains are .025, .022 and .020 respectively; continuation pulses are
70% of that. A first pulse has 12ms more body. Actual source lifetimes range from
33ms to 59ms. This keeps text near the player rather than suggesting another
radio packet, and avoids a tiring high beep or a new call-and-response pattern.

Final presentation follows the user's correction: the bottom terminal contains
only Opportunity's inner thoughts, without speaker labels. Root calls only
`speaker: 'rover'`; the optional Earth/record colours remain unused capabilities,
not dialogue or an interface requirement. There are no post-contact Opportunity
thoughts to articulate. The existing Earth reply motif is unchanged.

Root calls `first: true` for each new short line, then default/false for reveal
bursts at approximately 130ms intervals. A global 95ms throttle drops duplicate
calls before allocation, including duplicate first calls. Each accepted first
resets the line's budget; each line accepts at most sixteen pulses. Unknown
speaker values fall back to rover. Calls never request/start an AudioContext,
queue text work, add a timer, or duck/alter the soundtrack.

Text is deliberately inaudible throughout explicit narrative silence, an active
transmission and its answer window. Even Earth text cannot fill the expected
missing reply. The existing mute/pause/hidden/suspended/destroyed gates apply.
Sources join the existing voice registry so mute, pause, visibility changes,
section transitions and destruction stop/disconnect them. Every source has an
explicit finite stop and normal completion disconnects its nodes. Destroy clears
the cached noise buffer.

## Verification actually run

`/home/_0r1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/engine/music.test.js`

Result: **19/19 passed**, including prior score/signal tests plus new checks for
pre-activation no-op, distinct speaker filters, finite noise-only articulation,
duplicate throttling, sixteen-pulse budget, normal disconnect, lifecycle gates,
transmission/answer-window protection, explicit silence and teardown.

The deterministic Web Audio mock verifies graph behavior and scheduling, not
perceived sound. Browser listening, physical audio output and hardware tests were
not performed or requested in this lane. Human listening should judge the final
mix and whether the small timbral distinctions read at normal speaker volume.
