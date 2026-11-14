# PLAY-11B handoff

Owned changes: docs/reviews/PLAY-11B.md; src/content/story.js (appended exported recordedChoice only); src/engine/fieldwork.js; tests/engine/fieldwork.test.js; this handoff. No main/UI/taskboard edits.

Review is source/engine only. CUA browser unavailable even after reset. No firsthand full-playthrough, route, emotional, visual, sound or haptic claim. All 2,048 original content/engine binary paths reached the ending with eleven memories via node_repl before implementation.

Implementation: surveyProfiles keyed marathon, ordinary-day, dust, smaller-world, last-image. createSurvey(profile, origin={yaw:0,pitch:0}) returns sample({yaw,pitch,steady=true},dt), yielding {progress,complete,hint,step,total}. Radians relative to camera arrival pose. Positive pitch is down (polar increase). Three sequential views each require .6 seconds within .16 radians. Leaving resets the current hold, completed ticks remain; dt capped .1 to prevent frame stalls completing a view. Completed survey stays complete. Directions are authored relative views, not geometric raycasts: integration must ensure scene camera permits those targets, and must not describe them as physical object recognition.

recordedChoice(scene,state) returns a choice OBJECT or null, never an ID. Null for first-morning, months and ending. Fixed first existing choice elsewhere, except smaller-world uses discovery for a prior layers/care memory, together otherwise. Root must dispatch choice.id. Scene and choice IDs/save compatibility preserved. Note that automatically recording layers/care in a new run makes discovery the normal recall; old saves with landscape/name can produce together. This does not yet replay an actual stored view, which remains a stronger future improvement.

Root integration needed: initialize origin once at survey entry, feed actual camera radians and steady signal, render step/total ticks and hint; controller inspect mode; remove timed scan for five scenes; choose and dispatch recordedChoice after observation for non-menu scenes. Do not recreate survey every frame. Preserve deliberate send and historical outcome. Existing engine permits all original choices for old saves.

Checks: bundled Node tests/engine/fieldwork.test.js — 3 tests passed, 0 failed. Covers all authored surveys completing sequentially, origin offsets/yaw wrapping, leaving resets, steady gate/frame-stall cap, sticky completion, valid retained choice objects and recall/menu rules. No browser integration test run. No commit created.
