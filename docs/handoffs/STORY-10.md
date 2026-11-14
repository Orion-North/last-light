# STORY-10 — make each choice and role legible

Scope: `src/content/story.js`, `src/engine/briefing.js`, `tests/engine/briefing.test.js`.

The mandatory story now establishes that the player is Opportunity, the first action is looking through the cameras, the science goal is ancient water, and choices select memories for the final archive. The opening remains three beats across twelve seconds; its timing code is unchanged.

Mars choices consistently name a concrete thing to send (crossing layers, surrounding plain, blueberry grains, brushed patch, tracks, horizon, sunlight, shadow). Their short replies distinguish what each selection means. Long labels match the visible short labels. Geological discoveries connect visible features to scientific interpretations; archive entries retain those details. The storm states that memory choices cannot change it. June 10 explicitly ends contact without inventing a spoken last message.

Earth's role change now appears in the mandatory subtitle, objective, discovery, and receipt. Earth choices remember waiting versus recovery work, preserve science versus the rover's story, and offer two distinct farewells. None imply that a choice changes the recovery outcome. Existing IDs, source links, source IDs, receipt modes, and historical outcomes are preserved. No interface fields or dependencies added.

Checks run with bundled Node:
- `scripts/check.mjs`: PASS (all existing field budgets and source references).
- `tests/engine/briefing.test.js`: PASS, including concise three-beat instructional sequence.
- `tests/engine/game.test.js`: PASS, 10 tests.
- `tests/engine/session.test.js`: PASS, including all 2,048 story paths and save/restore compatibility.

Review findings for integrator: presentation still needs to make Mars sending, Earth calling, and archive saving visibly different; content now supplies the appropriate role and verbs. The current `endingMemories()` highlights only the first three memories and final farewell, so the complete archive remains important for later decisions to feel acknowledged. Copy inspection and automated checks cannot establish emotional effect; muted controller playthrough and human playtest remain necessary. No browser test performed in this lane. No commit or publication.

Integration follow-up: first action and opening now say “look through your cameras,” matching the deployed mast and first-view camera reveal. Briefing tests and content checks rerun and pass.
