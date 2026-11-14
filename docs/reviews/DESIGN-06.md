# DESIGN-06 — authored direction and information delivery

Read-only design review of develop/v0.6 on 2026-11-14. Reviewed AGENTS,
README, PLAN, TASKS, CONTRIBUTING, main.js, objectives.js, experience.js,
story.js and relevant landscape APIs. Only this document is owned by CRITIQUE-06.
This is source/code inspection, not a playtest or a claim about emotional impact.
The shared working tree changes during integration; implementation re-review follows below.

## Recommendation for this pass

Use a short in-engine opening, then let the first deliberate send teach the game.
Integrator's proposed nine-second version is appropriate:

| Time | Shot | One-line cue |
| --- | --- | --- |
| 0–3 s | Wide Mars horizon, Opportunity small in foreground | You are Opportunity. |
| 3–6 s | Move toward the pale Last Chance layers, no inspection UI | Read the rocks for traces of water. |
| 6–9 s | Return to rover and settle into normal camera | Send what you find home. |

Skip must work immediately with keyboard, touch and controller. Reduced motion
should use static compositions or a single static rover view. Pause must suspend
it. Do not replay on saved-game resume. This previews purpose, not a command to
drive to the outcrop immediately: scene zero is the first view and first send.
Keep that transition explicit: “Raise your cameras” then “Choose your first view
of Mars to send home.” No invented NASA call or fabricated telemetry is needed.

## Concrete clarity risks

1. **The player changes jobs on Earth without changing worlds.** `earth-listens`
   sets signal to zero and changes the objective to “Listen from Earth,” but the
   same Mars scene and select/transmit loop persist. Add a short “EARTH · JUNE
   2018 · The team keeps listening” cue at the role change. Keep “Call Opportunity”
   on the action. Do not suggest the player can restore contact.
2. **A single rail cannot describe every scene.** Normal travel is
   Drive → Examine → Send; the first morning is Look → Choose → Send; Earth is
   Call → Listen → Remember. A permanent Drive rail promises unavailable controls
   on scenes without goals. Highlight the actual current step; no progress score.
3. **Arrival abruptly changes movement into menu input.** `inputMode()` switches
   to menu once `reached` is true; `waypoint-reached` stops exploration and focuses
   Observe. Pair that with a visible “Arrived · Look closely” cue. A screen-reader
   announcement alone will not orient a sighted muted player.
4. **Feature versus gesture must be distinct.** `currentObjective()` says find
   the crossing layers/round grains. The inspection panel also needs the stable
   gesture instruction “Move the view; hold still to record,” and progress must
   increase only when that exact feature is readable. Current working-tree
   `updateInputHint()` already has arrows/drag or right-stick guidance, so the
   previously reported missing keyboard hint is corrected.
5. **Do not replace useful discovery with a poetic title.** `discoveredScenes()`
   correctly unlocks entries after observation. Keep short physical evidence and
   one interpretation near the reveal; put historical detail in the journal.
   “What could bend these layers?” → player reveals layers → “Crossing layers
   are evidence of ancient flowing water” is a clear evidence/reward sequence.
6. **Route speed and authored composition belong together.** A modest speed
   increase is useful only if arrival braking and terrain contact remain stable.
   Preserve close-approach slowdown; measure actual first/second route durations.
   A faster drive should not turn the landmark into a target players overshoot.

## References and tailored principles

These are primary developer talk descriptions/materials, not a claim that full
videos were watched. The applications below are explicitly review interpretations.

