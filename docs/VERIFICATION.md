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
- Historical Windows shell policy and launch/package checks covered the former
  preview. That wrapper and its workflow have since been removed; current
  verification targets the web game. No native HD haptic audio was claimed.

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

## v0.16 — delivery from the writers' room

Three Sol lanes implemented/reviewed the accepted treatment: sparse arrival
thoughts, physical comparison before sending, one geology interpretation after
receipt, wordless routine replies/departures, restrained final view and explicit
Earth recovery. Skipped/restored first observation retains the mission purpose;
completed introduction avoids repeating it. No panel or control mechanic added.

141 engine tests, 47 JS syntax checks, 12 scene/asset contracts and static build
pass. Tests cover silent travel/tool/departure/post-contact states, restored
ready/receipt phases, comparison-versus-interpretation ordering and renderer
fallback suppression. Source review: docs/reviews/IMPLEMENT-16.md.

Root browser verified skipped and uninterrupted intro, first choice/send/reply,
manual drive to Last Chance, actual tracing of both paths and comparison,
physical-result preparation, wordless departure and water interpretation receipt.
Seeded controller checkpoints verified Berry Bowl result/trigger charge-release/
receipt, single-thought eleven-year passage, wordless ordinary receipt, partial
last image, muted/skipped Earth handover and recovery call/NO REPLY. Earth receipt
restores without resurrecting the rover voice. No captured browser warnings or
errors. This is targeted verification, not a fresh complete playthrough; Berry
Bowl tool completion, soundtrack listening and physical actuator feel were not
retested. Emotional effect still requires the user's playtest.


## v0.17 — reliable work and continuous discoveries

Web-only. Fixed survey overlay clipping, Berry vertical controls, the missing
between-sample release, physical checkpointing and survey pause preservation.
Kept geological evidence and paired findings visible through sending/receipt;
reduced the signal display and broad darkening. Berry grains reuse existing rock
normal/roughness maps with varied colors/shapes; the floating prop is now an
explicit diagrammatic reticle. The ending includes the selected Earth archive;
automatic records describe performed observations. Tool motor pitch is audible
and normal score transitions preserve foreground replies, including passages.

Root browser checks at 1280×720 (plus storm survey at 900×720): all five surveys
completed through actual look input from seeded arrivals. Marathon retained its
first capture through settings pause and reload; smaller-world retained it through
controller disconnect/reconnect. Travel after reload retained the driven location
(11.9m remaining, rather than the start). Seeded first layer/sample checkpoints
were resumed and their second path/reading actually completed. Berry Down moved
the probe down. Comparison retained the rock, two findings and safe held-trigger
release gate. Full squeeze/release sent; Cross alone did not. Receipt/reload kept
the evidence view. Legacy saves without physical work also frame the correct rock.
Final sky observation, partial transmission, Earth handover, both recovery calls,
rover-story archive selection and ending were played consecutively from a final
sky checkpoint. The selected archive appeared in the main ending. No captured
browser warnings/errors in the inspected logs. These are targeted tests, not a
fresh uninterrupted complete journey or a performance benchmark.

21 engine test files pass, including new durable-work/release, archive variants,
foreground audio lifetime and missing-reply tests. Source/asset checks and static
build pass. Fake audio graph tests verify scheduling/cleanup, not perceived sound.
Three Sol agents implemented and source-reviewed separate areas. Their browser
inventory was unavailable; root performed the browser checks. Physical haptics,
subjective audio and emotional effectiveness remain human playtest limits.
Screenshots are retained in the workspace outputs as last-light-v17-discovery.jpg,
last-light-v17-survey.jpg and last-light-v17-ending.jpg; they are not web assets.


## v0.18 — layered cinematic score

Three Sol lanes composed richer material, built stereo instruments and reviewed
firsthand space-film scoring accounts. Root integrated and checked the real
browser output. Original notes and foreground signal contracts are preserved.

- All 23 engine test files pass. New checks cover connected polyphonic voicings,
  chapter contrast, bounded events/voices, seamless stereo buffer wraps, cache
  limits, asynchronous no-voice preparation, silent initial gain, finite looping
  source cancellation and reverb processor replacement at narrative/lifecycle stops.
