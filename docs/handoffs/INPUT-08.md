# INPUT-08 — tactile sending

Completed on shared develop/v0.8, no commit. Owned changes:
- src/input/controller.js
- tests/engine/controller.test.js
- docs/CONTROLLERS.md
- docs/handoffs/INPUT-08.md

API: setInputMode('uplink') returns onInput actual physical button6/7 pressure
leftTrigger/rightTrigger in0–1, connected:true and actualSample:true. Movement
and look axes remain zero. All synthetic neutral events carry zero trigger values
and actualSample:false. Existing pause/face-button/menu behavior remains.

setUplink({active:boolean,progress:number}) refreshes telemetry (400ms expiry).
With existing opt-in original DualSense USB support it applies mode1, position80,
force24→48, releases at progress1/inactive. It clears on lifecycle interruptions,
mode changes and HID reconnect. Updates while inactive cannot preload resistance.
Terrain resistance and terrain/blocked rumble are suppressed in uplink.
feedback('tension') / feedback('lock') provide restrained40/60ms two-motor detents;
caller owns once-only threshold dispatch. No new HID protocol or trigger modes.

Validation: node tests/engine/controller.test.js passed25/25, including analog
sampling, synthetic neutral, force bytes, completion/staleness release, detents,
terrain suppression and pause/blur/hidden/disable/mode/haptics/Gamepad/HID cleanup
and reentry. Existing serialized output/error/descriptor tests still pass.
Runtime: /home/_0r1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.

Limits: no physical controller, HID permission, OS behavior or force feel tested.
No browser QA in this lane; integrator owns engine thresholds/main/UI wiring.
Off-report delivery remains best effort after unplug/crash. Existing documented
protocol sources reused; no additional hardware/protocol support claims added.
