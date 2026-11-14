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
These terrain values remain restrained. Sending uses the separate zoned effects described below; that new tuning awaits a physical feel test.
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
`setHaptics(bool)`, `setInputMode(mode)`, `setUplink({active, progress, charge = 0, charged = false, effort = 0, leftTrigger, rightTrigger})`, `feedback(kind)`, `setTerrain({moving, blocked, power, speed, roughness, slip})`,
`connectAdaptiveTriggers()`, `disconnectAdaptiveTriggers()`, and `destroy()`.
Power, roughness, and slip are 0–1; speed is meters per second. Send terrain telemetry while driving; stop updates may explicitly
set `moving:false`. Connect must be called directly from the settings click to
preserve browser user activation. It resolves to a success boolean. HID disconnect
and destroy are asynchronous so callers can await final reset/close.

Feedback kinds: `observe` (`arrival` alias), `choice` (`choose` alias), `transmit`,
`blocked`, `terrain`, `tension`, `lock`, `charged`, and `received`. An optional injected navigator/window/document/clock
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
cancellation, stale telemetry, report bytes, and write coalescing. Automated verification does not establish physical DualSense behavior, OS HID
permissions, Bluetooth pairing or adaptive force feel; the user separately confirmed
USB haptics in Chrome on CachyOS. Test those on actual hardware before describing hardware support
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


## v0.9 charge, then release to send

Release both triggers to arm, then squeeze L2 + R2 together to at least .82
pressure for .55 seconds. The game owns this state machine. Charging does not
send: keep holding as long as desired, then release both triggers to commit once.
Early release cancels harmlessly. Visible button, keyboard and touch alternatives
remain available.

`setInputMode('uplink')` preserves standard face-button and pause actions, emits
zero steering/throttle/look axes, and includes raw standard button 6/7 pressure as
`leftTrigger` / `rightTrigger`, clamped to 0–1. Physical polling samples have
`connected:true, actualSample:true`. Synthetic neutral events have zero triggers
and `actualSample:false`; they must never arm or commit a send.

Refresh `setUplink({active, progress, charge, charged, effort, leftTrigger, rightTrigger})`
on each real input sample while the send gesture is armed. The caller sets active
when either raw trigger exceeds .03 in a valid armed stage (or while charged),
and clears it for release, cancellation, commit, or an invalid stage. Raw pressures
are independently clamped to 0–1: one finger can engage feedback without waiting
for the other. A trigger at or below .03 receives Off 05 even if the other remains
held. Omitted pressures default to 1 for older symmetric callers; the game always
supplies both. `charge` is the full-pressure hold fraction, separate from pressure.

The opted-in original-DualSense USB path keeps report 02, its 47-byte payload and
only trigger-valid flags 0c. Sending now uses standard Vibration 26 immediately
from physical zone 0 through zone 9. There is no late-charge vibration gate.
Amplitude now starts at the supported maximum, 8 of 8, as soon as that trigger exceeds .03 pressure. Frequency rises from 55 to 75 Hz with pressure or hold charge; maximum story effort adds 10 Hz (65–85 Hz). Both sides engage independently from physical zone 0 through zone 9, including at a light initial press. Earlier tuning started at amplitude 5 normally or 7 during late calls, at 28–48 Hz. Full late-call amplitude was already 8; this revision cannot raise that protocol ceiling.

First entering charged gives a finite 180 ms confirmation at amplitude 8, then settles to Feedback 21 starting at zone 0, strength 7 (8 at maximum effort), while waiting for release. Earlier held strength was 4 or 6 and began at zone 1. The stronger held force therefore remains present through the trigger travel without an indefinite confirmation vibration. Refreshing charged telemetry does not restart the burst. Each side disengages independently when its pressure is released.

`effort` is optional and clamped to 0–1. The game derives it from dramatized signal
loss for transmissions/calls; keeping an archive uses 0. Charge duration, input
thresholds and release-to-send remain unchanged: story effort changes the
sensation, not the difficulty. Clearing uplink also clears effort, so archive
interaction cannot inherit the preceding call's force.

Both zoned effects use a 10-bit zone mask and packed 3-bit (level minus one)
values. These are not the earlier mode 01 raw force values. Vibration frequency
occupies trigger-block byte 9; reserved bytes remain zero. `active:false`, release
or cancellation withdraws both actuators with mode 05. Telemetry expires after
400 ms without refresh. Terrain remains unchanged at simple mode 01, position 80,
force 24–60. Terrain feedback stays suppressed throughout uplink mode. Full pressure alone does not turn feedback off; raw release does.

