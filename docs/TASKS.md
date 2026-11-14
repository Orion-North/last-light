# Task board

Phase: **v0.12 integrated and verified; publication owned by Codex**.
Integrator: Codex. Claude and Antigravity are supported by shared instructions;
Antigravity CLI critique has been verified.

| ID | Work | Status | Owner | Result |
| --- | --- | --- | --- | --- |
| SETUP-01 | Research, plan, repository, shared agent workflow | Done | Codex | Sources and reusable handoff/worktree conventions |
| CONTENT-01 | Complete three-act story | Done | Story agent | 12 scenes, sourced science, 11 player memories |
| CORE-01 | State progression and sound lifecycle | Done | Systems agent | Guarded phases, pause/restart, deterministic state |
| VISUAL-01 | Cinematic responsive interface | Done | Visual agent | Desktop/phone layouts, focus and reduced-motion treatment |
| 3D-01 | NASA rover and navigable terrain | Done | Systems agent | Real model, six routes, camera, terrain, lighting, dust |
| ASSETS-01 | Official asset research and attribution | Done | Story agent + Codex | NASA textured GLB, provenance ledger, vendored Three.js |
| MUSIC-01 | Original adaptive composition | Done | Story agent | Home motif, harmonic arrangement, dynamic layers and silence |
| QA-01 | State/save/music checks and browser playtest | Done with limits | Visual agent + Codex | All 2,048 choice paths, complete browser journey, archive download |
| RELEASE-01 | Static build and private playable URL | Done | Codex | Package the verified source and publish through Sites |

## Assignment record

Shared checkout on `main`, base commit `27a5b38`, with disjoint file ownership.
Codex owns shared contracts, root configuration, integration, task board, and release.

- CONTENT-01: story agent owned `src/content/story.js`, `docs/SOURCES.md`, and
  `docs/handoffs/CONTENT-01.md`.
- CORE-01: systems agent owned `src/engine/game.js`, initial `src/audio/sound.js`,
  `tests/engine/game.test.js`, and its handoff.
- VISUAL-01: visual agent owned presentation CSS and its handoff. Its original
  landscape lane was transferred to systems before the real-time 3D revision.
- 3D-01: systems agent owns `src/ui/landscape.js` and its handoff. Acceptance:
  textured NASA rover, controllable travel, reachable markers, stable camera and
  visible wheel contact. Final review verified wheel geometry and corrected
  detached shadows caused by excessive shadow bias.
- QA-01: visual agent owned `tests/engine/session.test.js` and its handoff;
  Codex owns browser verification and integration fixes.
- MUSIC-01: story agent took exclusive ownership of `src/audio/sound.js`,
  `tests/engine/music.test.js`, `docs/SOUNDTRACK.md`, its handoff, and the audio
  credit row after the initial systems handoff. Acceptance: composed identity,
  narrative arrangements, silence, optional audio, safe scheduling and cleanup.

No agent may independently publish or overwrite another lane. Future independent
agents should use separate worktrees and the shared handoff template.

## Next polish pass

- Listen on headphones and phone speakers; balance music, wind, and transmission cues.
- Measure actual iOS Safari/Android performance and load time; optimize the model
  if needed. The current desktop-browser phone viewport is not a hardware test.
- Human playtest for attachment, pacing, and whether the ending feels earned.
- Prepare the submission demo and decide public sharing and project licensing.

## Current v0.2 assignments

Shared checkout `main`, base commit `185720d`; disjoint file ownership.

- PAD-02 / Sol controller agent: `src/input/controller.js`,
  `tests/engine/controller.test.js`, `docs/CONTROLLERS.md`, handoff `PAD-02.md`.
  Implement standard gamepad/DualSense input, capability-detected haptics, optional
  adaptive triggers only with verified protocol/browser support. Never conflate
  trigger vibration with adaptive resistance. Explicit opt-in for HID. Test cleanup.
- STORY-02 / Sol narrative agent: `src/content/story.js`, handoff `STORY-02.md`.
  Preserve IDs, science, choices and save compatibility; add concise play-facing
  lines and action labels so lore can be optional. No changes to runtime or CSS.
- Integrator / Codex: main.js, landscape camera integration, interface/CSS,
  settings, contracts, browser QA, release. Full-screen world, brief dialogue,
  optional journal, meaningful controller interactions, same private audience.

