# GRAPHICS-10 — bounded landscape realism

Scope: `src/ui/landscape.js`; preserved existing VIEW-10 APIs and lifecycle.
No new assets, dependencies, postprocessing, or draw calls. No commit.

Code-inspection critique: scanned dry PBR, NASA hardware, terrain macro variation
and a Mars-specific blue solar halo already exist. The useful remaining gaps were
fixed bright/cool fill persisting into storm/night, horizontal wheel contact
patches on slopes, rubble placed against unmeshed noise, and shadows remaining
centered on the origin during travel. These are inspection findings, not a
claim that a browser or physical device was tested.

Changes:
- Palette-aware sky/ground bounce, restrained fill and matching solar color.
  Ground bounce retains a dark diffuse floor rather than becoming a second key.
- Recenter the existing single directional shadow map around the rover, snapped
  to shadow texels; stable light direction and coverage without extra lights.
- Align existing wheel occlusion patches with sampled ground slopes and place
  field rocks/pebbles against the rendered terrain's interpolated height.
- Subtle cross-scale sediment color deposits reduce ground tile repetition.
- Following the user's removal of the iPad target: desktop pixel ratio cap 2,
  2048 shadow map and up to 8x scanned-texture anisotropy for grazing views.
  No frame-rate or device-performance claim.

Checks run with the requested bundled Node:
- `node scripts/check.mjs`: PASS, 36 syntax checks, scene contracts/assets.
- `node tests/engine/surface.test.js`: PASS, 2 tests.
- `node tests/engine/drive-motion.test.js`: PASS, 7 tests.
- `git diff --check -- src/ui/landscape.js`: PASS.

Next: integrator browser review of close rover daylight, storm/night brightness,
wheel contact on slopes and travel shadows. Shader compilation and subjective
lighting require browser review; this lane did not touch the live user browser.
The landscape diff also contains pre-existing VIEW-10 work from the integrator;
this lane preserved it instead of reverting or claiming it.

## Waypoint guidance follow-up

Added bubbling `waypoint-guidance` events from the canvas at approximately 100ms
intervals while an unreached waypoint is active in gameplay. Suppressed when
paused, in intro, disposed, or in remote view. Uses the actual waypoint x/z and
rendered terrain height + 1 world unit, transformed into camera space. Targets
behind the camera are always offscreen and retain correct lateral direction.
No DOM or draw calls added; VIEW-10 controls remain intact.

Detail contract: `{x, y, onScreen, angle}`. x/y are normalized viewport coordinates
with top-left origin, clamped to x .12–.88 and y .32–.72; offscreen positions meet
the safe rectangle along the center-to-target direction. onScreen means inside
the actual camera frustum (including near/far), not the smaller HUD rectangle.
angle is degrees clockwise from up: 0 up, 90 right, 180/-180 down, -90 left.
A directly rearward degenerate direction points down. Root owns label visibility,
CSS arrow rotation and browser testing. Bundled Node syntax and diff whitespace
checks passed for this follow-up. Browser verification remains unrun here.
