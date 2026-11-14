# TIME-SENSORY-07 — the same rover, many mornings

Proposal only; runtime unchanged. Read AGENTS, README, PLAN, TASKS, CONTRIBUTING,
landscape, sound, main, current story and SOUNDTRACK. Findings below describe
source inspection, not a listening session or device playtest. No new historical
claims or external assets are required by this treatment.

## Diagnosis

The large chronological leap is between Berry Bowl in 2004 and the marathon in
2015, followed by the ordinary day in 2018. The current rendering gives those
moments the same immediate interaction rhythm. `setScene` changes an environment
palette, while `renderGame` changes the small date heading and next objective.
The same walkable diorama and close camera encourage continuity over elapsed
years. More scenery, a longer drive, or another explanatory paragraph would not
necessarily change that impression.

Recommend two refinements to the existing routine, in this order. The intended
feeling is recognition after an absence: “I know this little machine; it has kept
coming back.” Neither refinement should require another mission or action.

## 1. Let the two big cuts breathe in the existing close view

At the existing Continue from Berry Bowl to marathon, and marathon to ordinary
day, hold a matching close rover composition while the existing date changes.
The outgoing memory/receipt should settle first. Briefly remove the interaction
dock, expose the date at its existing heading position, and return the next
objective. Keep the rover at ordinary gameplay scale, with no aerial establish,
new cinematic route or solar time-lapse. A still composition lets the familiar
rover, altered finish, and new year do the work together.

Budget: roughly 1.8 seconds for the 2004→2015 cut and 1.2 seconds for the shorter
2015→2018 return, at most 3 seconds total, advancing on
Interact as well. This is a target for playtest, not an established perceptual
threshold. Do not add this hold to every scene. Date remains readable in normal
play after the hold; its information cannot depend on catching an animation.
If the story lane provides a short retrospective line, show that existing line
here instead of adding another sensory caption.

Feasibility: main already has a paused/visibility-aware opening clock and the
renderer already exposes `focusRover`, `stopDrive`, and scene palettes. A small
transition guard can reuse their principles. Snapshot or derive the normal close
frame, never the outcrop intro. Trigger from the actual forward NEXT boundary,
not from every `renderGame` or restored save. Do not reset position/heading or
modify waypoint reach state. Clear held drive/look/gesture input when entering;
require released Interact before the incoming action can fire. Pause/background
must suspend the hold; restart and fallback must clear it. Loaded saves open
directly on their saved scene. Reduced motion uses a still cut with persistent
incoming date and immediate Continue, without a sweep, flashing sun or fade to
black. If this lifecycle cost proves too high, prefer an immediate still date cut
over another reusable cutscene subsystem.

Risk: matched composition might imply one physical place across the mission.
Keep the existing artistic reconstruction disclosure; do not describe these as
historical camera matches. Never imply one sped-up night explains eleven years.
The date cut communicates an editorial omission, not simulated travel.

## 2. Give the actual rover a restrained mission-age finish

At the incoming 2015 scene, preserve the NASA model and textures while making its
surfaces slightly dustier and more matte; deepen this subtly at the incoming
2018 ordinary day. The change should survive normal close framing and be visible
with sound off. Retain solar-cell pattern, instrument contrast, material identity
and the rover silhouette. No rust, broken wheels, new damage meshes, shaking,
limping, sparks or intermittent controls. Do not keep coating it more heavily as
the storm/power indicators fall: age and available sunlight must read separately.

Feasibility: the GLTF loader currently visits rover materials once and sets
roughness/metalness floors. Capture original values and apply an idempotent,
small color/roughness adjustment from a narrative-era parameter passed alongside
power/signal in `setWorld`. Apply the stored era when the async model finishes
loading. Restore original values on restart; never multiply the previously
modified values. Deduplicate shared material references. A simple whole-material
tint is the cheap first experiment; reject it if it merely paints the rover
orange or destroys dark cell detail. Only then consider a model-space upward
surface mask in the existing standard-material shader, with a stable uniform and
cache key; do not add a texture download or overlay meshes for this pass.

Budget: zero new geometry, draw calls, asset bytes or per-frame material traversal.
One scalar era state; two changes over the mission. The simple adjustment should
be implemented and judged in close portrait and iPad landscape screenshots before
acceptance. Shader masking adds compatibility risk and should be omitted if a
plain adjustment is not convincing within a short polish pass.

Truth: this is an artistic visual shorthand for elapsed mission time, not a
reconstruction of panel dust, actual damage or dust telemetry at those dates.
The finish is not a monotonic scientific model. Label that in the existing
artistic-reconstruction disclosure; if stronger specificity is desired, source
it before implementation. Do not attach invented condition percentages to it.

## Audio: preserve the existing treatment first

The requested “familiar receipt rhythm evolves” is already substantially present:

- `composePhrase` retains a five-note home identity and authored returns; storm
  removes the answer and fading leaves two notes. Eighth-note duration grows
  from .48 to .67 seconds, supporting layers disappear, and phrase gaps expand.
- `cue('transmit')` is three high pulses; `cue('received')` is a lower three-note
  answer. Main plays the answer only for reply-mode transmissions.
- Scene 7 and scene 10 explicitly become silent in the received phase. The final
  scene restores the motif. Motor/grit/wind are also withdrawn in silence.
- Visible terminal states already distinguish reply, partial receipt and no reply.

Do not commission another aging score, add radio crackle, degrade every reply or
stretch waiting times to manufacture age. Existing cues are dramatized, not rover
recordings or a signal-physics model. Keep the early receipt recognizably intact
through 2015 and the ordinary day: something has lasted. Existing late absence
then has a stable reference. A listening pass may identify masking under music,
but no masking defect has been established here. Avoid a new audio ducking graph
unless that pass demonstrates one. These two visual refinements remain complete
muted and do not need audio changes.

## Acceptance and stop rule

Verify the two actual story boundaries with controller, keyboard and touch;
check held Interact, pause/background, reload on either side, restart and graphics
fallback. Check normal/reduced motion, sound on/off, close portrait and iPad
landscape. Relevant source/build and lifecycle tests should pass; no tests can
establish emotional effect. No hardware, browser or listening checks were run
for this proposal.

For a human playtest, ask what changed between the early science and marathon,
then when they felt the long mission. If the answer is only “a date appeared,”
revise staging/one existing narrative line before adding a third effect. The
finish is subordinate: omit it if the player reads decay, battery drain or a new
survival mechanic. Do not compensate for a weak cut with more missions, chores,
camera distance, mandatory waiting or explanatory text.

Independent critic feedback incorporated: give the first cut more weight than the
second; match composition rather than landmarks; finish remains optional because
contamination can read as imminent failure. No claim about historical dust history
is needed or verified in this proposal.
