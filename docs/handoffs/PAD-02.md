# PAD-02 handoff

Scope: browser controller driver, behavior tests, and user/integration documentation.
No commits or publication performed. Shared checkout with disjoint ownership.

Changed files:
- `src/input/controller.js`
- `tests/engine/controller.test.js`
- `docs/CONTROLLERS.md`
- `docs/handoffs/PAD-02.md`

Implemented standard Gamepad mapping, rescaled deadzones, trigger speed override,
right-stick look, edge-triggered face/options/D-pad actions, and reconnect button
latching. Driver polls automatically. `setPaused` neutralizes driving while
preserving controller menu actions. Disabled, hidden, blurred, disconnected, and
destroyed states neutralize inputs and stop feedback. Stale terrain (400 ms) and
pause clear old physical feedback.

Terrain vibration uses measured speed, roughness, and slip with bounded short
pulses and no vibration backlog. Haptics are capability-detected browser
`dual-rumble`, explicitly documented as distinct from native PS5 HD haptics.

Optional original DualSense USB adaptive resistance is explicit settings-click
WebHID opt-in, narrow Sony 054c:0ce6 filtering and USB descriptor validation. No
Bluetooth or Edge report guesses. Trigger-only report flags avoid unrelated
controls. Resistance is mild and capped; cleanup uses mode 05 to withdraw the
actuators. HID output is serialized with one replaceable pending report; shutdown
waits for the final disengage report before closing. Failure is best effort.
Community protocol research and official browser/API documentation are linked in
CONTROLLERS.md. No physical controller was available; hardware feel, OS HID
access, Bluetooth pairing, and real-device report acceptance remain unverified.

API: `createController({onInput,onAction,onStatus})`; methods `setEnabled`,
`setPaused` / `pause`, `setHaptics`, `feedback`, `setTerrain`,
`connectAdaptiveTriggers`, `disconnectAdaptiveTriggers`, `destroy`.
`onInput`: `{steer,throttle,lookX,lookY,connected}`.
`onAction`: `primary`, `back`, `journal`, `camera`, `pause`, `navUp`, `navDown`,
`navLeft`, `navRight`. Terrain expects `{moving,blocked,power,speed,roughness,slip}`,
with speed in m/s and power/roughness/slip normalized 0–1.

Checks actually run: Node controller behavior suite, all twelve tests pass. `scripts/check.mjs` passes (14 JavaScript syntax checks,
12 scene contracts, local assets/model/license); scoped `git diff --check` passes. Tests
cover mapping, edges, lifecycle, stale telemetry, reconnect held buttons, narrow
HID filtering, descriptor rejection, chooser cancellation, pending permission
cleanup, report bytes, output coalescing, texture modulation, HID write errors,
and disconnect reset. Final review added original-DualSense matching/preference
so another standard pad cannot drive USB trigger effects, plus a dedicated
no-retry-after-write-failure test. No browser or hardware tests were run by this lane.

Integrator next action: wire main/UI settings and terrain callbacks, run combined
checks/build and browser keyboard/controller mocks; schedule real USB DualSense
and Bluetooth Gamepad testing when hardware is available.
