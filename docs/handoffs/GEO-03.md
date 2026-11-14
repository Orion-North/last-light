# GEO-03 — authored discovery targets

Scope: `src/ui/landscape.js` and this handoff. No commits or publication.

- Replaced the nearby decorative stack with Last Chance at its existing goal. Three packets of individually extruded inclined laminae alternate dip and truncate against packet boundaries. Material contrast and relief make the crossing structure readable.
- Added a pale Berry Bowl slab with 68 instanced, rounded dark grains at its existing goal. These are artistic teaching reconstructions, with deliberately readable grain scale, rather than surveyed geometry or literal instrument imagery. Historical interpretation remains in story content.
- Physical targets sit behind their approach markers, have collision radii, and preserve all six existing routes. All authored geometry/materials and instancing participate in cleanup.
- Added `setObservationTarget(goalOrNull)` independently of navigation. `setWaypoint(null)` only hides navigation. `inspect()` frames the retained target, including after loading a save at choose/transmit. Other goals frame their terrain position.
- Inspection uses bounded orbit/zoom, a portrait distance adjustment, immediate reduced-motion placement, and returns to rover framing on driving, assisted travel, focus, or reset. Enabling reduced motion also finishes an in-progress camera transition.

Integration: call `view.setObservationTarget?.(goals[state.sceneIndex] || null)` on each scene update, including restored saves, before invoking `inspect()`. Continue hiding the beacon via `setWaypoint(null)` after arrival. No new packages/assets or photography mechanics.

Checks actually run:

- Runtime Node `--check src/ui/landscape.js`: passed.
- `git diff --check -- src/ui/landscape.js`: passed.
- Temporary numeric route probe reproduced the seeded original rock collisions plus authored target collisions; searched the same 0.8 m grid and midpoint clearance at the stricter assisted-driving 1 m margin. Sequential arrival positions were reachable for all six goals: `(6.4,-6.4)`, `(-4,-9.6)`, `(-10.4,2.4)`, `(5.6,9.6)`, `(12.8,-0.8)`, `(4,-4)`. Probe removed after execution.

Limits: browser rendering, touch/keyboard, portrait composition, reduced-motion behavior, and complete journey were not exercised by this lane. Integrator should visually inspect both targets on desktop and phone viewport and verify resume/drive release behavior. Grain dimensions and exact lamination geometry are illustrative; no new factual source claims are made.

## Visual refinement after integrator screenshot review

The initial geometry read as striped rectangular blocks and a smooth disk. Refined both without changing target/navigation contracts:

- Last Chance now clips each lamina against one chipped, irregular boulder silhouette, with shallow shared warping, softened eroded bevels, reduced color contrast, and much smaller interlayer depth differences.
- Both rocks use a separately owned repeat of the existing procedural soil texture for sandstone color and bump. Berry Bowl is now an irregular angular plate with a gently uneven surface; grains have rougher, less metallic response.
- Camera targets, collision radii, and seeded background-rock distribution are unchanged. No new assets/downloads.
- Repeated runtime Node syntax and `git diff --check`: passed. Visual browser confirmation remains with integrator; the refinement responds to the integrator's actual screenshot findings, not a new browser check by this lane.

## Portrait fitting correction

Integrator observed target cropping at 390×844. Replaced the fixed portrait multiplier with a field-of-view/aspect fit for the ~3.25 m subject, 18% horizontal breathing room, and depth allowance. Orbit maximum now expands with the fitted distance, preventing the desktop 6.5 m maximum from undoing the portrait fit. At 390×844 and 43° FOV the horizontal-fit distance is approximately 11.7 m before orbit allowance. Substantial aspect changes (>8%) while inspecting immediately reframe the retained target, including when paused; no camera UI added. Syntax and whitespace checks passed. Awaiting integrator screenshot validation for dock clearance and final visual scale.
