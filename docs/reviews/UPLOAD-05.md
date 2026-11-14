# UPLOAD-05 — terminal upload review

Independent source audit of changing `develop/v0.5`, 2026-11-14. Only this review document edited. Read main, terminal renderer/styles, upload gesture helper, controller routing and tests. No browser or live game accessed, no controller hardware test, no publication or commit. Integration changes were still in progress; findings below describe the inspected snapshot.

## Critical findings sent to integrator

1. **Synthetic controller neutral can arm a held-stick upload.** Entering transmit sets `contacting=true`, resets `stickUpload`, then `syncInputMode()` changes menu to inspect. Controller `setInputMode()` calls `neutral()`, producing `lookY:0` indistinguishable from a physical neutral sample. Main immediately passes that to `stickUpload.sample`, arming the upload. A right stick already held upward through memory selection can then commit after .65s without the player releasing and making a fresh push. This defeats the helper's deliberate-neutral protection despite its unit tests passing. Mark synthetic input and exclude it from gesture arming, or enforce a physical-axis neutral gate in the controller upload route. Regression: hold right stick up while selecting a memory; wait several seconds; no send until real neutral followed by a fresh upward push.

2. **Held Enter can activate the newly focused Upload button.** Main has no `event.repeat` guard or keyboard release gate. Enter activates the focused memory choice; `renderGame({focus:true})` then focuses transmit. Subsequent repeated keydowns can invoke native activation on that new button, bypassing the intended deliberate upload. Prevent repeated Enter/Space activation across the choice-to-upload context, preserving a new press as the accessible alternative. Regression: hold Enter during choice confirmation for two seconds; terminal stays ready until keyup and another press. This is a source-level DOM-event risk, not a reproduced browser result.

3. **Mode-independent terminal labels misrepresent Earth silence and archive actions.** The inspected renderer used READY TO UPLOAD, SENDING MEMORY, UPLINK / Memory upload progress and a fully filled received bar for all modes. Silence still correctly printed NO REPLY, but surrounding copy claimed a memory was on its way / TRANSMISSION COMPLETE; archive similarly claimed an uplink. Distinguish ready call, calling/listening and no reply; archive ready/kept; partial image received without visually implying a complete image. Keep accessible labels and footer consistent with the mode, not only the headline. Main's scene-specific responses and historical outcome already preserve no rover answer and should stay intact.

## Gesture/lifecycle observations

The pure swipe helper requires a .55 normalized upward displacement, constrained horizontal drift, 70–1800ms duration and a real matching release. Pointercancel, lost capture, identity changes and invalid samples do not commit. Stick helper requires neutral and .65s up, resets after one commit, and clamps elapsed time. These are appropriate protections at helper level; input-origin and context wiring still determine whether they hold end to end.

Main gates `sendMemory()` by scene phase, pause and current transmission; sends cancel the active gesture, and pause cancels the transmission wait. Received state has an explicit Continue action. Reply/partial use upload interaction; silence and archive remain explicit button actions. These distinctions avoid implying a better gesture can rescue Opportunity. No fact additions or historical outcome changes were found.

A lower-priority cancellation usability concern: `resetUpload()` clears the tracked pointer while `uploadGesture.reset()` deliberately keeps a blocked latch until release. The old pointerup is then ignored because `contactPointer` is null. If release happens during pause, the first later fresh gesture may be swallowed just to clear the block. Preserve neutral/release bookkeeping across interruption without letting it commit. Verify reset-mid-swipe → release while paused → resume → first fresh swipe succeeds. This is a predicted integration edge, not a confirmed browser failure.

## Actual checks and limits

Ran the assigned absolute Node runtime with `--test tests/engine/upload-gesture.test.js tests/engine/controller.test.js`; both test-file subtests passed, zero failures. Those tests exercise helper/controller units, not main's DOM focus, synthetic-neutral integration, pointer capture or terminal visual layout. No claim of end-to-end safety, swipe ergonomics or physical touchpad correctness follows from those passes. Re-read changed source after integrator fixes before closing the audit.

## Final source recheck after fixes

Re-read main, controller, gesture helper and terminal renderer after the integrator's fixes. The three critical findings above are resolved in the inspected source:

- Synthetic controller neutral carries `actualSample:false`; only physical polling carries true. Main feeds the upload stick recognizer only true samples, so context reset can no longer masquerade as a real neutral stick.
- Global keydown handling prevents default on repeated Enter/Space before native button activation, preserving a fresh press as the accessible upload action.
- Ready, sending and received copy now branches by mode; silence says ready to call / calling / listening / channel quiet, archive says ready to keep / archived, and partial says partial image received. Only ready upload modes show a bar, explicitly labeled gesture progress; no full received progress bar implies a successful rover reply or complete image.

Pointer and USB contacts now have separate recognizers. USB samples are tracked even outside active upload, allowing reset to block held contacts until release. Pointer reset explicitly cancels its recognizer before clearing capture ownership; pointer Y is clamped so a deliberate release above the terminal remains usable. Ownership transitions reset stick progress. These changes address the lower-priority cancellation bookkeeping concern in the inspected code.

Reran the assigned absolute Node command with upload-gesture, controller and upload-terminal test files: all three test-file subtests passed, zero failures. No remaining critical source-level finding identified in this recheck. Main's browser event/focus integration and physical USB/controller behavior still require the integrator's local checks; this is not a claim that those end-to-end tests passed.

## Slow screen-drag follow-up

Reviewed the subsequent configurable `maxDurationMs` change: default USB recognizer retains 1800ms; only the independent screen-pointer recognizer opts into Infinity. Both active-motion and release timeout comparisons use the option. Distance, lateral, identity, valid time/coordinates, real release and cancellation guards remain intact. This is appropriate for a screen gesture that can be performed slowly; no critical issue identified. Main no longer contains temporary gesture-diagnostic dataset updates.

Ran an inline assertion check with the assigned Node runtime: an eight-second valid pointer gesture commits with Infinity, the same gesture is rejected by default settings, and an eight-second cancelled pointer gesture does not commit. All passed. Integrator owns durable regression coverage and browser verification.