Fresh active pressure above .03 on either trigger adds finite 100 ms two-motor charge pulses, paced
at 160 ms without catch-up or a deferred queue. Charged holding rests between
cues; it does not continuously buzz. Stronger `tension`, `lock`, `charged`,
`transmit` and `received` cues last 70–320 ms. Charge pulses start at .5 per motor and rise with pressure or hold charge to .85,
or .9 with story effort. Charged magnitudes remain .7–.85; other cues stay capped
at .7. The charge pulses crescendo from the beginning of the press; the charged cue lasts
180 ms at .7–.85 on both motors and departure lasts 320 ms. Each later cue can replace earlier lower-priority feedback immediately, including
charge pulses. Promise generations prevent late completions from unlocking newer
feedback. The caller fires threshold cues once, `transmit` on the actual send,
and `received` only for a real reply. These are ordinary browser dual-rumble,
not native audio-driven HD haptics. The optional HID effect separately vibrates
the trigger mechanism.

Pause, blur, hidden pages, disabling input, changing modes, losing the selected
Gamepad, turning haptics off, HID disconnect/reconnect and destroy clear pressure
telemetry and neutralize feedback. Returning cannot restore old resistance;
inactive updates are discarded. Adaptive output remains serialized/coalesced and
failure stops retries. Software cannot guarantee cleanup after physical unplugging
or a browser crash. The sending effects use researched standard trigger modes; no calibration,
maximum-strength preset, audio, LEDs or other device controls are sent.

The user confirmed ordinary haptics work in Chrome on CachyOS over USB. The
maximum-amplitude immediate-onset tuning still requires their physical feel test; automated
mocks verify lifecycle, timing and bytes, not subjective feel.

The sending encoder follows the bit layout documented in
[Nielk1’s original trigger-effect factories](https://gist.github.com/Nielk1/6d54cc2c00d2201ccb8c2720ad7538db),
whose notes trace the standard modes to Apple/Steamworks HID captures. This
supersedes the older stealth-alex page’s incomplete description of mode 26.
[Valve’s published DualSense interface](https://github.com/ValveSoftware/Proton/blob/proton_11.0/lsteamclient/steamworks_sdk_155/isteamdualsense.h)
independently documents ten positions, amplitude 0–8 and frequency in Hz. Encoding
and bounded timing are verified by mocks; physical vibration strength, firmware
behavior and subjective comfort remain for the user's USB playtest.


## FEEL-13 stronger trigger travel

The USB changes above increase trigger-mechanism output, separately from ordinary
browser motor rumble. Neither send pressure threshold nor charge duration changes.
Fresh held telemetry sustains the effect; missing updates still disengage both
sides after 400 ms. Release, pause, blur, hidden pages, mode changes, haptics off,
disconnect and destroy retain their existing withdrawal behavior. Terrain output
is unchanged. No calibration or undocumented effect modes are added.

The supported amplitude/strength ceiling is 8, and frequency is documented in Hz;
we use 55–85 Hz within the documented 0–255 range. Raising frequency is a changed
waveform, not a promise of proportionally greater physical strength. Automated
reports verify the stronger onset and held-force parameters, independent sides,
reserved bytes and cleanup. This revision has not sent output to a physical
controller or established subjective feel on the user's device.


## v0.13 sending controls

While a gamepad is connected, sending and recovery calls require both triggers:
release to arm, squeeze and hold to charge, then release both. Cross/A only
continues after a result; it cannot activate a hidden send button. The central
sequence and left glyph prompt explain the action. Controller disconnect pauses
the game; resuming without a pad exposes the keyboard/mouse button alternative.
Reconnect restores trigger-only sending with a fresh release gate.


## v0.14 resistance-first sending (current)

Supersedes FEEL-13's vibration-through-the-press pattern. Each trigger now uses
standard Feedback21 at maximum supported strength8 across all ten zones, starting
at zone0 as soon as its own pressure exceeds .03. Resistance stays active through
charging. At full charge, a single180ms Vibration26 confirmation temporarily
replaces resistance, then maximum Feedback21 resumes until release. These modes
replace each other; they do not sum forces. Confirmation frequency remains
55–85Hz depending on pressure/story effort.

Input thresholds, ordinary rumble, terrain effects and all cleanup paths are
unchanged. Maximum protocol strength is a request, not a measured physical force;
this tuning needs the user's USB DualSense playtest.
