# ARTIFACT-06 — authored geology and establishing camera

Changed `src/ui/landscape.js` only (plus this handoff). No binaries or new external assets.

Last Chance now has asymmetric shoulders/crown, curved cross-lamination packets,
weathered depth relief, and four merged material batches replacing individual
lamina draw calls. Existing scanned stone maps remain in use. A single instanced
talus batch stages broken plates around both targets. Berry Bowl is now a real
concave, chipped-rim bedrock mesh with small surface cavities, rather than an
extruded flat plate. Its 96 deterministically varied concretions include embedded
nodules and loose grains concentrated in the hollow. Colors/axes/weathering vary.

All observation coordinates, target vectors, normals, existing APIs and movement
pace are preserved. Approximate artifact budget: 8 draw calls (4 lamina materials,
back, bowl, grains, talus), 96 sphere instances, 34 talus instances,
1,664 bowl triangles; merged strata reuse existing geometry complexity. Resources
are tracked in the existing disposal set, including the new InstancedMesh. Temporary
unmerged strata geometry is disposed immediately. No runtime randomness.

## Integration

`setIntro(active, { progress = 0 } = {})`: root owns normalized paused-aware
clock (intended 9 seconds), cue text, skip, and finish. Camera smoothly establishes
Last Chance from the current rover framing then returns. While active, drive/look
and OrbitControls are guarded. `false` restores saved framing, clears stale drive
and look, and restores orbit availability. Reduced motion and no-graphics fallback
are safe no-ops. Restart also clears the intro. Caller should end intro before
changing to investigation/contact framing.

## Primary references and design interpretation

- NASA Last Chance cross-lamination: https://science.nasa.gov/photojournal/last-chance-evidence-of-ancient-water-flow/
- NASA annotated interpretation of thin cross-stratified and possible concave bedding: https://photojournal.jpl.nasa.gov/catalog/pia05482
- NASA Berry Bowl description of an indentation rich in spherules: https://science.nasa.gov/image-article/apod-2025-june-22-a-berry-bowl-of-martian-spherules/
- NASA Last Chance textures and concretions: https://science.nasa.gov/resource/clues-to-wet-history-in-texture-of-a-martian-rock/

Geometry is an original teaching reconstruction with exaggerated readable scale,
not a surveyed NASA model. Concave bedding, asymmetric erosion and an actual
Berry Bowl hollow implement those reference features. Stage hierarchy (one readable
hero, low secondary debris, clear inspection face) is a design inference.

## Checks

`git diff --check -- src/ui/landscape.js docs/handoffs/ARTIFACT-06.md` passed.
`node --check src/ui/landscape.js` passed with the runtime path supplied by the
integrator. `node scripts/build.mjs` also passed (static build written).
Switching reduced motion on during the intro restores the camera and
clears intro/input state immediately. Browser visual/hardware review remains required:
confirm front face and bowl are visible, inspect both evidence targets, intro skip,
reduced-motion, touch/controller, and mobile frame budget. No publication or commit.

## Browser-feedback material correction

Integrator browser review found pale wedges and little visible mineral detail.
The sediment shader had collapsed scanned albedo to a near-constant gray. Restored
muted scanned tonal/color variation, raised normal strength from .14 to .42, and
authored continuous 1.35 cycles/metre UVs on strata caps/sides and bowl. Lamina
vertices are now welded before normals are recomputed, removing non-indexed
triangle-fan faceting. Shared draw-call count is unchanged. Syntax, static build
and whitespace checks passed after this correction; integrator visual reload pending.

## Final Berry Bowl browser-feedback polish

Added a subtly lighter brushed comparison circle directly in the bowl material
shader, with faint concentric sweep texture. Nodules are excluded from the patch
including their overhanging radii. This is an authored educational comparison
surface, not a claim of surveyed Berry Bowl geometry or an exact rover abrasion.
Lifted nodule base/instance colors to weathered gray and reduced radii 25% to
avoid black fruit-like beads. Added an independently mapped duplicated rim for
proper vertical side UVs. Draw-call count remains eight. Bowl entrance view now
starts at oblique direction (2.4, 1.1, 2.8), avoiding the rover mast while still
asking the player to look down. Site target coordinates/normals remain intact.
Syntax, static build, and whitespace checks passed; root reload pending.

## Close gameplay camera — explicit user steering

Normal play now uses the intimate rover offset equivalent to (3.2, 1.65, 3.8)
from its ground position, with a horizontal fit for the 2.4m rover plus shoulders
in portrait/iPad. Gameplay orbit range remains close; geological inspection keeps
its own subject framing. Uplink uses the same close rover frame rather than the
11.6m antenna/beam overview. Leaving inspection or advancing targets resets to the
close travel composition, preventing old overview framing from carrying forward.
Intro exit also resolves to the close game frame. Title/ending remain wide, and
resizing gameplay recomputes portrait fit. Syntax and whitespace checks passed.
