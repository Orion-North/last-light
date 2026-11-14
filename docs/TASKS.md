# Task board

Phase: **v0.3 discovery and transmission development**.
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

## EXPERIENCE-03 — discovery and contact (active)

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

## IPAD-03 / PAGES-03 — playtest release (active)

User requested GitHub Pages publication and identified the playtest device as
an 11-inch iPad Air M4. GitHub Pages replaces Sites as this release's target.

- IPAD-03 / GPT-6.1 Sol: `src/ui/play.css`, `docs/handoffs/IPAD-03.md` only.
  Touch-friendly tablet controls, safe-area spacing, non-overlapping portrait and
  landscape HUD; target 820×1180 and 1180×820 CSS viewports plus browser chrome.
- Codex: GitHub repository and Pages setup, renderer performance settings if
  needed, input integration, build checks and tablet browser verification.
  Actual iPad Safari and controller feel require the user's device playtest.
