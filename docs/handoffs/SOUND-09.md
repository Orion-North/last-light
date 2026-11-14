# SOUND-09 — pressure, charge, departure, answer

Owned paths: `src/audio/sound.js`, `tests/engine/music.test.js`, this handoff. No commit.

Pressure now raises the existing filtered triangle from 110→220 Hz and gain .020→.066 before the existing master/compressor. A small mid-pressure noise swell resolves as pressure approaches full. This supplies anticipation and tension without a bright sustained alarm or extra persistent sources.

`setActivity` accepts `contactCharged` (full replacement semantics retained). A fresh charged edge settles the motor over .7 seconds; continued charged updates cannot restart it. The short `cue('charged')` is a grounded two-note latch. `transmit` is a faster, stronger ascending departure (all voices under .4 seconds including stop padding). `received` is a slower, lower answering interval. Root owns mode-aware calls: local sends must never manufacture an Earth reply; unanswered/archive modes should not acquire pressure/charge audio.

Original adaptive composition, musical rests, both narrative silence sections, fixed activity graph, stale input gate, pause/mute/hidden cleanup and destruction remain intact. No assets or dependencies added.

Verification: direct Node execution of `tests/engine/music.test.js` passed 10/10 using the bundled Node runtime. Covers cue identity, finite departure/charge voices, held-charge decay/reset, fixed source graph, stale activity, mute/pause/hidden, narrative silences and teardown. `node --test` child runner returned a generic file failure in this environment; running the same test file directly provides full results and passes. Human headphone/speaker balance and hardware feel remain untested.

Follow-up: `setActivity` also accepts `contactCharge` (clamped 0..1; omitted resets to 0). Root should pass the .55-second hold progress. A cubic late-weighted compression adds up to .028 gain and 80 Hz to the existing pressure graph, with a matching filter opening; most change arrives near the end of the hold. The charged edge releases this swell into the existing finite settle. No new voices/layers. Added a fixed-pressure test for late emphasis, bounds, replacement reset, charged release and unchanged source count; all 10 music tests pass directly.
