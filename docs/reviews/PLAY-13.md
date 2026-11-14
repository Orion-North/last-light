# PLAY-13 — controller commitment and distinct fieldwork

2026-11-14. Independent critical source review. Owned report only; no publication authorized. Browser access was unavailable during v0.12 reviews, so a UI playthrough is not claimed here.

## Initial risks to resolve

Controller sending currently has two bypasses: the `contacting` primary-action branch calls `sendMemory()` directly, and the generic primary fallback selects `[data-action=transmit]`. Both must be removed or guarded. Hiding a visible button alone does not enforce trigger commitment; controller focus/activation and fallback selection must obey the same rule. Keep Cross available for received-stage Continue and for comparison, rather than globally disabling primary input.

A connected controller should get explicit L2 + R2 → charge → release wording and no actionable Cross send control. Decide terminal input mode from a stable connection/intent policy, since incidental pointer movement must not silently restore controller primary sending. After disconnect, the paused session must offer a usable keyboard/pointer send action. Pause, reset, modal close and reconnect must preserve the genuine release requirement rather than treating synthetic neutral as release.

Distinct geology should change the evidence-producing action: Last Chance traces actual crossing layer paths; Berry Bowl brushes dust, collects two qualitative readings and compares. Different labels over the same brush/probe loop would not satisfy this request. Tracing needs visible path progress, proximity/coverage rules and failure feedback, with release-safe transitions and keyboard/pointer equivalents. Retain the clear educational reconstruction/qualitative-comparison wording.

## Integrated source audit and checks

The integrated implementation removes the ready-stage transmit action for connected controllers. `sendMemory` independently rejects non-trigger sources whenever a controller is connected; the primary contacting branch announces instructions and the generic fallback no longer selects transmit. Thus hiding the button is backed by an action guard. Received Continue and geological comparison retain primary interaction. Connection changes rerender the terminal so disconnect restores the button fallback, with pause and genuine trigger-release handling retained.

Last Chance now traces two spatially sampled layer paths, needs distinct coverage of both and a release between paths, and compares their directions. Berry Bowl retains spatial brushing plus two steady readings. Tests reject off-path movement, stationary tracing, synthetic neutral arming and pointer wiggle acquisition. These are materially different evidence-producing actions in source.

All **17 aggregate engine test files passed**. Direct runs: **9 geology-tool tests, 8 upload-terminal tests and 3 geology-panel tests passed**. Syntax/contracts/assets check passed: **43 JS checks / 12 scene contracts**. These do not execute the complete DOM/controller dispatch, so a real fixture check that Cross cannot send remains necessary UI evidence. The reviewed live progress text uses normalized progress with trace/brush-specific wording; no outstanding progress-label finding remains.

CUA inventory was retried and again returned `apps:[]`, `browsers:[]`. No independent UI run, physical controller/haptics test, or publication was performed. Source review found no remaining completion blocker; readability, path alignment, and trigger-only behavior in the rendered scene still need the integrator's UI check.

## FEEL-13 audit and integrator runtime evidence

Reviewed the stronger-trigger diff in `src/input/controller.js`. Output remains within the existing 47-byte report, trigger-valid flags only, independent sides and documented zone encoding. Vibration uses amplitude 8 across ten zones and 55–85 Hz; the finite 180 ms charged confirmation transitions to held force 7–8. These changes increase selected parameters without altering send thresholds or charge duration. The existing 400 ms stale-telemetry limit and release/pause/blur/hidden/haptics-off/disconnect/destroy cleanup remain intact. Direct controller tests passed **34/34**, including decoded per-zone bounds, reserved bytes, independent release and stale withdrawal. No physical actuator output or subjective strength/comfort verification was performed by this reviewer.

The integrator reports actual isolated-fixture runtime evidence: controller ready had no transmit button; Cross and keyboard Enter did not send; charged pause/resume followed by release did not send; fresh charge and real release did send; Cross continued the receipt. The integrator then manually drove to Last Chance, traced both spatial paths using keyboard aim plus simulated R2, compared with Cross, confirmed Cross still could not send, and sent through a fresh trigger gesture. The next manual drive reached Berry Bowl, where brushing and two-probe acquisition were in progress at the time of this report. Screenshots supplied by the integrator are `outputs/last-light-v13-triggers.jpg` and `outputs/last-light-v13-layers.jpg`. These are attributed integrator observations, not an independent reviewer playthrough. Disconnect fallback verification remained pending when this section was written.

## Final attributed runtime evidence

The integrator subsequently completed Berry Bowl brushing, both readings and comparison without Skip; the recorded screenshot is `outputs/last-light-v13-samples.jpg`. At a separate Earth-call checkpoint, Cross did not send. Disconnect paused the game; resume exposed the Call button, and reconnect removed it and restored the trigger sequence. The integrator found and fixed a stale side hint under forced PlayStation glyph settings; after a final reload the disconnected hint correctly read “Enter: Call,” and keyboard Enter sent the call through to NO ANSWER. Both inspected console logs were empty. The integrator reports the final aggregate suite at **124 passing tests**.

This closes the previously pending disconnect-fallback check using attributed integrator evidence. The Earth test was a checkpoint test, and the reviewed v0.13 route covered the revised interactions rather than constituting a claimed fresh complete three-act playthrough by this reviewer. No remaining source-review blocker is recorded. Physical trigger feel remains unverified here.
