# TOUCH-04 — optional USB touch and controller scrolling

- Owned changes: `src/input/controller.js`, `tests/engine/controller.test.js`,
  append-only section in `docs/CONTROLLERS.md`, this handoff.
- New callbacks: `onTouch({x,y,active})`, normalized [-1,1], Y downward; and
  `onScroll(deltaY)`, signed pixels from menu right-stick Y. Both optional.
- USB touch attaches only to the existing explicitly selected original DualSense
  USB HID device. No automatic permission request; no Bluetooth, Edge or generic
  report parsing. Uses the Sony-authored Linux driver layout linked in controller
  docs. No library, source code or new asset was downloaded/copied.
- Touch releases on pause/disable/blur/hide, gamepad replacement/disconnect, HID
  disconnect/close, destroy, and 250 ms stale input. Listener removed on close.
- Scroll works while paused in menu mode. Uses a 50 ms bounded frame delta and
  420 px/s speed; emits no drive/camera motion. Root must choose the current
  scrollable dialog or ending panel, and ignore scroll where inappropriate.
- Root integration: USB contact positions may aim the fictional transmission
  interface, with a separate explicit confirmation action. Touch never sends an
  action itself. Right-stick/screen fallback is necessary for iPad Safari and all
  non-WebHID environments. An already paused connection produces no active touch.
- Verification: 20 controller tests pass, including known packed coordinate bytes,
  both contacts, malformed/unsupported reports, explicit opt-in, lifecycle release,
  stale input, physical HID disconnect events, and bounded paused-menu scroll.
  Scoped whitespace check passed. No browser/device hardware test, commit or deploy.
