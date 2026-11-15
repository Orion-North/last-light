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

## v0.8 trigger sending and central story — November 14, 2026

- Old swipe/stick upload runtime and tests removed. New deterministic squeeze
  checks cover held entry, actual vs synthetic neutral, both-trigger requirement,
  early release, bounded frame time, one-shot commit and feedback detents.
- Controller tests include raw pressure, neutral camera/travel in uplink,
  adaptive report ramp/release, stale pressure and lifecycle resets. Terminal
  tests retain partial/no-reply/archive semantics and input alternatives.
- Local browser fixture injected a test-only standard gamepad through a separate
  test page (excluded from production builds). Half pressure showed .488 progress;
  one trigger left progress zero; pause/resume while held required both released;
  full pressure sent once and reached Earth receipt. CSS cursor resolved to none.
  This validates input/UI integration, not actual controller force or vibration.
- Production page checked central objective/story hierarchy, larger discovered
  science, desktop instrument fit, 820×1180 tablet layout and button/Enter sending
  while muted with reduced motion. Viewport reset; no captured warnings/errors.
- Windows shell policy tests and launch/package checks are recorded in
  handoffs/WINDOWS-08.md. CI must pass the actual Windows executable smoke before
  publishing the ZIP. USB hardware, force feel and unsigned-app behavior require
  the user's Windows playtest. No native HD haptic audio is claimed.

## v0.9 compression, release, and trigger crescendo — November 14, 2026

- Sending requires a fresh neutral, both triggers at .82 for .55 seconds to charge,
  then BOTH physically released. Charged holding has no deadline. Early release,
  malformed/synthetic input, pause and disconnect cancel without sending.
- Main now starts departure feedback after input-mode cleanup, preventing the
  mode transition from immediately cancelling it. Real reply feedback runs only
  after the reply, never for partial, silent or archived outcomes.
- New original-DualSense USB sending uses researched standard zoned feedback
  (21) and vibration (26), with exact block tests. Late charge vibrates, charged
  confirmation lasts 180 ms, then rests with resistance. Later low-signal scenes
  increase effort; archive returns to zero effort. No success thresholds change.
- Sound's final hold crescendo shares charge progress; held-charge sound settles
  rather than restarting. The central memory band, independent pressure plates,
  visible release and separate returned receipt replace the circular overlay.
- All 99 tests across 15 test files passed in direct Node test execution;
  the sandboxed child-runner gave a generic file error, so each file was run
  independently. Source/asset checks (36 JS files, 12 scene contracts), static
  build and whitespace checks passed.
- Isolated browser fixture verified held entry, one-trigger/half-pressure states,
  charged indefinite hold, one-trigger release remaining charged, both-trigger
  release sending once, and paused-held resume requiring fresh release. Final
  composition also checked at 1280×720, 820×1180 portrait, and 844×390 landscape.
  Screen button alternative reached a distinct Earth receipt. Browser error/warn
  logs were empty. No test operated the user's public playtest or physical pad.
- Software tests verify encoded output and lifecycle, not physical sensation.
  User previously confirmed USB haptics working in Chrome on CachyOS; the new
  stronger resistance, trigger vibration and story progression need their feel
  test. This remains browser rumble plus USB trigger effects, not native audio
  driven HD haptics. Web and Windows release results are recorded externally.

## v0.10 immediate feel, story clarity and desktop realism — November 14, 2026

- Sending receives independent raw left/right pressures. After a fresh neutral,
  either side activates above .03 with zone-0 USB vibration; the other side stays
  disengaged until pressed. Ordinary rumble also starts early. Amplitude is 5–7
  initially and 7–8 later; stronger feedback never changes success thresholds.
  Release, pause, missing telemetry and disconnect still clear feedback.
