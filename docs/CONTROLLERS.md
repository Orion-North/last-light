# Controllers

Connect a PS5 DualSense using USB or Bluetooth, then press a button to expose it
to the browser. Input uses the browser's **standard** Gamepad mapping; other
standard controllers work too. Unmapped devices are ignored rather than guessed.

| Control | Action |
| --- | --- |
| Left stick | Steer and drive |
| R2 / L2 | Forward / reverse during travel; squeeze both together to send |
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
polling. Input is `{steer, throttle, lookX, lookY, leftTrigger, rightTrigger, connected, actualSample}`. Action names are
`primary`, `back`, `journal`, `camera`, `pause`, `navUp`, `navDown`, `navLeft`,
`navRight`. Status supplies `connected`, `id`, `haptics` (device capability),
`adaptiveSupported` (browser capability), `adaptiveConnected` (working output),
`adaptiveOpen` (open HID handle, including after output failure), and `message`.

Methods: `setEnabled(bool)`, `setPaused(bool)` / `pause(bool = true)`,
`setHaptics(bool)`, `setInputMode(mode)`, `setUplink({active, progress})`, `feedback(kind)`, `setTerrain({moving, blocked, power, speed, roughness, slip})`,
`connectAdaptiveTriggers()`, `disconnectAdaptiveTriggers()`, and `destroy()`.
Power, roughness, and slip are 0–1; speed is meters per second. Send terrain telemetry while driving; stop updates may explicitly
set `moving:false`. Connect must be called directly from the settings click to
preserve browser user activation. It resolves to a success boolean. HID disconnect
and destroy are asynchronous so callers can await final reset/close.

Feedback kinds: `observe` (`arrival` alias), `choice` (`choose` alias), `transmit`,
`blocked`, `terrain`, `tension`, and `lock`. An optional injected navigator/window/document/clock
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

## Windows preview and deferred native haptics

The user has now requested a Windows test build. The portable Electron edition
bundles this game and exposes the existing optional USB resistance path; see
[Windows setup](WINDOWS.md). Native USB audio waveforms and HD haptic routing
remain deferred. A desktop wrapper alone does not provide those capabilities.

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
formats are ignored. The current game no longer uses this touch-coordinate callback to send;
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
commitment and fixed historical receipt outcomes.

## v0.5 terminal uploads (superseded by v0.8)

On the memory terminal, swipe upward and release the optional USB touchpad.
A single contact must move at least .55 normalized units upward with at most .35
horizontal drift, within 70–1800ms. Cancellation, stale reports, changing fingers,
pause and disconnect never count as a release that sends. Screen/mouse drags use
the same distance/release rules without a maximum duration for slower movement.

The required controller alternative is neutral right stick, then hold up for .65s,
or press the bottom face button. Synthetic neutral events cannot arm the gesture;
held inputs across screens must be released first. Enter or the visible Upload
button is also available. iPad does not need USB touchpad access to finish the game.

## v0.6 presentation and pace

Contextual glyphs lead short verbs in a left-side guide. The upload prompt avoids
repeating the entire control mapping; the guide distinguishes stick hold, optional
USB touchpad swipe and the explicit button. Keyboard and touch retain readable
alternatives. Gameplay and uplink stay close to the rover; geological inspection
frames the current evidence. The twelve-second mission introduction is skippable,
pauses with the game and uses a static view under reduced motion.


## v0.8 two-trigger sending

The controller upload uses a deliberate L2 + R2 squeeze. Release both to arm,
squeeze together, then hold full pressure briefly. The game owns the arm/hold/send
state machine and sends once; touchpad clicks and a cursor are unnecessary.
The visible button, keyboard and touch alternatives remain available.

`setInputMode('uplink')` preserves standard face-button and pause actions, emits
zero steering/throttle/look axes, and includes raw standard button 6/7 pressure as
`leftTrigger` / `rightTrigger`, clamped to 0–1. These physical polling samples have
`connected:true, actualSample:true`. Synthetic neutral events (including mode
entry and pause) have zero triggers and `actualSample:false`; they must never arm
a send. Menu and inspection modes keep their existing behavior.

While the squeeze is active, refresh `setUplink({active:true, progress})` with
normalized 0–1 progress. The existing opted-in original-DualSense USB path uses
only the already documented mode 01 at position 80: force rises from 24 to 48.
`progress:1` or `active:false` releases both actuators with mode 05. Telemetry
expires after 400 ms without refresh. Terrain resistance and terrain/contact
rumble are suppressed throughout uplink mode, including after completion.
`feedback('tension')` is a 40 ms restrained rumble detent; `feedback('lock')` is
60 ms. The caller fires each threshold once; polling does not repeat detents.
These are ordinary two-motor rumble cues, not trigger vibration or native HD
haptics. Standard controllers need no HID permission for squeeze input or rumble.

Pause, blur, hidden pages, disabling input, changing modes, losing the selected
Gamepad, turning haptics off, HID disconnect/reconnect and destroy clear pressure
telemetry. Returning to uplink cannot restore the old resistance. Updates while
inactive are discarded. Adaptive output remains serialized/coalesced and failure
stops retries. Software cleanup still cannot guarantee delivery after physical
unplugging or a browser crash. No new HID modes or device capabilities are used;
force feel and physical hardware remain untested.
