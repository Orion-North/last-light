# First playable verification

Recorded November 14, 2026. This is a prototype verification record, not a claim
that every browser, device, or accessibility configuration has been certified.

## Automated checks

- Node syntax and content/asset validation: local scripts, 12 scene contracts,
  referenced entry assets, vendored license, and embedded NASA GLB textures.
- Game state tests: legal progression, invalid events, immutability, memory
  persistence, pause/resume, restart, and optional audio behavior.
- Session tests: all **2,048** combinations of the actual 11 choices reach the
  epilogue with distinct archives of 11 memories. All legal save phases round-trip;
  malformed or inconsistent saves are rejected and state is reconstructed canonically.
- Music tests: user-gesture startup, nonzero instrument buffers, cancellation on
  mute/pause/hidden tabs, no accumulated backlog, both narrative silences, return
  of the theme, one scheduler, and teardown. These use a fake audio clock/context;
  they do not establish subjective musical quality or device loudness.

Run `node scripts/check.mjs`, `node tests/engine/game.test.js`,
`node tests/engine/session.test.js`, `node tests/engine/music.test.js`, then
`node scripts/build.mjs`.

## Browser observations

Tested in the available Chromium-based in-app browser at desktop size and a
390 × 844 viewport. The loaded game renders the textured NASA rover in a real
WebGL environment. Completed the story from discovery through loss of contact,
Earth's recovery effort, and the personalized ending.

- All six assisted routes arrive and unlock the relevant observation.
- Keyboard/on-screen drive input, camera controls, explore/story toggling,
  observation/choice/transmission, and disabled driving after contact ends checked.
- Progress survived reload/continue, including the completed ending.
- Settings pause, sound toggles, reduced motion, and replay checked. Replay resets
  the story, memory count, rover location, camera, and route state.
- Downloaded `last-light-my-memories.txt` and inspected its actual text; it includes
  chosen memories, fiction/mission context, and source links.
- Final browser startup/replay produced no captured warnings or errors.
- Fixed issues found during integration: permissive save restoration, blocked
  graphics-fallback progression, audio failure reporting, moving-camera drift,
  small-screen missing button icons, and conflicting keyboard input ownership.

## Limits and follow-up

- Actual iOS/Android hardware, Safari/Firefox, low-end GPU frame rates, and slow
  network behavior remain untested. WebGL 2 is required for the intended 3D mode.
- The graphics-failure story fallback was reviewed in code, not tested by forcing
  a real GPU/context failure. It is a labeled accessibility fallback.
- Browser audio startup and scheduling were checked; a human listening pass and
  final speaker/headphone mix are still needed.
- The 10–15 minute duration is a design target, not a measured audience study.
  Emotional impact requires human playtesting.
- Terrain, rover travel, interior thoughts, Earth replies, and power/signal values
  are dramatized. The original NASA model is a static mesh; its wheels are not
  independently articulated in this first version.
- The game itself needs no account or backend. The initial hosted preview is
  owner-private; public hackathon sharing is a separate hosting decision.

## v0.2 controller and experience revision

- Controller mock tests cover deadzones, button edges, reconnect latching, menu
  input while paused, blur/hidden/disconnect cleanup, stale terrain, vibration
  coalescing, USB descriptor rejection, serialized reports, reset bytes, output
  failure, and original-DualSense matching. Two surface tests distinguish flat
  ground, uneven ground, smooth incline, and blocked contact.
- Browser checked compact gameplay, scan/choice/immediate-send, assisted arrival,
  optional journal, settings and phone viewport. Legacy saves remain compatible;
  original story-path tests still cover all 2,048 memory combinations.
- Physical DualSense input, vibration feel, adaptive resistance, and OS HID
  access are **not hardware verified**. Browser `dual-rumble` is not native PS5
  waveform haptics. Adaptive resistance is experimental and USB-original-only.
- This revision reduces mandatory reading substantially; duration and emotional
  pacing must be measured again with players.

## v0.3 discovery, contact, and iPad preparation

- Syntax/content/asset checks and all seven behavior-test files pass. New tests
  cover journal unlock/resume, partial/silent/archive contact modes, selected
  ending memories, and cancellable/reentrant waits. All 2,048 story paths remain
  covered by the existing session suite.
- Completed the revised journey in the local Chromium browser, including all
  six assisted routes, partial-image receipt, unanswered Earth calls, immediate
  archive remembrance, and the ending's actual selected memory titles.
- Checked sound-off progression, keyboard interaction, journal before/after
  discovery, resume at an inspected target, cancellation during transmission,
  restored Send focus, reduced motion, and phone portrait/landscape layouts.
- Corrected geometric-looking geology, portrait inspection cropping, repeated
  controller-primary input opening Journal during a wait, and lost Send focus
  after a cancelled wait. No captured browser warnings/errors at journey end.
- iPad touch layout supports 48px targets, safe areas, mixed touch/controller use,
  and explicit larger-controls setting. The renderer caps pixel ratio at 1.5.
  Tablet-size browser checks are recorded in the release handoff when complete.
- No claim of physical iPad Safari FPS, battery/thermal behavior, physical haptic
  quality, or subjective emotional success. Those require the user's playtest.