- Separate Sol agents examined haptics, narrative, player comprehension and
  graphics. Review-driven fixes include a visible first camera reveal, distinct
  horizon/ground previews, unique choice descriptions, chosen meaning retained
  in sending, route labels, and an explicit Earth-side handover after last contact.
  Earth scenes use a fixed distant remembered view; there is no claim of a live
  camera from Earth. The archive acknowledgment follows each selection.
- Independent review found a paused handover blocking its camera tween and an
  old memory preview persisting into the next scene; integration fixes cut the
  role view immediately and restore rover framing on a new travel scene.
- Lighting follows sky and ground palettes, wheel contact follows slopes, rubble
  uses rendered ground heights, shadows follow travel and sediment variation
  reduces tiling. Desktop rendering uses pixel-ratio cap2, 2048 shadow map and
  anisotropy up to8. No new assets/dependencies or draw calls were added.
- The user withdrew iPad targeting. Existing fallbacks remain; this pass tests
  desktop/browser/Windows with controller-first interaction.
- 103 tests in15 files pass in direct bundled-Node execution, including all2,048
  choice paths/save compatibility, exact trigger bytes/early side activation,
  lifecycle cancellation, route reversal and historical outcomes. Source/asset
  and static-build checks pass. Hardware feel and subjective story clarity still
  need user playtesting; no physical output was sent during automated QA.
- Isolated browser checks confirmed first-view reveal and different ground/horizon
  framing, meaningful choice-to-send continuity, .04 one-trigger instruction,
  charge/release/receipt, explicit contact-loss passage and immediate remote view,
  Earth→Opportunity route and unanswered result, return to close travel framing,
  and assisted arrival with no renderer/shader warnings or errors.
- A final review added landmark projection: the directional marker follows the
  actual world target even off-screen, updates while traveling, and hides at
  arrival. Desktop screenshot retained as last-light-v10-desktop.jpg outside the
  repository. No iPad pass was performed after its target was withdrawn.

## v0.11 — manual fieldwork, spatial signal and composed score

- 111 tests across 16 engine/desktop files pass. Source validation checks 39 JS
  modules, 12 scene contracts and assets; static build and whitespace check pass.
  The 2,048 legacy archive paths still round-trip; new recorded observations
  preserve IDs. Survey tests cover every authored target, interrupted holds,
  stalled frames and overlapping bearings that must require new movement.
- PLAY-11A completed the entire frozen v0.10 baseline in an isolated browser,
  muted, with six assisted travel legs and two assisted geology observations;
  first/final sends used simulated analog triggers. Ending and eleven archive
  records were observed. See its candid report; this was not a full manual route.
- PLAY-11B and PLAY-11C could not access browsers. Their reports are explicitly
  source/engine critiques, not full playthroughs or audio auditions.
- Integrated v0.11 targeted browser checks: manual first-site travel and arrival,
  fixed-eye sky aiming/steady recording, automatic archive selection, both-trigger
  charge/release, visible partial outgoing signal, incomplete receipt, Earth
  handover and reversed Earth-to-Mars call. Final sky observation was retested
  after reducing it from three bearings to one sustained view. No physical
  controller or user's public playtest tab was used.
- Improved drive camera follows rover heading; a world marker and explicit
  rover-relative steering guide support manual travel. Autodrive/API/path planner
  are removed. Blocked-wheel text supplements existing rumble.
- New original authored score sections and synthesis/mixing changes pass mocked
  graph/lifecycle and musical-structure tests. They have NOT received a listening
  audition or speaker/headphone mix certification in this session.
- The whole final revised journey, physical haptic feel and emotional quality
  still require player testing. Relative mast bearings are authored interactions,
  not scientific raycasts; travel, link diagram/time and views are dramatizations.

Follow-through: PLAY-11A manually drove the revised build from origin to Last
Chance, then onward to Berry Bowl, completing BOTH investigations without Skip.
Root independently verified the newer chase camera, rover-relative guidance,
manual arrival and deliberate layer observation. No runtime warnings/errors in
root's isolated fixture. The science remains an authored reconstruction viewed
from different angles; it is not yet an interactive brushing/tool simulation.


