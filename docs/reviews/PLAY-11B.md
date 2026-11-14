# PLAY-11B — story and player experience review

2026-11-14. Source/engine review only; **not a completed playthrough**.

## Evidence and completion

I read AGENTS.md, README.md, PLAN.md, TASKS.md and CONTRIBUTING.md, then story.js, time.js, briefing.js, game.js, experience.js, objectives.js and the main.js rendering paths. Attempting an isolated IAB review tab failed with “Browser is not available: iab.” Browser inventory was apps=[] / browsers=[]; reset and retry produced the same inventory. No public user tab or physical controller was touched. No scenes, routes, visuals, audio or controller sensations were witnessed. Autodrive was not used. No browser screenshots exist from this reviewer.

Executed the actual content and engine modules through node_repl: **all 2,048 binary choice paths** traverse the eleven interactive scenes and reach `what-remains`, complete, with eleven distinct scene records per archive. This validates engine progression only, not navigation, investigation, rendering, input or emotional effect. The ordinary shell's `node` was unavailable; the successful check used node_repl absolute module imports.

Source sequence reviewed: first-morning → stone-ripples → blueberries → marathon → ordinary-day → dust → smaller-world → last-image → earth-listens → months → last-call → what-remains.

## Main assessment

The premise is legible: be the rover, investigate evidence of ancient water, carry observations to people on Earth, then become those people after contact ends. The best design is the changed meaning of an established send-and-receive action. The main risk is that eleven compulsory binary text selections make every beat feel like archive administration, including the loss of contact. This is an inference from the interaction structure, not a measured fatigue report.

The renderer matters: ordinary play uses subtitle, discovery, choice label/detail, selected shortReply and scene response. Much of the lyrical `text`, `thought` and choice `reply` is not delivered by that main rendering path. Do not credit unseen prose with explaining an action, and do not remove dormant prose expecting the mandatory reading burden to shrink.

## Prioritized recommendations

1. **P1 — Make the storm replay the player's experience, rather than offer generic retrospective sentiments.** `dust` and `smaller-world` ask for newly authored choices about first mornings, people's care, discoveries and shared routine. Revisit an actual selected early memory, using its title and an associated view. Let one deliberate resend carry Act II; avoid adding more abstract binaries. Historical outcome stays fixed, while a consequence of the player's earlier attention becomes visible. Acceptance: two players who chose different first views recognize different callbacks before the ending.

2. **P1 — Give the incomplete final frame its own interaction rhythm.** `last-image` currently still requires choosing between two interpretations of the same frame before transmission. Both are humane interpretations, but neither is an interesting operational decision. Stage look → send → incomplete receipt, with the player's next action only after the break. Keep “no final spoken message” explicit. Acceptance: the loss is conveyed through the missing familiar receipt, including muted play, before interpretation text explains it.

3. **P1 — Let the Earth role begin by doing Earth's work.** The seven-second handover, role labels, objective and call direction are already explicit in source; retain them. But `earth-listens` asks which remembrance a call will remember before the player calls. Put the call first and make curation subsequent or optional. A changed verb, origin and feedback should demonstrate the new role as well as announce it. Acceptance: the player can answer “I am now calling the rover from Earth” from action and presentation alone.

4. **P2 — Show a concrete consequence beyond a changed sentence.** First-morning previews different views; that is a good model. Other choices mostly alter archive title/text and the terminal's meaning line, while the scene response remains common. Carry selected geology or track imagery into the message and later archive. This provides ownership without inventing historical branching. Acceptance: the player can identify what selecting the brushed patch changed without reopening a prose log.

5. **P2 — Leave the final silence room to exist.** `transmissionProfile` gives silence a two-second delay, followed by an explicit no-reply result. That is clear feedback; runtime timing and feeling remain untested. Offer an unforced lingering view with Continue available, keep one concise no-failure assurance, and move repeated explanatory reassurance to the journal. Do not simply add a long mandatory wait. The aim is space for the player's response rather than instructions on how to feel.

6. **P2 — Pay off more of the actual journey on the ending.** `endingMemories` currently chooses the first three memories and the last. This can omit the marathon, ordinary afternoon, storm and Earth recovery regardless of what those meant to the player. Consider first view + one science observation + one late remembered moment + farewell, with the full archive optional. Acceptance: the short ending recalls at least one middle/late personal choice instead of only the tutorial/science opening and farewell.

## Scientific and emotional framing

