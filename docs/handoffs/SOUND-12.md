# SOUND-12 handoff

Owned paths: src/audio/, tests/engine/music.test.js, docs/SOUNDTRACK.md and this file.

Implemented a four-note sending question and complementary descending received
answer, repeated identically across ordinary scenes. The partial final send
breaks after note three. Earth calls still speak the learned full question, even
in narrative silence, and leave a 2.2-second empty expected-answer interval.
The existing adaptive score is preserved; it is suppressed through transmission
and that interval, with sustained voices canceled so tails cannot fill the gap.

Integration: call beginTransmission('normal'|'partial'|'call') on launch, then
finishTransmission(same mode) at the actual result. Archive has no transmission
motif. Do not call both this API and legacy cue aliases. Only pending normal
transactions before contact loss can answer. Pause/mute/hidden cancels pending
reply and voices. Optional setActivity fields toolActive/toolPressure/toolMotion
reuse persistent sources; contact overrides tool, tool overrides motor.

Checks actually run: Node tests/engine/music.test.js, 17/17 pass. Added motif,
missing-answer, Earth-in-silence, partial, cleanup and tool graph checks. No audio
listening, physical controller output, browser playthrough or deployment claimed.

Root owns main wiring, UI and publication. No assets/dependencies added. No commit
created in the shared checkout.

Integration follow-up: added cancelTransmission() for navigation/title paths that
cancel the UI wait without pausing audio. It releases indefinite hold, cancels
signal voices and restarts score where appropriate; idle calls are harmless.
A dedicated test checks cancel→late finish cannot answer and authored silence
stays silent. Reviewed main's begin-after-render / finish-after-state-render order;
it is correct. Recommend equal 2400ms ordinary and Earth call travel so the absent
answer has a fixed learned temporal position; partial can retain its broken delay.

Final integrated source review (read-only, no audition): all send/partial/call
profiles now use 2400ms, giving the expected answer a consistent temporal slot.
Main starts the question after sending render and finishes after result render;
normal-only answer gates, question during silence, 2.2s score hold, title cancel,
pause cancel, hidden-page pause and wait-generation invalidation are coherent.
One pacing limitation remains: Continue is available as soon as receipt appears.
An immediate NEXT can change musical section and cancel the unfinished normal
answer, or remove the no-answer visual before the empty window has elapsed.
Recommended consideration to root: a brief received settle (about 1.5s normal,
2.2s unanswered). This is a source-review concern, not a claimed heard defect;
no shared main/UI edits were made in this review.
