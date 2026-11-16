# WORLD-41 — critical review of continuous-world photography

The user rejected v0.21's detached photo stage. That rejection is correct: matching
cropped source compositions replaced the place the player had explored with a
separate exhibit. Passing lifecycle tests and reviewing cropped comparisons did
not establish immersion or visual quality. The dark aperture hid finite terrain
instead of fixing that design error.

Three GPT-6.1 Sol lanes separated camera/world implementation, geology refinement
and a read-only critic. The critic inspected the original NASA images, rejected
v0.21 capture and successive full-window captures. Root exercised the actual UI.

## Issues found and addressed

- Detached stage, substitute rover deck and artificial missing-pixel mask: removed.
  Photography renders the playable world from the real rover mast; its lens and
  eye transition continuously. The authentic incomplete image appears after capture.
- Over-tight physical camera view: full screenshots exposed clipped rocks and loss
  of context. Lens fitting now uses world bounds and the actual crop, with a smooth
  return to the prior field of view. The rover itself remains visible.
- Berry Bowl's wide painted-looking cracks and oversized round beads: narrowed and
  softened fractures, removed bright rims, reduced and flattened the concretions.
  Its lower slab shape and tool sampler were changed together. The critic cleared
  the second full-frame capture and active brushing surface.
- Last Chance's plywood appearance and see-through gaps: fixed horizontal texture
  coordinates and replaced its existing backing with a solid, bevelled core behind
  the lamina face. Trace coordinates remain intact. The critic cleared the revised
  mast view and active layer guides, which lie on the visible rock.
- Environment improvements must exist outside photography: persistent pale fractured
  bedrock patches now sit in the landing area; landmark refinements are the same
  objects during driving, investigation and capture.

## Remaining criticism

Last Chance remains taller, more angular and more deeply shelved than the real
weathered outcrop. Berry Bowl still reads as one bounded slab rather than a broad
network of interlocking bedrock. The landing view and valley terrain only loosely
resemble their references; they are not surveyed reconstructions or pixel matches.
Saved checkpoints do not reconstruct old wheel tracks. Those limitations are real,
not resolved by passing tests. The source photos retain their own viewpoints,
lighting, monochrome processing and instrument noise.

This bounded correction restores one coherent world and improves its existing
assets. Further silhouette and terrain modeling would need to preserve navigation,
collision and investigation surfaces together. Do not return to separate photo sets
or claim automatic tests establish emotional quality or photorealism.

## Final verdict

No remaining visual blocker for this bounded correction. Root completed a short
manual drive around obstacles, the normal valley survey and the subsequent mast
view without substituting a scene. The critic reviewed that frame: the actual
rover and rear terrain are continuous, but the tracks are too faint to claim a
strong match. The review covered source code, five NASA JPEGs and supplied full
gameplay captures; root performed the browser interactions.
