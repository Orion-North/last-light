# CONTACT-04 — a visible world-space link

Owned implementation: `src/ui/landscape.js`; no main/UI edits, commits, publication, or browser interaction. Existing dry-material, terrain-variation, geological investigation and sky changes preserved.

Renderer contract:

- `setContact(true, {mode:'reply'|'partial'|'silence'})` stops drive/investigation, zeros camera-look input, disables OrbitControls, and creates a responsive cinematic rover/sky frame. A thin original 3D beam begins at an approximate high-gain-antenna location on the unchanged NASA model. The beam endpoint moves; two understated sky guide rings stay fixed relative to the rover's start position/heading. Reference position is not recomputed while tuning.
- `setContactInput({x,y})` continuously changes beam yaw/pitch, independently of camera movement. Positive X moves the beam right in the cinematic view; positive Y moves it down. Axes are finite/clamped, neutral stops immediately, and yaw/elevation remain bounded. Root owns controller, keyboard, pointer and optional touchpad input mapping.
- Emits bubbling `contact-sample` events about 10 Hz with `{quality}` in `[0,1]`, derived from the real angular difference between beam aim and guide direction. Full quality within ~6°, falling smoothly to zero by ~19°; a generous alignment, not precision targeting. Initial beam starts offset. Root owns explicit send action and quality threshold; renderer never transmits automatically.
- `setContact(false)` hides all tuning visuals, stops tuning input and restores orbit, while retaining the cinematic camera. `focusRover()`, inspection, mode change and reset can release that frame. Contact resize preserves framing and reference. Pause/blur/stopDrive clear contact input; contact blocks driving while active.
- Historical modes do not alter alignment difficulty or create a solvable silence. They only slightly distinguish guide tint. Main must bypass alignment for Earth-calling scenes and retain the authored fixed historical outcome.

Scientific/artistic limits: this is an original uplink-orientation visualization. The sky guide is not the literal position of Earth, the beam is not a visible physical radio ray, and the approximate origin does not simulate the model's antenna articulation or Deep Space Network operations. No implication that aligning can save Opportunity.

Resources/performance: one two-vertex line, small shared-material guide/cue meshes, no images or shadows added. Geometries/materials use existing owned-resource cleanup. Animation is restrained opacity variation and stops under reduced motion; reduced-motion camera placement is immediate. No waiting pulse API added: root can hide indicators during the send/listen phase while retaining camera and controlling sound/captions.

Checks actually run:

- Runtime Node syntax and scoped whitespace checks: passed.
- Isolated Three.js contact probe passed all three modes: initial misalignment, quality >=.75 after ~0.6 s yaw and ~0.3 s pitch keyboard-equivalent input, fixed guide position, neutral input preserving aim, stopping hides visuals/restores orbit/retains camera, and all owned resources disposable.
- No browser or physical-device checks performed. Integrator should inspect camera/antenna-origin composition, visible beam/guide contrast and alignment on phone/tablet/desktop, and actual controller/touchpad feel in the separate draft.

## Review corrections: reset and pointer displacement

Repeated `setContact(true,{mode})` now deliberately resets aim and reframes even when already active, supporting the camera/Triangle action. `nudgeContact({x,y})` accepts signed angular displacement in radians (+X right, +Y down), finite and clamped to ±.25 rad per axis per call. It applies/renders immediately and clears stale velocity samples; stationary touch cannot inherit continuous motion. Paused/inactive nudges do nothing. Keep `setContactInput` for continuous stick/arrow velocity; root maps pointer/touch deltas to the new method.

Isolated contact probe passed active reset, clamped displacement, no retained velocity or subsequent drift, invalid values, and paused/inactive guards. Syntax/whitespace checks passed. Physical input and browser composition remain integrator checks.

## World-space sending and receipt pulse

`sendContact(mode)` now runs after `setContact(false)`, reusing the last tuned beam path. It shows one small packet sphere (existing geometry reused) leaving the approximate antenna along a faint path. Reply returns a softly tinted pulse after .65 s; partial fades outward before reaching the endpoint; silence sends outward without a return. All modes auto-clear at 1.2 s. This is visual dramaturgy, not radio travel-time simulation or a player-controlled historical outcome.

Tuning guide/aim-tip hide during the pulse, cinematic camera remains, and drive/orbit/aim input is blocked. `cancelContactPulse()` clears explicitly; pause, new contact, focus/inspection/mode/reset and disposal clear it too. Reduced motion shows a stationary antenna cue with the same qualitative receipt timing. Root should call the API only for rover-originated sends and avoid another `setContact(false)` during the pulse unless cancelling it.

Isolated pulse probe passed outbound movement, reply return, partial/silence without return, automatic cleanup/orbit restoration, reduced-motion stationary cue, and explicit cancellation. Syntax and whitespace checks passed. Browser visibility/contrast and full send timing remain root's verification. Current root frame/guide-outline/material/shader fixes preserved.

Root browser verification: alignment reached1 by held arrow input, Enter sent,
normal-motion packet was visibly rendered, then Earth receipt arrived. Pause
reset alignment safely; restoring a saved transmit phase reopened tuning. Root
also fixed GLSL reserved `patch`, faded environment intensity at night, refined
contact framing/guide contrast and made nudge quality update immediately.
