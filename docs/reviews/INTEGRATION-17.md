# Integration review — FIX-17

Reviewed current shared working files read-only: `src/main.js`, `src/session.js`,
`src/engine/geology-tool.js`, `src/engine/fieldwork.js`, and renderer integration.
This review did not run a browser or physical controller.

## Actionable findings

- **P2: Evidence still loses the two readable findings.** `cancelScan()` clears
  `toolState`, and transmit/received rendering passes no samples to the upload
  terminal. `setEvidence()` correctly retains the inspected surface, brush mask,
  sample rings and traced paths, but draws no reading text. Keep two concise
  scene-derived reading labels near that evidence through transmit/receipt;
  avoid showing interactive tool controls. Check both scenes, including reload
  directly into transmit/received.
- **Verification: one existing geology test needs the newly required release.**
  Running `tests/engine/geology-tool.test.js` fails its second test at line 24:
  it expects the second sample while pressure is carried continuously from the
  first. The new runtime correctly remains in sample stage. Update the test to
  assert continuous pressure cannot earn sample two, then release and measure it.

## Checked invariants

- Renderer reset already clears evidence and retained tool before and after
  deactivation. A fresh restart cannot reuse that cached engine.
- `restoreWork()` clears `pendingCheckpoint` before activating a restored tool.
  The synchronous `tool-sample` event therefore cannot repeatedly restore itself.
  Completed-tool restoration can cause nested rendering and advance OBSERVE,
  but it remains the same scene; no infinite recursion was found by source review.
- Position restoration precedes waypoint and arrival restoration. Grounding is
  synchronous; late model geometry loading grounds the current position again.
- Earned survey steps survive checkpoints and pause. Unfinished hold is dropped
  deliberately; renderer-relative origin is re-established on reload.
- Geological saves restore durable cleared cells, path points, samples and cursor.
  Input, unfinished dwell and release readiness are reset safely.
- Main calls evidence after contact setup; renderer imposes its closeup at final
  render, so contact camera/tween updates cannot displace the visible evidence.
- Session and fieldwork test files passed. Geology test file passed eight of nine
  tests, with the stale release expectation described above.

## Limits and minor risks

- Legacy `choose` auto-migration saves before pending physical restore. The
  pending in-memory checkpoint still restores, and the Begin handler saves again,
  so ordinary execution ends correctly; an exception between these operations
  could leave a save temporarily missing restored physical work. Restoring first
  would simplify that ordering, but this is not a demonstrated gameplay defect.
- No GPU/material benchmark, pointer direction browser check, physical pad check,
  or reload journey was performed in this review. Root owns those checks.


Root resolution: both findings now remain in the send/receipt UI. The obsolete
continuous-pressure test was replaced with an explicit release-gate regression;
all engine files pass. Root also verified legacy saves/Skip evidence framing and
browser persistence. Detailed coverage is in docs/VERIFICATION.md.
