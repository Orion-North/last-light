# Controllers

Connect a PS5 DualSense using USB or Bluetooth, then press a button to expose it
to the browser. Input uses the browser's **standard** Gamepad mapping; other
standard controllers work too. Unmapped devices are ignored rather than guessed.

| Control | Action |
| --- | --- |
| Left stick | Steer and drive |
| R2 / L2 | Forward / reverse (takes precedence over stick speed) |
| Right stick | Camera orbit |
| × / bottom face button | Primary action / confirm |
| ○ / right face button | Back |
| Square / left face button | Journal |
| Triangle / top face button | Camera mode |
| Options / Start | Pause / settings |
| D-pad | Menu navigation, separate from driving |

Stick axes have an 18% rescaled deadzone. Actions fire once per press. Buttons
held while a pad reconnects must be released before they can activate a choice.
Paused menus keep their button controls, while driving and feedback stop.
Losing focus, hiding the page, disabling input, and disconnecting neutralize
movement and stop feedback. Touch and keyboard remain available.

## Vibration and adaptive triggers

The vibration setting controls both forms of feedback. Standard vibration uses
capability-detected `dual-rumble`; it is ordinary short vibration, not the PS5's
audio-driven HD haptics. Unsupported devices or rejected effects remain playable.
Terrain feedback uses measured speed, roughness, and slip: smooth sand is subtle, rough ground and wheel slip increase the two motor levels. Pulses last 50–85 ms with an 80–160 ms cadence and bounded strengths; no random effects or queued vibration calls. This texture remains browser rumble, not native PS5 HD haptics. Attempted blocked movement has a short contact cue; choice, observation, and transmission cues
are brief. Missing terrain telemetry for 400 ms turns terrain feedback off.

**Adaptive trigger resistance is experimental and requires explicit opt-in.**
Use the settings connection button in a browser exposing WebHID (typically a
desktop Chromium browser), on HTTPS or localhost. Select an original Sony
DualSense connected by a USB cable. The chooser is limited to Sony vendor 054c,
product 0ce6. The descriptor must match the USB gamepad report layout; Bluetooth,
DualSense Edge, and other product IDs are deliberately rejected for this feature.
When HID is connected, input selection prefers an identifiable original DualSense;
resistance never follows another selected controller or a DualSense Edge. A
failed HID write marks adaptive output unavailable and stops automatic retries.
Standard input can still work over Bluetooth. Operating system permissions or
other controller software may prevent HID access.

USB resistance uses output report 02 with a 47-byte payload **excluding the
report ID**, trigger blocks starting at payload offsets 10 and 21, and only the
trigger-valid flags (0c). Continuous resistance mode 01 begins at position 80;
force starts at 24 and rises with roughness, slip, and low dramatized power, capped at 60 (out of 255); blocked movement uses 60.
These are deliberately mild values; their feel has not been tested on hardware.
No Bluetooth output, calibration, LEDs, microphone, or speaker controls are sent.

Disabling feedback, pausing, hiding, losing focus, stale terrain, or losing the
Gamepad sends mode 05 to fully disengage and withdraw both trigger actuators. Pausing clears old movement telemetry.
Disconnecting HID and destroying the driver attempt a final off report before
closing the device. Writes are serialized with one replaceable pending report,
so terrain updates cannot build a stale queue. Physical unplugging or a crashed
browser can prevent any software cleanup; reset delivery is best effort.

## Integration

`createController({onInput, onAction, onStatus})` starts requestAnimationFrame
polling. Input is `{steer, throttle, lookX, lookY, connected, actualSample}`. Action names are
`primary`, `back`, `journal`, `camera`, `pause`, `navUp`, `navDown`, `navLeft`,
`navRight`. Status supplies `connected`, `id`, `haptics` (device capability),
`adaptiveSupported` (browser capability), `adaptiveConnected` (working output),
`adaptiveOpen` (open HID handle, including after output failure), and `message`.

Methods: `setEnabled(bool)`, `setPaused(bool)` / `pause(bool = true)`,
`setHaptics(bool)`, `feedback(kind)`, `setTerrain({moving, blocked, power, speed, roughness, slip})`,
`connectAdaptiveTriggers()`, `disconnectAdaptiveTriggers()`, and `destroy()`.
Power, roughness, and slip are 0–1; speed is meters per second. Send terrain telemetry while driving; stop updates may explicitly
set `moving:false`. Connect must be called directly from the settings click to
preserve browser user activation. It resolves to a success boolean. HID disconnect
and destroy are asynchronous so callers can await final reset/close.