Source correctly distinguishes ancient-water evidence from evidence of life, explains solar energy loss, identifies an incomplete transmitted full-frame image rather than asserting it was the last photograph taken, and states that there was no spoken final message. Imagined replies carry explicit labels, recovery occurs on Earth, and choices cannot save or doom the rover. These are important strengths to preserve. This review checks the project's framing, not an independent external fact audit.

The danger is emotional redundancy rather than insufficient sadness: the changing sky, missing receipt, role reversal, months of attempts and selected archive already provide a coherent arc. Repeating their moral interpretation in every selection can reduce the player's opportunity to discover that meaning. Geological questions are strongest when the player first encounters a feature, then learns what it means; avoid revealing their answer through a title before the observation.

## Studio-quality comparison criteria

This assessment uses general craft criteria, not claimed firsthand comparisons with particular games: establish an action with a clear purpose; make a later variation consequential; let environment and changed feedback carry story; protect quiet staging; and make choices legible through their results. Last Light has the right repeated action and historical boundary. Its largest opportunity is to vary that action at the turning points and show selected details returning in the world, instead of multiplying text choices.

## Required follow-up

An actual fresh-session UI playthrough remains required, from the opening through all twelve scenes, with manual route observations, muted receipt comprehension, Earth role recognition and ending recall. Do not count this report's 2,048 engine paths as that playthrough or as evidence of attachment, pacing, fun, graphics quality or physical haptics. No implementation was changed in this task.

## Follow-up source review — new signal map and fieldwork

Browser reset/inventory was retried during this follow-up; still apps=[] and browsers=[]. No new UI evidence or full-playthrough claim. Findings below are source-derived integration risks, sent to the integrator; no code edited during this follow-up.

- **P1, reversed Earth call:** the new CSS reverses world order for silence (Earth becomes left, Mars right), then mirrors the path. The packet's logical left-to-right animation therefore renders right-to-left, from Mars to Earth, contradicting its label. Use one reversal strategy, not both. Verify call origin with an actual screenshot sequence.
- **P1, signal animation can be cut short:** normal packet animation is 1.7s while reply profile delay remains 1.2s; partial animation is 2s while its profile delay is 1.6s. Main rendering swaps the sending terminal for received at that delay. Synchronize durations or delay receipt until the visual departure finishes. Otherwise the most important destination proof can disappear early.
- **P2, pressure metaphor disagrees with input:** the wave intensity uses average left/right squeeze; charge logic uses minimum. One fully pressed trigger energizes the wave halfway while contributing no valid paired pressure. Independent trigger strips are useful; combined carrier intensity should follow paired pressure, while a charged state must have a clear release cue. Live main.js hint does explicitly say release both triggers when charged, which is a strength.
- **P2, fieldwork evidence remains unproven:** my relative sectors validate where the camera points, not whether tracks, a valley rim, wheel marks or the Sun occupy that region. Titles and hints cannot make a geometric teaching activity real. Frame actual evidence in those directions, anchor targets to a world point, or use honest generic sky/ground wording. In particular, “toward the dim Sun” must match the rendered Sun. Do not advertise these sectors as measuring optical depth or identifying mineralogy.
- **P1 integration check, reachable holds:** new landscape fixed-eye gaze is a better fit than the earlier orbit camera's downward clamps. Each profile still needs actual input reachability checks from its arrival pose, including right-stick sign and pitch. `sampleSurvey` emits every .1s; the pure engine needs that sample interval, not one animation-frame delta. Feeding .016s at 10 samples/s silently turns a .6s hold into roughly 3.6s.
- **P2, overlap means sectors are not necessarily three distinct looks:** tolerances are generous. In dust, the first and second yaw/pitch boxes overlap; in last-image, the second and third overlap. A carefully positioned stationary view can collect adjacent ticks. Either accept this intentionally as accessibility tolerance or require a small new movement/entry per completed tick; do not call it three distinct observations without checking.
- **P2, automatic recall narrows agency:** after menu removal, new runs automatically record layers and care, so smaller-world normally selects discovery. The together route remains possible chiefly in old saves. This is deterministic preservation, not a robust personalized callback. Replaying the first selected horizon/ground view remains a more honest personal consequence.

The signal map improves explicit origin/destination labeling, includes a compressed-travel disclaimer, separates archive from communication, and provides visible no-return outcomes. These are promising source features, not verified visual comprehension. Reduce-motion states preserve a visible packet and text, but static direction still depends on endpoint labels and must be checked at runtime.