- 54 JS syntax checks, story/asset contracts, static build and git diff checks pass.
- OfflineAudioContext in Chromium rendered seven chapter families, full and thin
  variations (14 renders), through the production instruments, room and compressor.
  All samples finite; nonzero stereo differences; peaks 0.05298–0.13418, no clipping.
  Discovery RMS 0.02096; storm 0.01027; fading 0.00363. These values describe this
  score-only render, not the complete score/effects mix or subjective loudness.
- Browser rendering caught a reproducible one-frame sunset onset spike (1.42856
  peak). Isolating dry instrument families located it at simultaneous note starts:
  a default-unity gain could briefly precede its scheduled zero. Explicit silent
  initial gains remove it; sunset now peaks 0.11236. This issue was invisible in
  the fake audio graph tests. The browser fixture retains isolation diagnostics.
- Local game smoke: sound enable, settings pause, close/resume and mute; no browser
  warning/error logs. Saved journey was not restarted or progressed by this check.
- No human listening or fresh complete game playthrough is claimed. The critic
  flags intimate Earth balance, pulse repetition and natural lead decay for the
  user's listening pass. This is synthesized original music, not sampled orchestra.

Reproduce with tests/browser/audio.html on the local server (excluded from static
build). Workspace outputs retain last-light-v18-audio-measurements.jsonl and a
29-second stereo discovery WAV/MP3 preview. The preview uses production score,
instruments, room and master processing, with wind/tool/radio sounds omitted.


## v0.18.1 — repair controller sending layout

User screenshot and independent Sol CSS review identified competing upload-dock
selectors: controller/touch rules kept left:50% and a wide dock after the narrow
story breakpoint removed its translation. Removed those redundant input-specific
position overrides so the canonical responsive story layout wins consistently.
Restored readable planet endpoints and path contrast; grouped the trigger gauges
and live instruction with the signal rather than left-aligning them under the
rover thought. The thought remains unboxed below the instrument.

Verification: all 23 engine test files, 54 JS syntax/asset/story checks and static
build pass. New local tests/browser/sending-layout.html measures 99 combinations:
11 viewport sizes (including 944x453, both sides of 1000/650px breakpoints and
844x390), three input classes and ready/sending/received. All dock bounds remain
inside the viewport without horizontal overflow; trigger and map centers align;
thoughts do not overlap the map. Real game simulated-controller check progressed
ready → full squeeze → charged → release → sending → reply received, with no
console errors. Physical haptics were not tested. Screenshot retained outside the
repository as outputs/last-light-v18-1-sending.png.


## v0.18.2 — stable signal position

The signal apparatus now has its own fixed viewport-center anchor; it no longer
participates in the height of the bottom thought/receipt. Trigger controls are
anchored immediately above it. The bottom narrative is independently bounded
and scrollable in short viewports. Evidence readings and recovery dates belong
there, so they cannot shift the signal either. The upload dock itself fills the
viewport without a transform, avoiding a transformed ancestor changing the
positioning reference. Only the actual instrument and story area intercept input.

The browser fixture now checks the map's exact horizontal and vertical center,
not just overflow: 11 sizes × 3 input classes × 3 stages × thought present/absent
= 198 passing cases. Upload rendering tests (14), source/assets and build pass.
The fixture preview is retained as outputs/last-light-v18-2-centered.png.


## v0.19.0 — controller continuity and story clarity

Fixed controller scrolling to use the actual bottom reading surface after the
centered-signal change. Right stick can scroll while preparing an uplink; pause
still blocks input. Long receipts bring the Continue action into view, and show
a controller reading hint when overflowing. Disconnecting during geology now
renders the pointer tool control without losing completed measurements; reconnect
restores controller prompts. The final-image thought names the obscured Sun and
remaining light, Earth buttons distinguish preparing a call from transmitting it,
and the ending displays the meaning of the selected archive memory.

Verification:
- All 24 engine test files pass, including new scroll-target and uplink input
  tests. Final source/assets check passes (56 JS files, 12 scene contracts, NASA
  model textures and vendor license); static build and diff whitespace check pass.
- Expanded real-browser layout fixture passes 120 responsive profiles across ten
  sizes, all four transmission modes, three input classes and varied narrative
  lengths/stages. All 49 overflowing profiles use the production scroll-target
  helper and reach their action without shifting the centered signal apparatus.
- Real game with simulated controller: resumed a seeded one-sample checkpoint,
  disconnected/reconnected, confirmed preserved measurement and pointer tool
  availability, measured the second surface, compared and transmitted findings.
  Pausing a fully charged squeeze reset commitment and required a fresh gesture.