PAD-02 and STORY-02 are complete. Integration includes the compact world-first
HUD, optional journal, controller menu/camera wiring, six-wheel surface sampling,
and test coverage. Native HD haptics / desktop are explicitly deferred until the
game is finished. No desktop work is authorized for this revision.

## CRITIQUE-03 — independent design review

User requested several Sol subagents to critique v0.2 against professional games,
especially information delivery. Review only; no gameplay changes or publication.
Shared checkout `main`, baseline `3aeb99c`, disjoint review-document ownership.

- LEARN-03 / Sol: `docs/reviews/LEARN-03.md`; learning, curiosity and scientific
  information. Compare Outer Wilds and The Invincible using primary sources.
- EMOTION-03 / Sol: `docs/reviews/EMOTION-03.md`; emotional pacing and nonverbal
  storytelling. Compare Journey and FAR: Lone Sails using primary sources.
- UX-03 / Sol: `docs/reviews/UX-03.md`; attention, prompts, UI and feedback.
  Compare Firewatch and The Invincible using primary sources.
- Codex integrates concrete evidence, disagreements, and a short prioritized
  critique into `docs/reviews/REVIEW-03.md`. Reviewers must distinguish source/code
  inspection from playtesting and sourced reference facts from design inferences.

CRITIQUE-03 complete: all three Sol reviews and the integrator synthesis are in
`docs/reviews/`. Findings are recommendations, not authorized implementation
assignments. No gameplay code, assets, or hosted build changed in this review.

## AGY-01 — verify external delegation (complete)

User requested checking Google Antigravity delegation. Codex owned CLI discovery
and integration documentation. Antigravity / Gemini 4 Argon Medium received a
read-only critique brief with selected excerpts in isolated scratch storage;
it had no repository editing assignment. Acceptance: verify the actual model
catalog and a successful, useful response, not merely executable discovery.

Catalog query and critique succeeded. Gemini supported restoring a deliberate
transmission beat but challenged the scope of the proposed photography system.
These are untested suggestions; no gameplay changes were made. See
`ANTIGRAVITY.md` for the verified route, limits, and future handoff procedure.

## EXPERIENCE-03 — discovery and contact (complete)

User authorized continued development and rejected the photography system.
Shared checkout `main`, base `3aeb99c`; preserve existing review documentation.
Disjoint ownership, no independent publication:

- GEO-03 / GPT-6.1 Sol: `src/ui/landscape.js`, `docs/handoffs/GEO-03.md`.
  Author readable 3D cross-lamination at the Last Chance goal and a Berry Bowl
  target; inspection must frame the target, preserve accessible camera behavior,
  and keep all routes reachable. No photography system or new downloads.
- STORY-03 / GPT-6.1 Sol: `src/content/story.js`, `docs/handoffs/STORY-03.md`.
  Short curiosity-first titles/prompts and faithful discovery language. Keep
  all scene/choice IDs, fixed history and existing save compatibility. Add
  pre-discovery titles; remove promises of interactive photography.
- WAIT-03 / GPT-6.1 Sol: `src/engine/interaction-wait.js`,
  `tests/engine/interaction-wait.test.js`, `docs/handoffs/WAIT-03.md`.
  Small cancellable one-shot wait for visible send/listen feedback; prove no
  late callbacks after pause, restart, or superseding work with injected timers.
- Codex: main interaction flow, UI styles, small presentation/lifecycle helpers,
  relevant tests, journal unlocks, concise plan, browser QA, private release.
  Restore choose → deliberate send → receipt, including silence without sound;
  pause/restart must cancel pending waits. No desktop work.

Acceptance: first loop works by keyboard/touch, scans show geological targets,
discoveries unlock in the journal, qualitative conditions do not imply a timer,
chosen memories appear at the ending, and every story path still completes.

## IPAD-03 / PAGES-03 — playtest release (published)

User requested GitHub Pages publication and identified the playtest device as
an 11-inch iPad Air M4. GitHub Pages replaces Sites as this release's target.

- IPAD-03 / GPT-6.1 Sol: `src/ui/play.css`, `docs/handoffs/IPAD-03.md` only.
  Touch-friendly tablet controls, safe-area spacing, non-overlapping portrait and
  landscape HUD; target 820×1180 and 1180×820 CSS viewports plus browser chrome.
- Codex: GitHub repository and Pages setup, renderer performance settings if
  needed, input integration, build checks and tablet browser verification.
  Actual iPad Safari and controller feel require the user's device playtest.

