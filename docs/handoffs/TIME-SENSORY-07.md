# TIME-SENSORY-07 handoff

Changed: `src/ui/landscape.js`, proposal `docs/reviews/TIME-SENSORY-07.md`, this handoff.
No sound, gameplay camera, input, travel, asset or dependency changes.

Added `setMissionAge(years)` to live and fallback renderer APIs. Finite numeric
values clamp to 0–14; invalid/nonfinite values become zero. Uniform stores age
before NASA GLTF loading and is referenced by every deduplicated eligible model
material. Reset returns it to zero. Setter draws immediately even when paused.
All changes are absolute uniform values, so repeat calls and decreasing age are
reversible. Integrator owns selecting narrative ages and calling the API.

Actual NASA MeshStandard/Physical materials gain a maximum 22% dust-color mix on
up-facing normals, preserving mapped luminance variation; the same small mask
raises roughness toward .88 and suppresses metalness. Base map/material fields
remain unchanged. World-facing normal uses the renderer's normal transform, so
model rotations are respected. No shader effects are applied to landscape,
controls or labels. Existing custom compilation/cache behavior is chained.
Zero new textures, geometry, draw calls, source nodes or per-frame traversal.

This is artistic elapsed-time staging, not actual historical panel dust, measured
condition or damage. Keep it independent of power/weather and do not progressively
intensify it through the final storm. Root should retain existing dramatization
labels and omit the finish if first-vs14-year screenshots read opaque or broken.

Validation: `node scripts/check.mjs` passed (34 JS syntax checks, 12 story
contracts, local assets and GLB/license checks). `git diff --check` passed for the
renderer/proposal. No browser shader-compilation, image-comparison, iPad hardware
or human-feel check performed by this lane. Integrator performs close normal/
portrait/iPad landscape first-vs14-year comparisons and full runtime checks.

No commit made in shared checkout. Review remains at
`docs/reviews/TIME-SENSORY-07.md`.