- At 390px game height, right stick scrolled an actual received geology story
  from scrollTop 97 to 0 and back to 97; Continue remained reachable.
- Played consecutively from a seeded final-image send through partial receipt,
  Earth handoff, unanswered recovery, eight-month archive selection, final call,
  and ending. The non-default rover-story selection appears in both ending and
  journal; closing/reopening the saved game retains it. No console errors on this
  fixture run. Thin ending scrollbar visually checked in the real game.

Limits: seeded checkpoints cover targeted paths, not a fresh uninterrupted full
playthrough. Controller input was simulated; physical haptics and human listening
were not tested. Screenshot outside repository: outputs/last-light-v19-ending.jpg.


## v0.19.1 — photo download

Upper-right camera button exports the current 3D view as a timestamped PNG,
without HTML interface overlays. Rendering immediately before canvas.toBlob
avoids blank WebGL screenshots without enabling preserveDrawingBuffer. Button
is disabled until the rover loads and while encoding; errors are announced.

Real browser: downloaded two valid PNG files, from title (mouse) and a received
geology scene (keyboard Enter). Visually inspected the first export: rendered
terrain and rover, no UI, no blank buffer. The second download left the game at
the same receipt with Continue available. Corner placement inspected; no console
errors. Source/asset checks, static build and diff whitespace check pass.


## v0.19.2 — readable mission text and visible photo capture

Main mission/action/trigger prompts are 18px; thoughts 18–22px, mission dates
12–13px, controller hints 14px and supporting sample readings 15–16px. Retain
transparent presentation, move the footer into flow to prevent collisions, and
keep the signal independently centered. Photo capture now plays a 420ms dark
shutter over the DOM and shows a temporary visible/live success or failure
message. Export remains the clean WebGL view. A small original SVG rover replaces
the star beside Last Light, as requested.

Sol provided an independent read-only typography/layout review. Browser checks
initially caught narrow-screen overflow from the enlarged Deep Space Network
label; allowing wrapping fixed it. All 120 responsive profiles pass, with 71
scrolling cases and exact signal centers retained. Real-game receipt/action
layout and travel objective (computed 18px) visually checked. Capturing visibly
closes/reopens the shutter, shows Photo downloaded, clears feedback, and leaves
the receipt unchanged; Continue then progresses normally. No console errors.
Source/assets checks and static build pass. No physical-controller or fresh full
playthrough claim. Screenshot: outputs/last-light-readable-ui.jpg.


## v0.19.3 — rover and camera rock clearance

Replace undersized circular checks with the scaled model's rectangular footprint
and transformed world bounds for rock instances, landmark meshes and talus.
Substantial rubble participates; tiny decorative gravel stays traversable. Sweep
translation and rotation together; blocked motion can reverse out. Embedded old
saves find nearby clear ground. Camera tether checks expanded rock bounds with
near-plane clearance, including a final uphill-ground clearance pass. This is
conservative collision geometry, not a rigid-body wheel suspension simulation.

Sol independently reviewed turning, save recovery, landmark approach and camera
risks. Eight deterministic collision tests cover turning corners, thin obstacle
sweeps, reversing, embedded saves, world edge, camera tether/height, evidence
targets and uphill clearance. All 25 engine test files, source/assets check
(58 JS files) and static build pass.

Real renderer fixture tests/browser/rock-collision.html verifies both landmark
approaches stop, remain within the arrival halo, reverse away and recover a save
placed inside the landmark. Last Chance stops at z=-6.488 and Berry Bowl at
z=-8.477 on the tested approaches. Fixture initially cleared its contact flag
when calling stopDrive before reading it; corrected to retain the contact result.
Orbit beside Last Chance and Berry Bowl evidence view visually inspected; no
console errors. Targeted tests, not a fresh complete route or physical controller
playthrough. Screenshot outside repo: outputs/last-light-rock-clearance.jpg.


## v0.19.4 — correct overly broad hitboxes

The previous whole-rover rectangle treated solar panel overhang as solid down
to the ground, while rock AABBs filled empty corners. Rover collision now uses
height-aware convex outlines from the model geometry. Disconnected geometry
islands within each imported material group remain separate, so the spaces
between wheel assemblies do not become solid. Cheap parent bounds precede
the detailed checks. Rock outlines use visible vertices, with protrusion tested
against terrain at each point; <=0.20m loose stones stay traversable. Landmark
meshes get separate hulls. Camera collision remains unchanged.