GitHub build and deploy passed for `4965a5a`; public playtest:
https://orion-north.github.io/last-light/ . User is playtesting this version.
Do not push new gameplay to `main` during this pass. Previous local development
history is preserved on `sites-history`; `main` tracks `github/main`.

## FEEL-04 — rover movement and camera (active)

User requested continued development while playtesting v0.3. Work on local
`develop/v0.4`, base `4965a5a`. No deployment or main-branch mutation.

- MOTION-04 / GPT-6.1 Sol: `src/engine/drive-motion.js`,
  `tests/engine/drive-motion.test.js`, `docs/handoffs/MOTION-04.md`.
  Deterministic acceleration/braking and turn response, bounded delta, reverse
  braking and explicit immediate reset for pause/disconnect.
- CAMERA-04 / GPT-6.1 Sol: `src/ui/landscape.js`,
  `docs/handoffs/CAMERA-04.md`. Integrate drive-motion contract and smooth the
  return from inspection to rover-follow. Preserve orbit, reduced motion,
  routes/collision/arrival, targets and safe terrain contact.
- Codex: main input interruption integration, release record, review/tests.
  Browser and physical controller feel checks follow the user's active playtest;
  do not interrupt or navigate their live game to test this draft.

## ART-04 / GLYPHS-04 — visual quality (active)

User explicitly prioritized a substantial asset-quality improvement and controller
glyphs. Keep v0.3 live while implementing these in `develop/v0.4`.

- ART-04 / GPT-6.1 Sol asset lane: `public/textures/`, `public/models/rocks/`,
  `docs/handoffs/ART-04.md`. Acquire licensed scanned ground/rock PBR assets;
  provide exact provenance, terms, sizes, and file mapping to integration lane.
- CAMERA-04 / GPT-6.1 Sol landscape lane also integrates ART-04 textures/model,
  improves material/lighting quality and rock variation, keeps rendering bounded
  for iPad, and integrates MOTION-04. Owns `src/ui/landscape.js` only plus handoff.
- GLYPHS-04 / Codex: original SVG controller glyph module, UI integration,
  prompt-family override, styles, relevant tests, attribution ledger.

## CONTROLLER-FIRST-04 — active investigation and clarity

User requested controller as primary input, more engaging clear gameplay, continuing
parallel scrutiny, high-quality performant assets, and a believable Mars sky.
Shared `develop/v0.4` checkout, disjoint ownership; live v0.3 stays unchanged.

- PAD-04 / Sol wait03: controller input modes, left-stick menu navigation,
  rearming across contexts, behavioral tests; independent integration review in
  `docs/reviews/CONTROL-04.md` before and after root changes.
- INVESTIGATE-04 / Codex: objective/input-mode helpers, main interaction routing,
  steady-view progress, controller glyphs/focus, lifecycle and browser validation.
- CAMERA-04 / Sol geo03: two real geometry-based investigations, observation
  sampling contract, scanned materials/landmarks/motion and sky integration.
- SKY-04 / Terra 6.1: `src/ui/sky.js` and handoff only; bounded Mars atmospheric
  shader preserving renderer contract, primary NASA references. Sol reviews it.
- CLARITY-04 / Sol story03: independent source/design/asset review after delivering
  six licensed 1K maps (5.08 MB); review document only.

Acceptance: main action never silently chooses assisted driving; sticks drive only
in traversal and navigate choices/menus; observation responds to actual camera
view and steadiness with explicit assistance; one concrete objective; input loss
pauses; shader renders without errors. Device performance and emotional engagement
remain human playtest questions, not claims established by unit tests.

- SOUND-04 / GPT-6.1 Sol sound04 (user explicitly requested): owns
  `src/audio/sound.js`, music tests, `docs/SOUNDTRACK.md`, SOUND-04 handoff.
  Improve original motif/arrangement, silence contrast and readable interaction
  cues; bounded Web Audio, cleanup and pause/mute tests. Root integrates optional
  activity API only after contract agreed. No independent publication.

## CONTACT-04 / TOUCH-04 — sending is play

User explicitly requested an interactive Earth transmission, possible controller
touchpad use, and moving the story out of the corner card.

- CONTACT-04 / Sol geo03: landscape only + handoff; steer a visible 3D uplink
  toward a broad sky guide, emit quality from angular separation, preserve fixed
  historical outcomes and cleanup. Schematic link, not literal visible radio.
