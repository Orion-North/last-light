# PAD-04 — controller input modes

- Owner: Codex PAD-04 subagent; shared `develop/v0.4` checkout.
- Changed paths: `src/input/controller.js`, `tests/engine/controller.test.js`,
  this handoff, and the assigned `docs/reviews/CONTROL-04.md` review.
- API: `setInputMode('drive' | 'menu' | 'inspect')`; default remains drive.
  Invalid/repeated modes are no-ops.
  `rearmMenu()` resets navigation to its neutral gate for a new same-mode menu
  context; call on actual screen/phase/modal changes, not render refreshes.
- Drive: existing axes, triggers and look unchanged. Inspect: drive axes neutral,
  right-stick look retained while unpaused. Menu: all continuous input neutral;
  left stick generates nav actions even while paused. D-pad/face buttons remain
  usable in paused menus.
- Stick navigation: neutral gate <=0.3 after entering mode, reconnect, blur or
  visibility changes; engage at 0.6, release below 0.4. Dominant axis picks
  direction. First repeat after 350 ms, then 140 ms; at most one repeat per poll.
  Focus/visibility changes latch held face buttons to avoid return-time actions.
- Explicit Xbox/XInput/Microsoft IDs are excluded from original-DualSense USB
  matching, including names containing “Wireless Controller.”
- Checks actually run: all 17 controller tests passed with Node's built-in runner.
  Added paused-menu neutrality/repeat, hysteresis, transition/reconnect gating,
  blur/hidden ghost suppression, inspect look, drive restoration and Xbox-name
  coverage, plus explicit rearming across same-mode paused contexts. Scoped
  `git diff --check` passed.
- Integration: root must set modes for traversal, inspection and menus; pause
  does not itself change mode. Repeated same-mode calls do not reset navigation.
  Menu emits no right-stick input, so continuous dialog scrolling would require a
  future explicit scroll channel. No browser/physical controller test performed.
- No commit/publication. Awaiting root integration for a second code audit.
