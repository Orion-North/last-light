# STORY-AUDIT-16 — the work must survive into the memory

Source review only; no playthrough, user observation, or fresh historical verification. Read the required project documents, narrative direction and v0.16 writing reviews, current story/time/voice data, engine, main integration and interaction presentation. Runtime and Git untouched. This review distinguishes demonstrated content/selection defects from hypotheses about their emotional effect.

The new voice treatment is a substantial improvement: identity and ancient-water purpose are explicit, work precedes interpretation, and Opportunity stops speaking after contact loss (`terminal-story.js:34–46`). The Earth handover names both role and action (`time.js:22–28`); later observation screens preserve the Earth subtitle (`main.js:295`). Do not reopen solved boxes, premature elegies, or multi-speaker dialogue. The remaining concern is deeper: many actions produce records that do not describe those actions, and the ending hides the one late choice the player actually made.

## Five priorities

### 1. Make the archive describe the work actually performed — demonstrated mismatch

`recordedChoice()` returns the first authored option for almost every scene (`story.js:285–295`). Observing the storm sky produces **Light remembered**, whose text recalls earlier mornings (`story.js:149`), although the active thought says **“I’ll send this sky”** (`terminal-story.js:18`). The final recovery call automatically records **Thank you for showing us** (`story.js:260`), a farewell the player never selected. At smaller-world, the geology predicate is always true on a fresh normal run because Last Chance always records `layers`; its apparent alternate shared-routine branch cannot arise from current play.

Recommendation: author automatic records from completed work: dusty-sky observation, incomplete frame, unanswered recovery command. Preserve the actual first-view recall. Reserve “chosen” language for genuine selections; no extra menus. Validation: match every journal/download entry against the action that created it, on both first-view paths. Ask a player to identify anything the archive attributes to them that they did not do.

### 2. Let the late choice matter at the visible ending — demonstrated omission

Only first-morning and months retain curation menus (`story.js:287`). Yet `endingMemories()` selects first three records plus the last (`experience.js:28–29`), excluding months. The final record is automatically selected, so the two archive choices produce identical ending echoes. “Moments you chose” (`main.js:339`) mostly names mandatory records. The journal/download retain the difference, but the main payoff does not.

Recommendation: include the chosen months memory beside the first view and the two investigations; let its science/story emphasis determine the first archive item shown. Fixed mission history remains intact. Validation: compare two runs differing only in months; the ending should visibly reflect that difference without opening a secondary screen.

### 3. Teach the inference, beyond naming the result — design hypothesis

Last Chance reveals crossing directions; Berry Bowl contrasts lower/higher relative iron-bearing signals (`geology-tool.js:8–12`). Receipts then assert ancient flow and hematite (`terminal-story.js:25–26`). The required path offers no visible comparison explaining why that geometry implies water-shaped sediment, or how the simplified reading relates to the wider mineral evidence. The useful scientific reasoning exists in optional journal prose (`story.js:56–57,79–80`). A player can execute the tool correctly and learn only “crossing lines = water.”

Recommendation: retain a small visual comparison at completion/receipt: crossing sediment directions highlighted together, or both brushed-rock/grain readings held beside their surfaces. One qualified Opportunity thought can connect the visible evidence to mission interpretation; avoid implying the toy iron measurement independently identifies hematite. Validation: with journal closed, ask what was observed, what was inferred, and why this is evidence rather than present-day water.

### 4. Give the ordinary survey a specific discovery — design hypothesis

The ordinary-day survey requires three bearings toward floor, wheels and rim (`fieldwork.js:8–12`), then always names a bright stone edge (`terminal-story.js:17`). This risks training completion of amber targets instead of noticing something. Coordinate with gameplay review on alignment mechanics.

Recommendation: center this existing survey on one visibly lit stone detail and record that detail; reduce required bearings if they add no observation. Validation: hide the prompt after completion and ask the player to point to what they sent.

### 5. Give recovery time a perceptible change — design hypothesis

Eight months exist as dates/text (`story.js:225–235`); Earth observation immediately advances (`main.js:346`), and both unanswered calls use the same 2.4-second exchange (`experience.js:11`). Understandable chronology may still feel like two adjacent button presses.

Recommendation: within the existing recovery scene, let successive dated command traces accumulate and remain unanswered. Keep it skippable and player-paced; add no errands or forced mourning timer. Validation: muted playtest: distinguish first contact loss, sustained recovery and final closure, then ask whether the repeated call felt meaningfully changed.

No code check can establish attachment or sadness. These proposals need a fresh player to test comprehension and earned loss, not another favorable writing review.
