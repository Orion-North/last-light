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

## v0.4 draft — controller and world pass

- Automated: all ten engine test files passed, including new motion, investigation,
  controller glyphs, 20 controller behaviors (USB touch decode/cleanup and menu
  scrolling), and seven music cases. Syntax/content/entry checks passed.
- Isolated browser: both geological investigations reached the clear-view state
  using arrow-key camera controls and completed after holding steady; source
  interpretation appeared afterward. Scanned maps/sky rendered. Visual review
  identified wet-looking roughness and obvious distant repetition; corrected both.
- Browser found GLSL reserved identifier `patch`; renamed to `surfacePatch` and
  reloaded to verify terrain rendered again. Historical browser logs retain that
  earlier error; it is not a clean-log claim for the whole session.
- Multiple independent Sol reviews found and checked fixes for menu-mode driving,
  accidental Autodrive, held-stick context jumps, disconnect cancellation,
  investigation reset/assistance, touch-drag drift and focused-action dispatch.
- Not established: real iPad frame rate/memory, physical USB touch feel or haptic
  quality, subjective soundtrack balance, or emotional impact. Procedural sky,
  large teaching grains and visible radio guidance are artistic reconstructions.
- CONTACT browser checks: keyboard alignment reached quality1, Send unlocked,
  Enter began transmission, and pause/resume reset alignment without sending.
  Restored saved transmit phase entered the same physical aiming interaction.
  Later source review changed pointer motion to displacement, avoiding drift;
  physical USB coordinates remain tested against synthetic byte fixtures only.
- Final combined browser pass: normal-motion opening and uplink alignment completed
  muted; outbound packet appeared in-world, then Earth receipt arrived. Reduced
  motion had been checked in the earlier investigation/contact pass. No new
  captured warning/error appeared after the shader fix and reload. Final draft
  screenshot is saved outside the repo as `last-light-v04-draft.jpg`.
- Asset budget: public assets total18,943,571bytes, including5,075,233bytes of new
  scanned maps. Six1K maps use about32MiB decoded RGBA+mips before overhead;
  this is a budget estimate, not an iPad GPU measurement.

## v0.5 terminal upload — November 14, 2026

- 32 JavaScript syntax checks, 12 scene contracts, local asset and GLB checks passed.
- All 12 engine test files passed, including swipe release/cancel/identity/duration,
  slow screen drag, real vs synthetic controller samples, and terminal modes.
- Static build completed. Independent Sol review found no remaining critical issue.
- Local browser: upward mouse drag entered sending, then Earth receipt; held Enter
  across choice stayed ready; fresh Enter after pause/resume sent successfully.
  The latter run was muted with reduced motion. No console warnings/errors observed.
- Terminal checked at 1280×720 and 820×1180 portrait; temporary viewport reset.
- Physical DualSense touchpad, iPad controller input and haptic feel remain untested.
  Screen drag is verified; controller/HID paths have deterministic fixture coverage.

## v0.6 authored presentation and onboarding — November 14, 2026

- 34 JavaScript syntax checks, 12 scene contracts and referenced assets passed.
  All 13 engine test files passed, including paused briefing time, speed/braking,
  and uplink mode semantics. Static build passed.
- Three parallel Sol lanes researched professional game information design,
  implemented the interface and geology, and independently reviewed lifecycle.
- Browser: full opening completed; revised twelve-second opening paused, resumed
  after enabling reduced motion, and skipped with Enter to the same first action.
  Saved sessions resumed directly. First upload worked by drag; next by button.
- Both routes reached their targets. Manual keyboard drive moved the rover.
  Last Chance and Berry Bowl recorded after moving the view and holding still.
  Updated rock textures, grain size/material, brushed patch and close camera were
  visually checked. Final glyph-led control guide is at the left edge.
- Checked 1280×720 desktop and 820×1180 portrait; compact 390×844 uplink was checked
  before the final control-legend change and its overlapping telemetry removed.
  Temporary viewport restored. No browser warnings/errors observed.
- Real iPad GPU performance, physical DualSense gestures/haptics, and emotional
  impact still require the user's device playtest. Automated checks cannot prove them.

## v0.7 mission time and close framing — November 14, 2026

- Three Sol agents proposed narrative/sensory treatments and independently
  challenged chronology, scope and lifecycle. Selected two short rover passages;
  rejected extra errands and an additional Earth montage.
- 36 syntax/asset/scene checks and all 14 engine test files passed. Timeline tests
  cover 7-second/3-second durations, pause, invalid arguments and completion.
  Time content tests cover exact seam IDs, milestones, and age frozen after contact.
- Browser exercised the revised opening and first four discovery/send loops using
  driving/observation assistance for transition testing. First year passage
  appeared muted with reduced motion, paused in settings, resumed after disabling
  reduced motion, and reloaded into the saved 2015 destination.
- Browser found the restored received phase could leave a passage on a rock.
  Restored receipts and passage entry now explicitly use the close rover view.
  The later 2015→2018 passage visibly used that corrected frame; holding Space
  through its exit left the destination waiting for its first travel action.
- Mission age labels, subtler rover material and left glyphs checked at 1280×720
  and 820×1180. Viewport reset; no captured browser warnings/errors. No new
  textures, meshes or draw calls were added by the age treatment.
- Physical iPad performance, DualSense input/haptics and emotional effectiveness
  require device playtesting. This pass did not repeat the full ending playthrough
  or independently exercise every skip/pause permutation.
