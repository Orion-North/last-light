# FEEL-09 handoff

Scope: controller output and its documentation/tests only. No commit made.

Changed: `src/input/controller.js`, `tests/engine/controller.test.js`,
`docs/CONTROLLERS.md`, and this handoff.

`setUplink({active, progress, charged = false})` now holds charged resistance at
progress 1 until release/cancel or 400 ms stale telemetry. Existing original USB
DualSense mode 1, start position 80, report 02, 47-byte payload and flags stay
unchanged. Sending ramps 40–96 out of 255; terrain remains 24–60. Every charged
interruption clears state and emits mode 5, including HID disconnect.

Fresh active uncharged progress > .1 emits 100 ms charge pulses at 160 ms cadence.
Unresolved ordinary effects never accumulate a deferred queue. Later priority
cues (tension < lock < charged < transmit < received) preempt lower-priority
feedback. Epoch checks keep an old promise completion from marking a newer
pulse idle. Magnitudes stay at or below .7; charged holding has no repeated rumble.
Caller owns threshold-once cues, transmit on actual send and received only on an
actual reply.

Validation: controller test script passed all 28 tests using the supplied Node
runtime. Added charged hold/freshness/release, charged interruption coverage,
finite pulse pacing, priority replacement and old-completion race assertions.
Existing terrain, HID coalescing/failure, mapping and touch tests still pass.
Broader integration/browser/build checks were not run in this lane.

Limits: user reports USB haptics work in Chrome on CachyOS; the stronger tuning
still needs their physical feel test. No new protocol or maximum-force mode.

Review follow-up: HID disconnect now emits a synthetic neutral input immediately,
before awaiting an in-flight report or device close. This resets the main squeeze
state synchronously, preventing release from committing an old charged squeeze
during asynchronous HID cleanup. A regression test holds both report and close
promises and verifies immediate cancellation plus the serialized off report.


Latest user steering supersedes the earlier mode 1 sending ramp. Sending now uses
standard zoned Feedback 0x21 (zones 3–9 strength 2–5), final hold Vibration 0x26
(zones 6–9 amplitude 2–5, 20–36 Hz), a one-shot 180 ms charged vibration finish,
then Feedback strength 4 rest. Main must pass `charge` (0–1 full-pressure hold
fraction); default 0 preserves callers without final-hold telemetry. Early terrain
mode 1 output remains unchanged. Ordinary rumble crescendos with `charge`, charged
is 180 ms .7/.7, transmit 320 ms .7/.7, and holding charged remains quiet.

Protocol basis: https://gist.github.com/Nielk1/6d54cc2c00d2201ccb8c2720ad7538db
and Valve's public isteamdualsense header (linked correctly in CONTROLLERS.md).
The original research resolves mode 26 beyond the old incomplete stealth-alex
notes: 10-bit zone enable mask, 3-bit amplitude-minus-one for enabled zones,
frequency in block byte 9. Independently implemented protocol packing; no copied
factory code. No calibration/debug modes or maximum (8/8) amplitude.

Latest validation: all 30 controller tests pass, including exact byte vectors
for Feedback/Vibration, end amplitude/frequency, non-restarting charged finish,
resistance rest, ordinary-rumble crescendo, all prior lifecycle and race checks.
No physical test performed; user's earlier USB rumble verification is distinct
from new trigger-vibration feel. No commit.


Final story-effort clarification: `setUplink` accepts optional `effort=0`, clamped
0–1 and cleared with all uplink state. Root supplies dramatized signal loss for
transmissions/calls and zero for archive. Early effort 0 remains Feedback2–5,
Vibration peak5/36Hz, rest4; late effort1 becomes Feedback3–6, peak7/42Hz, rest6.
The finite charged finish remains 180 ms. Charge/charged ordinary rumble peak grows
from .7 to .85; transmit remains fixed .7 and received unchanged. Thresholds and
hold duration remain identical. Test verifies exact late bytes, early/archive
reset and effort clamping. Latest validation: all 31 controller tests pass; scoped
whitespace check passes. No commit; physical feel remains for user verification.