Blocked turning no longer cancels an otherwise clear translation/reverse escape.
The original center-based radius-19 exploration boundary is restored instead of
stopping deck corners early; its message distinguishes the boundary from rocks.

Independent Sol review identified boundary, buried-geometry and disconnected
model-component risks, all addressed above. Twelve collision tests include empty
rock corners, panel clearance, between-wheel clearance and reverse-with-turn.
All 25 engine files, 58 source/asset checks and static build pass. Actual-renderer
fixture passes both landmark contacts, arrival zones, reversing and embedded
saves. Last Chance now passes the old false stop at z=-5.091 and reaches z=-7.107;
Berry Bowl reaches z=-9.736 on the tested approach. No console errors. Targeted
regression testing only, not an exhaustive terrain traversal or physical-pad run.
Screenshot: outputs/last-light-tight-hitboxes.jpg.


## UI-30 — v0.19.6 placement and controller journal

- Three Sol agents reviewed layout, controller input and integration. Corrected a held-button/context leak; added three engine regressions.
- Actual production game in private-save `tests/browser/ui-review.html`: simulated Square opens/closes memories; Cross expands entry; D-pad selects entries/links; right stick scrolls long journals; Circle closes and restores useful game focus. Tool comparison resumes after closing journal. Settings → restart → cancel preserves controls and labels. Triangle has no action; no Triangle glyph or Keep them export remains.
- Visual checks: tools at 1280×720 and 960×540, centered send plus journal at 960×540, scrollable ending below header at 960×480, journal/settings at 1440×900. No overlaps in these views.
- All 25 engine test files, 62 JS syntax checks, 12 scene contracts, static build and diff whitespace check passed. Hardware vibration and physical-controller feel are not established by the simulated Gamepad.
- During rapid test-fixture scene replacements, aborted old GLB loads logged texture errors; one premature Start click in the fixture also failed before the ready guard was added. Completed scene checks rendered successfully.

## JOURNAL-31 — collapsed-entry navigation correction

UI-30 did not cover moving between multiple collapsed entries and did not fix that reported problem. Reproduced it with eight journal entries: Down stayed on the first collapsed summary. Fixed target filtering to exclude hidden contents even when the browser returns layout rectangles. In the actual renderer with simulated Gamepad, verified six sequential Down steps, seven Up steps, and held left-stick traversal with all eight entries collapsed; selection and automatic scrolling work without expanding earlier entries. New regression tests cover closed entries, expanding/re-collapsing, and nested closed ancestors. All 26 engine test files, source checks and static build pass.


## CAMERA-35 — v0.19.9 survey zoom correction

The camera collision tether was treating a survey gaze target as an orbit pivot, pulling the eye toward nearby rocks. Survey now uses endpoint/near-plane clearance only. Its transition resolves a reachable destination with matching aspect-dependent padding, and OrbitControls no longer clamps a survey transition. Normal driving/orbit collision behavior is unchanged.

Added fixed-eye obstruction and endpoint-clearance regressions. The actual-renderer fixture recorded 67 survey samples with eye drift 0.0000 near Last Chance. The isolated production-game fixture completed ordinary-day after controller pause/resume, both marathon views and the skyward dust observation through simulated right-stick input. All 26 engine files, 64 JavaScript syntax checks, scene/asset checks and static build pass. Independent Sol review incorporated. This is targeted camera verification, not a complete playthrough or physical-controller test.


## TOOLS-36 — v0.19.10 tactile geology

Geology and controller agents implemented disjoint lanes; a third Sol review checked integration and identified a sequence-lifetime bug, now covered by new-tool/restart tests. Nearest-dot transitions are separate from visited-dot coverage; fast movement counts crossed contacts, while idle jitter/off-path motion stays quiet. Brush motion uses cursor displacement, including pointer movement and clamped-boundary stillness.

Adaptive R2 uses documented zoned 0x21 resistance for 20ms dot attacks, with at least 16ms relief; high-rate contacts coalesce rather than queue. Brush varies documented 0x21/0x26 grains with movement, pressure and spatial texture. L2 stays disengaged. Standard rumble fallback is finite. Existing transmission behavior remains unchanged.

`tests/browser/tool-feedback.html` runs the production game with isolated saves, a simulated Gamepad and fake USB output device. Verified 14 distinct tracing contacts, resistance requests, relief gaps, variable brush reports, L2 neutral, movement stop, trigger release and pause cleanup. Browser testing establishes integration/report timing only, not physical force or OS HID access. Unit regressions cover reverse/jitter/fast contacts, new producer/pause baselines, stale packets, interruptions, brush bounds and fallback. All 26 engine test files, 64 JavaScript syntax checks, scene/assets and static build pass.