## v0.12 — brush, sample, compare and the missing musical reply

- Root completed a fresh browser journey from Start anew through ending and the
  eleven-memory archive. All six drives were manual; both geological tools used
  actual brush sweeps, two distinct measurements and explicit comparison. All
  five mast surveys used genuine aim/hold input. No observation or driving skips,
  scene jumps or reloads during the journey. Brief passages used Continue.
- Simulated DualSense input with no actuator and actual keyboard driving/aiming;
  genuine squeeze/release checked early and at marathon, button sends elsewhere.
  Berry pause preserved brush coverage; reduced-motion sending remained readable.
  Ground chosen at the beginning was correctly recalled during the storm.
  Partial image, reversed Earth calls, missing reply, archive and ending verified.
  Browser console returned no warnings/errors. Sound enabled, but no listening or
  physical-feedback assessment is claimed.
- Final separate seeded checkpoint (not part of the fresh run) verified the
  corrected release provenance: entering with R2 held did not brush; pausing with
  R2 held preserved 36% progress and blocked further work until an actual release.
  The normalized progress label and explicit stop-moving instruction were checked
  on the final source. Pointer steadiness and synthetic-neutral behavior also
  have meaningful engine regressions.
- 120 tests across 17 engine files pass. Agent check/build: 43 JS syntax checks,
  12 scene contracts, assets/GLB/license checks and static build pass.
- Independent Sol source/music review plus recorded-run critique are in
  reviews/TOOLS-12.md, reviews/PLAY-12.md and handoffs/SOUND-12.md. Review agents
  had no browser access this pass: they did not independently play the full run.
- Remaining design critique: strengthen physical tool/contact presentation and
  make the final incomplete image visible beyond the signal diagram. Immediate
  Continue can intentionally cut short an answering phrase; no forced wait added.
  Audio mix, emotional impact and physical trigger feel require human playtesting.


## v0.13 — distinct tools, trigger-only controller sends and stronger USB effects

- 124 tests across 17 files pass; 34 controller tests include decoded light-press
  amplitude bounds, independent sides, strong charged force and stale cleanup.
- Root browser regression (simulated pad, no physical actuator) verified that
  Cross and Enter cannot send while connected; pause during a charged hold
  cancels safely; only fresh charge/release sends. Cross still continues after
  receipt. Ready screens contain no controller send button.
- Root manually drove the sequential Last Chance and Berry Bowl routes. Traced
  both spatial paths with actual aim/R2, released between paths and compared;
  then brushed Berry Bowl, took two distinct steady readings and compared. No
  investigation skips. Repeated Cross after comparison could not send.
- Separate seeded Earth-call checkpoint: Cross blocked, disconnect paused, resume
  restored pointer/keyboard send, reconnect removed fallback. Found/fixed stale
  trigger hints when a PlayStation glyph override was set without a connected
  pad; reloaded final source showed Enter:Call and keyboard call reached NO REPLY.
  Both browser test sessions had no captured warnings/errors.
- This is targeted v0.13 verification, not another full ending playthrough. The
  preceding v0.12 full manual journey remains recorded above. Independent Sol
  critics reviewed source and attributed root UI evidence; their browser access
  remained unavailable. Screenshots saved beside the repository in outputs.
- Stronger USB output is verified as bounded protocol commands, not a subjective
  hardware measurement: maximum supported vibration amplitude from first press,
  55–85Hz frequency, finite confirmation followed by strength7–8 held feedback.
  Actual physical feel still requires the user's wired DualSense playtest.


## v0.14 — stronger resistance, cleaner UI and new icon

- Feedback21 requests maximum supported strength 8 on all ten zones from each
  trigger's first pressure above .03, through charging and holding. A finite
  180 ms charged vibration replaces it briefly, then maximum resistance resumes.
  Input thresholds, ordinary rumble and terrain feedback remain unchanged.
