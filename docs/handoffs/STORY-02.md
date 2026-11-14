# STORY-02 handoff

Changed `src/content/story.js` and this handoff. No runtime, CSS, source list, or legacy narrative changes; no commit.

Added `subtitle`, `objective`, `discovery`, and `response` to all 12 scenes. Added `shortLabel` and `shortReply` to all 22 choices. Limits: 18/8/24/18 words per scene field and 5/18 per choice field. These fields support brief play-facing dialogue and actions, with existing prose available for an optional journal. Rover thoughts give way to Earth-side perspective after contact ends. Invented Earth responses remain explicitly marked imagined; the last image has no invented final rover statement. The ending closes with a short thought, factual payoff, and archive objective.

All scene/choice IDs, scene order, memory objects, legacy fields, historical outcome, and source references remain intact. No new claims or sources introduced. Runtime should render the new fields at the appropriate observation/choice/transmission stages and preserve the existing fiction disclosure.

Checks run and passed:

- `node scripts/check.mjs`: syntax, 12 scene contracts, local assets, NASA GLB, vendor license.
- `node tests/engine/session.test.js`: six tests, including all 2,048 choice paths and save restoration.
- Inline assertion over all new fields: nonempty strings and agreed word limits for 12 scenes and 22 choices.

Browser playtest not run in this lane; integrator owns runtime integration and visual pacing verification. No unresolved content blocker.