## PHOTO-37 — v0.20 discovery camera (2026-11-15)

Three GPT-6.1 Sol lanes implemented the renderer camera, immersive presentation
and primary-source assets; root integrated and reviewed. Both science scenes
now support fixed-eye framing, clean cropped WebGL capture, retake, sending and
a dissolve to an original NASA observation. The UI was reduced after user review
to a reticle/actions and discreet original-image credit; science remains in the
journal. Two JPEGs add 87,791 bytes.

Observed browser checks (production runtime through isolated fixture):
- Last Chance and Berry Bowl: readiness, keyboard framing, actual canvas blob,
  pause-preserved capture, retake, transmission, NASA image decoding and saved
  receipt; Berry Bowl also used a simulated controller face-button send.
- Actual restored completed layer investigation → compare → camera handoff.
- Seven edge checks pass: legacy choose save, assistance cancel/confirmed
  provenance, intro primary/Enter protection, received reload, capture failure,
  WebGL failure, NASA preload failure and continued progression.
- Receipt layout at 390×760 and 960×480: no horizontal overflow; Continue
  remains in viewport. Portrait photograph preserves aspect ratio.
- 27 engine test files, 67 JS syntax checks, scene/asset contracts and static
  build pass. Inline test fixtures syntax checked separately.

The browser harness isolates saves and holds document visibility while testing
manual pause dialogs. These checks do not establish actual background-tab
suspension, physical controller feel, every mobile device, or a fresh complete
beginning-to-ending emotional playthrough. Existing save checkpoints preserve
fieldwork; an unsent camera frame is retaken after reload instead of persisting
a large image in localStorage. NASA image failure never blocks Continue.

## UPLINK-38 — v0.20.1 original sending restored (2026-11-15)

Capture now leads through a 1.4-second authentic-image dissolve and 0.7-second
handoff into the existing upload terminal. The original terminal HTML, Mars/Earth
map, moving packets, call/reply motif, transmission audio and trigger gesture are
reused. A small source-linked photograph accompanies the terminal on large screens;
compact layouts prioritize the signal instrument. No new explanatory prose is added.

Both science-scene browser lifecycles pass: real capture, pause during reveal and
handoff, blocked premature sending, retake, original map and receipt, decoded NASA
photo and saved receipt. Berry Bowl also passes simulated face-button sending.
The independent Sol review found and resolved stale readiness on retake and
controller activation of the source link. Timeline unit checks cover ordered stages,
paused time, background-stall clamping and reduced motion. 28 engine test files,
69 JavaScript syntax checks, scene/assets and static build pass.

As before, simulated input and isolated saves do not establish physical controller
feel or actual background-tab behavior. No fresh full story playthrough was run.

All seven recovery cases also pass, including historical-image fallback followed
by the original two-trigger send and missing NASA imagery followed by Continue.
The trigger fixture waits for actual ready/charged states instead of assuming
850 milliseconds guarantees enough rendered samples on a slow preview device.

## IMMERSION-39 — v0.20.2 uncluttered capture flow (2026-11-15)

Three GPT-6.1 Sol lanes handled presentation, browser fixtures and independent
review. Retake and its runtime path are removed. The camera keeps the reticle,
scene label and one capture action; redundant help and alignment grading are gone.
The authentic photograph fades toward Mars, then clears completely. The original
signal apparatus, trigger charge/release, musical call/reply and receipt remain.
Repeated science readings and persistent photo/source panels no longer occupy the
uplink. Full photo credit and provenance are available in Memories. The discovery
button says Send. Loading imagery gets a bounded, pause-safe wait; failures never
trap the player.

Both discovery lifecycle browser checks pass, including keyboard aiming, captured
WebGL frame, authentic photo during reveal, pause during both transitions, early-send
protection and original Mars/Earth receipt. Berry Bowl uses a simulated controller
face button. Checks explicitly reject Retake and persistent photo panels. The
journal's original-photo link and full credit were observed. 28 engine test files,
69 source syntax checks, scene/assets and static build pass; the image-wait regression
also passes. Physical controller feel and a full fresh story playthrough are untested.
Received-save reload also passes with the original receipt and no photo panel.