Feedback kinds: `observe` (`arrival` alias), `choice` (`choose` alias), `transmit`,
`blocked`, and `terrain`. An optional injected navigator/window/document/clock
exists solely for deterministic tests.

## Sources and verification limits

- [W3C Gamepad specification](https://w3c.github.io/gamepad/): standard mapping,
  axis/button ranges and polling model.
- [MDN playEffect reference](https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator/playEffect):
  `dual-rumble` parameters and browser-dependent actuator support.
- [Chrome WebHID documentation](https://developer.chrome.com/docs/capabilities/hid):
  explicit device chooser, secure context, output report ID separate from payload.
- [nondebug's original DualSense Explorer](https://github.com/nondebug/dualsense/blob/main/dualsense-explorer.html):
  USB descriptor identification, report layout, trigger mode and force parameters.
- [Original HID output protocol research](https://gist.github.com/stealth-alex/10a8e7cc6027b78fa18a7f48a0d3d1e4):
  individual trigger-valid bits. This is community device research, not a Sony
  browser API guarantee.

Automated mocks cover mapping, edges, lifecycle, descriptor rejection, chooser
cancellation, stale telemetry, report bytes, and write coalescing. No physical
DualSense, OS HID permissions, Bluetooth pairing, or adaptive force feel has been
tested here. Test those on actual hardware before describing hardware support
as verified.

## Surface integration

The world samples the actual rendered terrain around six wheel positions.
Curvature supplies roughness; incline supplies a simplified wheel-load proxy in
`slip` (not a physical traction simulation). Contact with an obstacle supplies a
blocked cue. Telemetry updates during movement about every 80 ms; missing updates
stop feedback. The audio score is not routed into the controller as haptic audio.

## Deferred desktop edition

Per the user's instruction, remain web-based until the game is finished. A later
optional desktop edition can reuse the game and add a native USB audio/HID layer
for independently authored left/right haptic waveforms and tighter trigger timing.
A desktop wrapper alone does not provide this. No desktop packaging, native
bridge, device audio routing, or desktop dependency has been implemented.

## v0.4 controller-first draft

Left stick drives only during travel. It navigates choices and pause menus with
neutral-release gating across screens; D-pad remains available. Right stick
moves the view during geological investigation; a readable steady view records
the feature. Triangle resets the current inspection instead of abandoning it.
Disconnect pauses the journey and cancels pending interactions. Prompt families
have an override for browsers that hide controller identity.

For simultaneous local browser QA and physical controller playtesting on another
URL, `?controller=off` suppresses controller input/output in the QA tab. This is
not a claim that physical iPad controller behavior has been tested.

## Optional USB touch coordinates and menu scrolling

The existing explicit original-DualSense USB connection also listens for touch
reports. It does not request device access automatically. `onTouch({x,y,active,id,cancelled})`
reports normalized coordinates from -1 to 1, with positive Y downward. Multiple active contacts cancel the gesture until all fingers lift. Pause, blur, hidden pages, disconnect, destroy, and reports
stale for over 250 ms release the active contact. Unsupported devices and report
formats are ignored. Right-stick and screen controls remain the required fallback;
the optional USB route requires `navigator.hid`, and is unavailable on iPad Safari.

The format is verified against Sony's Linux driver: USB report 1 carries a 63-byte
payload; two packed contacts begin at payload offset 32. Contact bit 7 indicates
release, and the coordinate ranges are 1920 by 1080. This is protocol verification,
not a physical-device test. See the
[Sony-authored Linux driver](https://github.com/torvalds/linux/blob/master/drivers/hid/hid-playstation.c)
and Chrome's [WebHID input-report documentation](https://developer.chrome.com/docs/capabilities/hid#receive_input_reports).

Menu mode additionally emits `onScroll(deltaY)` from right-stick Y, including
paused menus. Delta is in pixels, capped at 21 per frame and 420 per second of
bounded frame time. The main UI chooses the scrollable dialog/panel; camera and
driving remain neutral. USB touch does not emit a send action: the main UI owns
gesture recognition, confirmation, and fixed historical receipt outcomes.

## v0.5 terminal uploads

On the memory terminal, swipe upward and release the optional USB touchpad.
A single contact must move at least .55 normalized units upward with at most .35
horizontal drift, within 70–1800ms. Cancellation, stale reports, changing fingers,
pause and disconnect never count as a release that sends. Screen/mouse drags use
the same distance/release rules without a maximum duration for slower movement.

The required controller alternative is neutral right stick, then hold up for .65s,
or press the bottom face button. Synthetic neutral events cannot arm the gesture;
held inputs across screens must be released first. Enter or the visible Upload
button is also available. iPad does not need USB touchpad access to finish the game.