- [Jenova Chen, Designing Journey, GDC 2013](https://www.gdcvault.com/play/1017700/Designing).
  The developer frames the production around realizing an emotional arc through
  testing and polish. **Interpretation for Last Light:** make the first send easy
  and warm, repeat its recognizable receipt, then change the receipt to partial
  and silence. Emotional change should arise from a familiar verb. An opening
  that explains the ending spends that contrast before the player has felt it.
- [Kelsey Beachum, Sparking Curiosity-Driven Exploration Through Narrative in
  Outer Wilds, GDC 2021](https://www.gdcvault.com/play/1027008).
  The stated objective is to inspire and reward curiosity through diegetic,
  player-determined exploration. **Interpretation:** retain this short game's
  explicit navigation, but let the object pose a question before text answers
  it. Last Chance and Berry Bowl should each have a distinct visible signature,
  not interchangeable boulders plus a marker. One clue, one investigation,
  one useful explanation is enough; this does not require an open world.
- [Dino Ignacio, Crafting Destruction: The Evolution of the Dead Space User
  Interface, GDC 2013](https://www.gdcvault.com/play/1018819/contactUs).
  The lead UI designer describes the development of its diegetic, immersive
  interface. **Interpretation:** make Last Light's upload a consistent artifact
  journey: selected memory title/thumbnail → same object in terminal → receipt
  → same object in journal/archive. Keep the terminal readable and actions
  explicit. A holographic look alone does not make information meaningful.
- [Playdead, Rendering of INSIDE, GDC 2016 presentation](https://media.gdcvault.com/gdc2016/Presentations/Gjoel_Svendsen_Rendering_of_Inside.pdf).
  Primary rendering material identifies the game's authored visual treatment;
  the large PDF could not be fully retrieved in this review. **Interpretation,
  not a sourced design claim:** use a restrained value/color hierarchy so the
  pale outcrop and cleared grain patch survive distance, dust and phone size.
  Save highest local contrast for the current subject; avoid scattered equally
  bright props competing with it. Do not import INSIDE's concealed controls.

## Acceptance checks for integration

- New player can state “I look for evidence and send memories home” after opener.
- Skipping produces the identical playable state as finishing, with no stuck input.
- First send, two geology scenes, partial receipt, Earth call and archive each
  show a correct verb and input cue, with sound off.
- At phone size the layers and grains can be identified before reading the fact.
- Journal shows evidence and source context; terminal shows action and receipt.
- Reduced motion avoids opener camera travel; restart/resume do not leak timers.

No runtime tests run by this review agent; human playtesting remains necessary.

## Integration re-review, first lane changes

Inspected working-tree changes to objectives, upload terminal, drive motion and
landscape intro API. Arrival labels and feature-specific hold-still objectives
address risks 3/4. The terminal now labels origin and destination, usefully
clarifying Earth recovery versus rover uploads. Intro API restores the original
camera and blocks drive/look. Manual top speed changes .85 → 1.15; assisted
1.2 → 1.45 (code values, not measured traversal times).

Lifecycle edge for integrator: when reduced motion is enabled during an active
intro, `setIntro(true)` returns early while its `intro` state remains set. End the
intro or explicitly call `setIntro(false)` when that setting changes. Root main
lifecycle was not yet present at this inspection, so this is an integration check,
not a confirmed shipped bug. No browser/runtime check performed here.

## Final integrated source review

Reviewed main introduction, dynamic journey rail, journey CSS and reduced-motion
cleanup after integration. `setReducedMotion(true)` now calls `setIntro(false)`,
resolving the earlier lifecycle edge. First scene shows Look / Choose / Send;
travel scenes show Drive / Examine / Send; zero-signal scenes show EARTH /
RECOVERY OPERATIONS. Concrete arrival and hold-still objectives remain present.

Executed `briefing.test.js`, `drive-motion.test.js`, and `experience.test.js` with
the bundled Node runtime: all three files passed. Also executed the actual
extracted `stopBriefing`, `finishBriefing`, and `journeyRail` functions in a VM
with mocked browser/renderer boundaries: paused skip leaves the intro active;
unpaused skip cleans the camera and renders once; repeated skip is harmless;
first, travelling, arrived, sending and Earth rails return the intended labels.
These are targeted source-function checks, not browser interaction tests.

Source review found controller primary guarded during dialogs and routed directly
to skip during intro; keyboard/touch use the focused Skip button. Intro clock
holds while paused/hidden; restart and title call cleanup; saved resume bypasses
intro. No blocking issue found in those paths. Minor design compromise: travel
choice phase still highlights Examine because its three-step rail omits Choose;
its concrete objective correctly says “Choose what to remember.” Root owns the
browser checks for actual camera framing, mobile layout and button behavior.

## Follow-up copy recommendation: purpose with emotion

For the user's later request for more emotional purpose, recommend four seconds
per beat (twelve seconds total), with immediate skip:

1. **You are Opportunity.** — The people who sent you cannot follow. Be their eyes.
2. **Look for traces of water.** — Drive to the pale rocks. Study the layers they hold.
3. **Send a little of Mars home.** — Choose what to remember. Send it to Earth. Someone is listening.

The emotion comes from distance and shared looking without invented NASA speech.
Avoid “Find the water that was,” which gives the scientific answer before the
player finds evidence, and “Choose a discovery,” because horizon/shadow choices
are memories rather than discoveries. The rocks are a preview of the mission;
the immediate gameplay handoff must say “First, raise your cameras. Send your
first view of Mars” so the panorama before the first drive is understandable.
This is recommended copy, not a claim of implementation or playtest validation.
