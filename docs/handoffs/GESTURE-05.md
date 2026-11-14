# GESTURE-05 — deliberate upward upload

- Owner: Codex gesture subagent; shared `develop/v0.5`, base c65f669.
- Changed files: `src/engine/upload-gesture.js`, its engine test,
  `src/input/controller.js`, controller test, this handoff. No other source edits.
- Pure API: `createUploadGesture()` returns `sample(point, nowMs)` and `reset()`.
  Point is `{x,y,active,cancelled?,id?}`; coordinates normalized [-1,1], Y down.
  Sample returns `{progress,commit}`. No callbacks, timers, dependencies or UI.
- Gesture: upward distance >=0.55, horizontal excursion <=0.35, duration
  70–1800 ms per integrator's later steering. Progress is visible while held,
  but only an actual uncancelled release commits once. Release must include the
  contact's x/y and matching optional id. Release coordinates are checked too.
  Identity change, invalid data/time, timeout or lateral excursion cancels the
  current gesture until release. Reset during a tracked contact gates it until
  release; reset when idle allows the next fresh contact.
- `createStickUpload()` returns `sample(y, deltaSeconds)` and `reset()`, yielding
  the same result shape. Neutral abs(y)<=0.3 arms; hold y<=-0.6 for 0.65 s to
  commit once; release to neutral before another upload. Reset requires neutral.
  Delta clamps to [0,0.05]; invalid values cannot accumulate elapsed time.
- Controller metadata: `onTouch` now includes `id` and `cancelled` on every point.
  Real all-fingers release preserves last valid coordinates/id and uses
  `cancelled:false`. Lifecycle/stale-input releases preserve coordinates/id with
  `cancelled:true`. Finger identity replacement or two simultaneous contacts
  cancels and blocks until all contacts are inactive. Existing explicit USB opt-in
  and report restrictions remain; no new browser capability claim is made.
- Integration: USB helper may track offscreen contacts while results are discarded,
  so reset on entering upload context recognizes and gates a finger already held.
  Always feed releases/cancellations to clear tracking; honor commits only in the
  upload context. Feed cancelled pointer events explicitly and reset on interruption.
  A cancelled release must never be translated into a normal pointer-up.
  Keep explicit button/keyboard fallback and right-stick alternative for iPad.
- Polling metadata: real drive/inspect axis reports carry `actualSample:true`;
  synthetic neutral/paused/menu reports carry `actualSample:false`. The main UI
  must only feed real samples to the stick upload recognizer, so changing modes
  cannot arm a physically held stick through a synthetic neutral report.
- Verification: 10 gesture tests and 22 controller tests passed; scoped whitespace
  check passed. Covers direction/distance/duration boundaries, release-only/once,
  cancellation/reset, contact changes, invalid samples, stick neutral/hold/reset,
  packed USB identity and cleanup metadata. No browser/device playtest, commit,
  deployment or modification of the live game.
