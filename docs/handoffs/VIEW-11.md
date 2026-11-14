# VIEW-11 — evidence close-ups and relative survey gaze

Scope: only `src/ui/landscape.js` and this handoff. Preserved integrator's manual
movement/no-autodrive changes. No other runtime/content/test files edited.

## Inspection

Last Chance now begins at its broad exposed face. Berry Bowl begins above the
hollow, not low alongside it. Tighter subject fitting uses the actual evidence
scale; the controller needs no zoom input to reach useful quality. Active
investigation close-ups omit the foreground rover from rendering so the subject
cannot be occluded by its mast/body; every other render restores it.

The initial visible evidence is eligible, but quality stays zero until the player
has deliberately orbited at least .11 radians (~6 degrees total travel). This
requires active look input or a held pointer orbit gesture. Framing tween and
residual OrbitControls damping do not earn reveal progress. Then the existing
face/proximity quality and stable-hold contract apply. Repeated
`setInvestigation(true)` intentionally resets/reframes (camera reset button).

Hints: "Look left or right across the layers", "Look around the grain-covered
hollow", "Look back toward the broad layered face", "Look down into the hollow",
and "Hold this view". Removed instructions to zoom closer when controller has no
zoom axis. This does not add a fake evidence reticle or new scientific content.

## Survey API

`view.setSurvey(true)` frames a close rover view and begins a fresh survey;
calling true again resets it. `setSurvey(false)` clears input/state. Stub API is
also present when WebGL cannot initialize.

Bubbling canvas event every >=100ms: `survey-sample`, detail
`{ yaw, pitch, steady }`, radians relative to the settled starting gaze:

- yaw positive RIGHT, negative LEFT.
- pitch positive DOWN, negative UP.
- steady means actual world gaze moved <.016rad in the previous sample interval.

Origin is captured after the framing tween finishes, and before look input is
accepted. Survey rotates **gaze around a fixed camera eye**, not the camera orbit
around the rover. Gaze polar has the opposite relationship to viewing up/down
from orbit polar; this implementation uses the actual gaze. The camera stays
above terrain while sky and ground aims remain reachable. Target-ground clamping
and OrbitControls updates are bypassed for active survey gaze. Right stick and
canvas pointer drag move the gaze; reduced motion moves it directly as well.
Resize preserves the survey's fixed camera/origin. Pause clears held input and
pointer state, retains the reference, and emits no samples while paused/hidden.
Remote handover, active contact, reset, non-game mode and destroy clear survey.
All new pointer listeners are removed on destroy. Survey blocks rover movement.

The existing Mars world supplies terrain, rover and dust/sky evidence; no new
world markers or scientific assertions were added. Survey target/hint meaning is
owned by root's fieldwork profiles/UI, not this renderer.

## Checks actually run

- `node --check src/ui/landscape.js`: PASS.
- `node scripts/check.mjs`: PASS, 39 JS syntax / 12 scene contracts / assets.
- `node tests/engine/fieldwork.test.js`: PASS, 4 tests (root-owned pure state
  machine; this confirms current relative-angle contract, not rendered views).
- `git diff --check -- src/ui/landscape.js`: PASS.

No browser visual/playthrough or physical controller verification in this lane.
Root is checking browser integration. In particular verify starting evidence fill,
rover omission/restoration, deliberate reveal then stable hold, both survey axes,
all profiles, reset, pause, reduced motion and Earth remote guards.
No commit in shared checkout.
