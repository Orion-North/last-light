# FEEL-13 — stronger immediate USB trigger feedback

Owned: `src/input/controller.js`, `tests/engine/controller.test.js`, `docs/CONTROLLERS.md`, this handoff.

Original-DualSense opted-in USB sending now engages Vibration 26 at amplitude 8 (the supported ceiling) from the first pressure sample above .03, independently on both sides and across all ten positions starting at zone 0. Previously onset amplitude was 5 normally / 7 at maximum story effort, rising later. Frequency is now 55–75 Hz plus 0–10 Hz story effort, versus 28–48 Hz. Charged confirmation remains finite at 180 ms, followed by sustained Feedback 21 across all positions at strength 7 normally / 8 with maximum effort, versus strength 4 / 6 starting at zone 1. Fresh telemetry sustains this output; 400 ms expiry still withdraws both actuators. Trigger release remains independent, and pause/blur/hidden/disable/mode change/disconnect/destroy reset behavior remains.

Ordinary browser rumble, input charge pressure threshold, hold duration and send gesture are unchanged. Terrain output is unchanged. No new dependency or undocumented modes. Full-effort full-charge vibration amplitude was already at ceiling 8; increased output there is frequency and sustained force, not amplitude beyond supported bounds. Frequency changes do not establish subjective force.

Protocol bounds verified against the existing primary references: Nielk1's original effect-factory research and Valve's published `isteamdualsense.h` (10 positions, strength/amplitude 0–8, frequency 0–255 Hz). Encoded levels remain 1–8 with packed 3-bit level-minus-one values and reserved bytes zero. No physical device output was performed.

Checks: all 34 controller tests pass, including new explicit decoded maximum amplitude at light/intermediate/full pressure on both sides, bounded frequency/reserved bytes, stronger held force and stale cleanup. Existing interruption, independent release, output serialization and failure tests pass. Repository syntax/contract check passes. Physical strength and subjective feel remain for the user's USB Chrome playtest.