- 125 engine tests pass, including 34 controller and 9 terminal tests. Decoded
  reports cover modes, strength, independent sides, finite confirmation, stale
  telemetry and interruption cleanup. Independent Sol reviews found no blocker
  (reviews/FEEL-14.md and reviews/TEXT-14.md).
- Root targeted browser check used a seeded first-send checkpoint and simulated
  pad without a physical actuator. Cross could not send; charging and releasing
  reached sending, receipt and Continue. Manually drove to Last Chance and opened
  tracing. Clean terminal, navigation, tool instructions and final title were
  visually checked; no captured browser warnings/errors. This was not another
  full ending playthrough. The v0.12 full journey remains recorded above.
- Removed repeated HUD strips, terminal labels and tool captions while retaining
  the current action, meaningful story lines, directions and controller prompts.
  Simplified-instrument disclosure remains available in the journal.
- Original rover/sunset icon is wired into browser links, the Electron window and
  Windows packaging. PNG sizes and ICO frames checked; desktop staging and
  permission tests pass. Native executable packaging is verified by release CI.
- Physical resistance and sound quality still require the user's playtest; this
  pass verifies bounded output commands, not measured force or sensory quality.

## v0.14.1 — remove motion suppression

User requested removing Reduce motion after confirming it caused missing effects.
Removed the checkbox, stored preference handling, OS media queries and landscape
suppression branches/API. Ordinary pause, hidden-document guards and explicit
immediate camera cuts remain. Sol implemented/reviewed landscape changes; root
reviewed integration. Current source/HTML has no motion-preference references.
All 17 engine test files, 43 syntax checks, 12 scene/asset contracts and static
build pass. Root browser checked the simplified settings menu, continue from
saved progress and in-game pause/resume; no captured browser warnings/errors.
No OS preference emulation, fresh full playthrough or physical haptic output was
performed for this small removal.


## v0.15 — Opportunity's inner voice

- One bottom terminal carries short imagined first-person thoughts, date and the
  current action. No speaker labels or duplicate top story headings. The signal
  diagram remains above; instrument use replaces thoughts with the working task.
  Contact loss clears the voice, including restored Earth-side saves.
- 132 engine tests pass, including reveal pause/rerender/cancellation, complete
  accessible text, absence of post-contact voice, controller-only sending,
  explicit missing/partial receipts and bounded audio lifecycle. All 46 JS
  syntax checks, 12 scene/asset contracts and static build pass.
- Root browser: fresh introduction, first camera/choice/send/receipt, manual
  driving to Last Chance and tracing-tool entry; pause during a new thought,
  mute and resume. Separate seeded final-image checkpoint checks Cross rejection,
  actual two-trigger charge/release, partial receipt and loss of the inner voice,
  Earth handover, recovery calls, archive and ending. Both test sessions had no
  captured browser warnings/errors. These are targeted checks, not a new
  full fresh playthrough or a new tool-completion regression.
- Three Sol agents contributed content, audio and critique. Independent critique
  reviewed source and the root 1280x720 receipt screenshot; it did not perform an
  independent playthrough. Terminal covers some lower terrain/rover but keeps
  the main subject and physical tracing paths visible in the checked views.
- No physical actuator outputs or subjective soundtrack listening test. New
  sounds are finite filtered-noise articulations, silent during transmissions,
  expected reply intervals and explicit silence. Human playtesting must judge
  emotional effect and the final audio balance.

## v0.15.1 — unboxed presentation

Removed story/ending panel backgrounds and borders, filled choice cards and
gameplay button backing. Thoughts and actions sit over the world with text
shadow; focus uses an underline and corner controls retain 44px hit areas.
Root checked the opening, camera choice, keyboard selection, send/receipt and
icon-only keyboard focus at 1280×720; no captured browser warnings/errors.
Source/asset checks and static build pass. Independent Sol source review found
no blocker. This CSS-only pass did not repeat a full journey or hardware test.