- TOUCH-04 / Sol wait03: controller + tests + controller-doc append/handoff;
  verified original DualSense USB input report decoding through existing opt-in
  WebHID; right-stick menu scrolling. Standard right stick remains required
  fallback on iPad Safari and other browsers without WebHID.
- Codex: context-sensitive aim/send, keyboard/drag fallbacks, centered cinematic
  captions and compact choices, audio activity integration, pause/reset handling,
  integration tests and browser verification. Touchpad release never silently
  sends on disconnect/stale-input cleanup; explicit Send commits the interaction.

Final integration review applied: controller ownership/cancellation, focus dispatch,
relative pointer displacement, active contact reset, shader compilation, terrain
roughness/repetition, spectroscopy wording, and reflection energy in darkness.
Both science interactions and link alignment/send passed local browser checks.
This pass remains a local draft, with target-device/audio-feel playtesting pending.

## RELEASE-04 — GitHub Pages publication

User explicitly requested publication of the completed draft. Codex uploads the
licensed textures and source through a release branch, promotes the complete
tree to main, and verifies the Pages workflow and live game. Previous v0.3
stability instructions applied while playtesting, before this release request.

## UPLOAD-05 — terminal and deliberate upward gesture

User requested a terminal view and upward touchpad upload interaction. Shared
`develop/v0.5`, base c65f669; disjoint ownership. Keep real history and muted play.

- GESTURE-05 / Sol: `src/engine/upload-gesture.js`, its test, controller input
  release metadata/tests, handoff. Recognize deliberate upward swipe on actual
  release; cancellation, stale input, contact changes and pause cannot send.
- TERMINAL-05 / Terra 6.1: `src/ui/upload-terminal.js`, `src/ui/upload-terminal.css`,
  handoff. Render concise central instrument panel with selected memory, visual
  upload lane/status and acknowledgment, no command typing or paragraphs.
- Codex: main integration, fallback right-stick/button/touch controls, scoped
  build/browser checks, review, release. Input handlers and renderer remain with
  integrator except explicitly assigned controller protocol metadata.

UPLOAD-05 lanes integrated and independently reviewed. Review caught held-stick
synthetic neutral, repeated Enter, and misleading receipt labels; all corrected.
Slow screen drag gets an untimed path while USB swipes retain their duration gate.
Browser swipe upload reached sending and receipt; final checks recorded in VERIFICATION.

## DESIGN-06 — authored instruments, artifacts and onboarding

User requests real-game-informed design, improved 3D artifacts, faster rover,
and clearer purpose with a possible cutscene. Shared develop/v0.6; disjoint paths.
- UPLINK-06 / Sol: upload-terminal.js/css and their tests, handoff. Research real
  game presentation then replace boxed panel with an authored full-scene uplink
  instrument; preserve interaction selectors/contracts and all outcome modes.
- ARTIFACT-06 / Sol: landscape.js, optional new artifacts.js, handoff. Research
  geological references and improve actual 3D investigation targets and landmark
  staging within mobile budgets; preserve renderer API and input/camera contracts.
- CRITIQUE-06 / Sol: docs/reviews/DESIGN-06.md only. Research professional game
  onboarding/information design, recommend actionable short opening and scrutinize
  implementation as lanes land. No runtime edits.
- Codex: main onboarding integration, intro UI, drive pace, documentation, tests,
  browser checks and publication. Coordinate any renderer interface additions.

DESIGN-06 implementation integrated: open antenna interface, twelve-second skippable
opening, explicit arrival/inspection cues, faster movement, and refined geometry.
Independent Sol lifecycle/source review passed; source and engine checks pass.
Browser verification and release evidence are recorded in VERIFICATION.md.

## TIME-07 — make the years felt through refinement

Active user goal: communicate the long mission emotionally; subagents propose
and scrutinize ideas; refine existing play rather than accumulate new features.
Shared develop/v0.7, base aff8429, disjoint ownership.
- TIME-STORY-07 / Sol: docs/reviews/TIME-STORY-07.md only initially. Diagnose
  pacing/time compression and propose a bounded revision with sourced dates.
- TIME-SENSORY-07 / Sol: docs/reviews/TIME-SENSORY-07.md only initially. Propose
  temporal changes in existing camera, terrain/rover treatment and sound/routine.
