# FEEL-10 — immediate, stronger trigger engagement

Scope: `src/input/controller.js`, `tests/engine/controller.test.js`,
`docs/CONTROLLERS.md`, and this handoff. No commit created.

The old send effect physically began at zone 6 and waited for charge .35; early
feedback was resistance only. Sending now uses standard Vibration 26 across zones
0–9 as soon as the individual trigger's raw pressure exceeds .03. Normal
amplitude starts at 5 and rises to 7; maximum story effort starts at 7 and rises
to 8. Each side responds independently (right block offset 10, left offset 21),
and a released side immediately gets Off 05. Full pressure before charged
confirmation continues to vibrate. Frequencies span 28–42 Hz normally and
34–48 Hz at maximum effort.

Charged confirmation remains finite at 180 ms, then settles to non-vibratory
Feedback 21 across zones 1–9 at strength 4–6. Refresh cannot restart the burst.
Telemetry expiry remains 400 ms; lifecycle clearing, optional feedback, original
USB DualSense identification, report 02/47 bytes/trigger flags 0c, serialized
writes, and failure handling are preserved. Terrain output was not changed.
Ordinary rumble starts with either trigger above .03, including when combined
progress and hold charge are zero. Its 100 ms pulses are paced at 160 ms and rise
from .5 to .85–.9 with pressure/hold and story effort; all magnitudes clamp at .9.

## Accepted integration contract

Root supplies `setUplink({active, progress, charge, charged, effort,
leftTrigger: result.left, rightTrigger: result.right})` from genuine samples.
Active requires a valid armed send stage and either raw pressure above .03 (or
charged); cancellation, committed send and release stage clear it. Driver also
requires a raw pressure above .03, so zero pressures withdraw both actuators even
if a caller accidentally retains active/charged. Raw pressures clamp to 0–1.
For older symmetric callers only, omitted pressure fields default to 1; the game
supplies both fields. Progress 1 no longer implicitly disables feedback.

## Review and verification

Reopened Nielk1's original factory source on the web and checked standard
Vibration position range 0–9, amplitude 0–8, per-zone packed amplitude-minus-one,
and frequency at trigger-block byte 9. Existing cited protocol source:
https://gist.github.com/Nielk1/6d54cc2c00d2201ccb8c2720ad7538db

Actually run with bundled Node:

- `node tests/engine/controller.test.js`: 33 tests passed, zero failures.
- `node --check src/input/controller.js`: passed.
- `git diff --check`: passed.

Tests include exact early and late bytes, per-side onset/release, no full-pressure
feedback gap, charged finite burst/rest, early one-side lifecycle interruptions,
stale output, priority/promise races, rumble onset before hold charge and bounds.
All controller output uses mocks; no physical controller reports were sent.
Physical feel and OS/firmware behavior remain for the user's wired original
DualSense playtest in Chrome on CachyOS. Root owns integration/build/publication.
