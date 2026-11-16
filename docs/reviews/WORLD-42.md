# WORLD-42 — playable geology and camera responsiveness

This pass keeps one persistent world and the actual rover camera. GPT-6.1 Sol
implementation agents worked on geology and camera integration; a separate Sol
critic reviewed source images and full-window gameplay captures.

## Criticism that changed the implementation

- The first lower Last Chance looked like a thin plaque with layered veneers.
  Its rear body was rebuilt with real depth, a rounded crown and tapered edges,
  while preserving the mapped front contacts used by both trace paths.
- The first Berry apron looked like paving stones arranged around a display.
  Similar-sized exposed plates were replaced by unequal, broken fragments toward
  the rear and left, with outer edges partly buried and the right side open.
- Native mouse tracing exposed a transparent dock that intercepted the lower
  path after readings appeared. Display text now passes strokes through; buttons
  remain interactive. Both paths and the comparison button were exercised.
- The user reported slow post-capture progression and camera/head intrusion.
  The capture path removes a full PNG encode/decode/re-encode round trip. Reveal
  and handoff durations are 900 ms and 450 ms; slow-frame timing and image-loading
  waits are bounded. The original Mars–Earth sending ritual remains unchanged.
- A fixed eye just above the mast allowed wide downward views to intersect the
  camera head. The lens now follows a short arc outside the modeled head in the
  aim direction; the deck stays present in the world. Head bounds were checked
  against the bundled GLB.

## Remaining visual limitations

Last Chance is still visibly stylized: its sliced front layers have more regular
edges and terminations than the real outcrop. The fuller body resolves the thin
plaque problem but does not establish photographic reconstruction. Berry Bowl's
central surface remains an authored, simplified teaching specimen. Terrain,
mineral scale and viewpoint differences still limit the real-photo match.

The independent critic cleared both revised landforms for this bounded pass,
while retaining the limitations above. Berry fragments also retain some straight
bevelled edges and the central slab still has a raised front edge.

Validation and final camera review are recorded in ../VERIFICATION.md.