- TIME-CRITIC-07 / Sol: docs/reviews/TIME-CRITIC-07.md only initially. Challenge
  proposals and scope; scrutinize historical truth, brevity, controls and repetition.
- Codex: choose and integrate the cohesive treatment; assign implementation
  paths after proposals. Verify actual runtime transitions, preserve saves and
  close controller-first gameplay, publish to existing Pages after review.

TIME-07 selection after critique: emphasize the lived mission, not add errands.
Use a 7-second authored 2004→2015 passage and a 3-second 2015→2018 return; both
skippable, same close rover framing, destination saved before presentation.
Replace the existing date eyebrow with year/elapsed-mission wording; refine the
existing months scene to communicate eight months without an extra montage.
Keep the existing score without another sound layer or system.
- TIME-STORY-07 now owns src/content/time.js (new), src/content/story.js,
  tests/engine/time.test.js (new), its review/handoff only.
- TIME-SENSORY-07 now owns src/ui/landscape.js and its review/handoff only:
  optional subtle authored era finish, zero new assets/draw calls; reversible
  and independent of power. API setMissionAge(years), early-load safe.
- TIME-CRITIC-07 remains independent review doc only.
- Codex owns main transition lifecycle, presentation CSS, timeline helper,
  integration checks and publication. Existing intro/lifecycle should be reused
  where practical, not duplicate a second presentation controller.

TIME-07 integrated and reviewed. Both date passages share the opening lifecycle;
input rearms, pause freezes presentation, and saves retain the destination.
Browser testing caught and fixed a resumed receipt leaving the camera on a rock.
Passages now explicitly settle beside the rover. Left-leading glyphs, close
gameplay framing and the purpose/emotion opening were audited against the latest
user direction. Verification and device limitations are recorded in VERIFICATION.

## SQUEEZE-08 — tactile sending

Replace the controller touchpad/right-stick upload with a deliberate two-trigger
squeeze: release both to arm, squeeze L2+R2 together, brief full-pressure hold,
then send once. No pointer or touchpad click in controller play. Preserve the
accessible button fallback and distinct unanswered/archive semantics.
Shared develop/v0.8, disjoint files:
- INPUT-08 / Sol: src/input/controller.js, tests/engine/controller.test.js,
  docs/CONTROLLERS.md and own handoff. Analog trigger samples, uplink input mode,
  bounded adaptive resistance and rumble detents, lifecycle neutralization.
- PRESENTATION-08 / Sol: src/ui/upload-terminal.js/css,
  tests/engine/upload-terminal.test.js and own handoff. Two pressure-driven halves
  meet around a memory, then signal release; concise left glyph prompt, no cursor.
- CRITIC-08 / Sol: docs/reviews/SQUEEZE-08.md only. Scrutinize clarity, pleasure,
  accessibility, browser capability claims, history and lifecycle as code lands.
- Codex: squeeze state machine/tests, main integration, input glyphs/cursor mode,
  audio integration, browser verification and publication.

User expanded SQUEEZE-08: make critical story/objective information central and
engaging; build a Windows test application for trigger feedback. Desktop is now
explicitly authorized. Codex owns central story/objective composition. New lane:
- WINDOWS-08 / Sol: desktop/**, .github/workflows/windows.yml, docs/WINDOWS.md,
  own handoff only. Isolated Electron shell and Windows portable artifact build;
  exact device permission handling for the existing optional USB controller flow.
  No root package/main changes without integration agreement. Review primary
  Electron docs; do not claim hardware testing or a native HD-haptics implementation.

SQUEEZE-08 integration reviewed: old swipe/stick engine removed, two-trigger
commitment and pressure feedback wired, source semantics preserved. Browser
fixture verified one-shot squeeze and rearm; direct page checked centered story
and tablet layout. Independent review caught audio activity ownership and HUD
overlap; corrected. Windows packaging has a separate sandbox/asset smoke gate
before its preview artifact can publish. Physical controller feel remains untested.

## SEND-09 — stronger feedback and a satisfying release

User confirmed feedback works in their browser and requested stronger, richer
sending. Shared develop/v0.9; disjoint ownership:
- FEEL-09 / Sol: src/input/controller.js, tests/engine/controller.test.js,
  docs/CONTROLLERS.md, own handoff. Stronger bounded USB resistance and ordinary
  rumble, finite pressure pulses, distinct charge/send/receipt cues; lifecycle cleanup.
- VISUAL-09 / Sol: src/ui/upload-terminal.js/css, terminal tests, own handoff.
  Clear squeeze→charge→release composition, tighter focus, visible signal departure
  and separate Earth receipt. Preserve controller/touch/keyboard alternatives.
- SOUND-09 / Sol: src/audio/sound.js, tests/engine/music.test.js, own handoff.
  Improve pressure build/charge/local send/remote receipt distinction without
  obscuring silence or making an audio requirement.
- Codex: release-to-send state machine/tests, main integration, independent
  review, browser QA and web/Windows publication. All effects remain optional.

Contract: root's createSqueeze now charges at .82 pressure for .55seconds, then
waits indefinitely for BOTH triggers released to commit once. Early release
before charge cancels harmlessly. Synthetic neutral/pause cannot send. Output
stage release/ready/pressing/charged/latched, charge0..1, pressure0..1.
controller.setUplink({active,progress,charged}); feedback kinds tension/lock/charged/
transmit/received. Existing send callbacks stay mode-aware; no reply means no
received cue. CSS --squeeze-left/right, --upload-progress, --charge-progress;
data-squeeze stage. Sound setActivity adds contactCharged, cue('charged').

User refined SEND-09 during implementation: replace the circular overlay with a
central memory band compressed by pressure plates, and give the end of charging
the strongest feedback, including actual trigger vibration where supported.
FEEL-09 adds documented standard USB Feedback/Vibration effects and finite final
charge vibration; main passes charge0..1 to controller and contactCharge to audio.
SOUND-09 uses that hold fraction for a late crescendo. Same disjoint owners.

SEND-09 integrated. User confirmed stronger effects should build both within each
squeeze and across later transmissions. Transmission profiles now supply effort
from fading signal; archive effort resets. Independent review found a HID-close
cancellation gap and it was fixed before publication. All 99 tests, source/build
checks, isolated controller flow and desktop/tablet layouts pass. Physical tuning
remains for user playtesting; no native HD-audio claim is made.

## CLARITY-10 — immediate trigger feel and understandable player experience

User requests much stronger trigger effects starting at the beginning of the
press, plus deeper independent scrutiny of story and choices. Shared develop/v0.10,
strictly disjoint write ownership:
- FEEL-10 / Sol: src/input/controller.js, controller tests, docs/CONTROLLERS.md,
  own handoff. Strong early-travel USB trigger effects, preserve later-story
  weight, lifecycle cleanup and accessible analog success thresholds.
- STORY-10 / Sol: src/content/story.js, src/engine/briefing.js, briefing tests,
  own handoff/review. Critique and improve identity/purpose, causal story and
  meaningful concrete choices through short experiential beats; preserve sources.
- CRITIC-10 / Sol: docs/reviews/CLARITY-10.md only. Independently examine player
  understanding, action/feedback, choice legibility and narrative delivery.
- Codex: runtime/UI integration, onboarding/phase clarity, relevant tests,
  cross-review, browser QA and web/Windows publication.

Do not touch the user's live browser playtest or output to their physical pad.
No additional paragraphs or optional journals should carry essential story alone.

Critique follow-through: VIEW-10 / Sol owns landscape.js and its handoff to add
first-view reveal, focused horizon/ground choice previews, and a distinct fixed
remote framing for Earth scenes. Root owns the explicit Earth handover, choice
meaning display and transmission route. VIEW-10 handed back before GRAPHICS-10.

User also requests more realistic graphics. GRAPHICS-10 / Sol now owns ONLY
src/ui/landscape.js and its own handoff/review. Audit lighting, shadows, materials,
terrain and sky; implement focused realism gains using existing assets with
bounded iPad cost. Preserve VIEW-10 APIs and lifecycle; no new dependencies.

User removed the iPad target during this pass. Desktop/browser and Windows with
a controller are now primary; keep existing fallbacks but do not budget this
pass around iPad performance or layout. GRAPHICS-10 uses desktop quality caps.

CLARITY-10 integrated after independent review. Haptic onset now uses per-trigger
raw pressure; first action visibly reveals the view; focused first choices preview
horizon/ground; choice meaning travels with the memory. The historical contact-loss
passage changes role and camera, with source/destination visible afterward.
Landmark direction projects from the world, including behind-camera targets.
Graphics improves light/ground/shadow coherence without new assets or draw calls.
103 tests and desktop browser flow pass; human feel/emotional clarity remain the
next playtest questions. Windows and Pages publication are owned by Codex.

## PLAY-11 — playable actions, complete critical reviews, music and signal

User requests full-playthrough critiques, no autodrive, a composed adaptive
soundtrack and visible signal travel to Earth. Shared develop/v0.11, disjoint paths:
- SOUND-11 / Sol: src/audio/, tests/engine/music.test.js, docs/SOUNDTRACK.md,
  docs/handoffs/SOUND-11.md. Compose and implement an original adaptive score;
  document musical brief, motifs, arrangement, mix and actual verification.
- PLAY-11A / Sol: docs/reviews/PLAY-11A.md only. Full baseline browser playthrough,
  critical gameplay review with observed action/feedback and recommendations.
- PLAY-11B / Sol: docs/reviews/PLAY-11B.md only. Full baseline browser playthrough,
  critical narrative/pacing review; distinguish witnessed behavior from inference.
- Codex: runtime, sending presentation, no-autodrive implementation, integration,
  tests, publication. Reviewers may later receive separate implementation lanes.

Review baseline at localhost:4174, own isolated tabs. Never touch the user's
public playtest tab or physical controller. Baseline fixture simulates pad input
without hardware output. Do not claim a full playthrough if unable to finish it.

PLAY-11 integrated: nine menus replaced by recorded observations; five mast
profiles vary from one sustained sky measurement to a three-view valley survey.
The storm recalls the player's actual first view. Root removed all autodrive
runtime/pathfinding, rebuilt sending as Mars/Earth signal travel and incorporated
review fixes for reversed call direction, packet/receipt timing, mismatched
pressure display and final-frame spoilers. Music lane completed distinct authored
arrangements, timbres and foreground ducking. VIEW-11 fixes occlusion/inspection
framing and supplies fixed-eye gaze sampling. Root added rover-relative chase
camera and steering guidance after witnessed manual-navigation confusion.

PLAY-11A finished the whole baseline through ending/archive; its route included
assistance and is labeled accordingly. B/C browser access was unavailable, so
those are source reviews only. Root/agent targeted final-build checks supplement,
but do not constitute a claimed full manual playthrough of every revised scene.
Automated result: 111 tests, 39 syntax checks, 12 scene contracts; build passes.

Final targeted review: PLAY-11A completed both revised geological stops via
manual driving and genuine inspection input (no Skip), including sequential
Last Chance → Berry Bowl travel. Source reviews remain labeled separately.
Root verified chase-camera first arrival and geological recording; physical
feedback and soundtrack listening remain for human playtest.

## TOOLS-12 — hands-on geology and a musical missing reply

User asks for playable brushing/sample comparison, animated sending, musical
call-and-response that loses its answer, and critical full-version playtesting.
Shared develop/v0.12, strictly disjoint paths:
- TOOLS-12 / Sol: src/ui/landscape.js, new src/engine/geology-tool.js,
  tests/engine/geology-tool.test.js, own handoff. Actual 3D brushing removes dust;
  player samples two distinct surfaces and compares readings. Coordinate API
  with root; authored qualitative instrument signals, not fabricated telemetry.
- SOUND-12 / Sol: src/audio/, tests/engine/music.test.js, docs/SOUNDTRACK.md,
  own handoff. Explicit composed send/question and receive/answer motif, absent
  response after contact loss, tool sound. Preserve silence/cancellation safety.
- CRITIC-12 / Sol: docs/reviews/TOOLS-12.md only, scratch QA files outside repo.
  Critique action purpose/feedback early; full revised browser playthrough after
  integration, report actual route and any shortcuts or blockers candidly.
- Codex: main/UI/input integration, signal animation, content wording, tests,
  cross-review and publication. No physical controller outputs in QA and never
  operate the user's existing public playtest tab.

TOOLS-12 integrated: spatial brushing, steady two-zone readings and explicit
comparison; animated outbound/return packets and a four-note learned question
with a complementary answer that disappears after contact loss. Root completed
a fresh full manual journey and separate final release-gate checkpoint. Both
critics distinguish source/recorded-run review from unavailable independent UI
access. Review fixes include dust-camera occlusion, unrelated pointer-up resets,
pointer steadiness, release provenance and consistent progress/instructions.
120 tests pass; remaining sensory/presentation questions are in VERIFICATION.
