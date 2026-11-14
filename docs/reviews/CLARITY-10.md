# CLARITY-10 — actions must demonstrate the story

Independent source critique, 2026-11-14. Read AGENTS, README, CONTRIBUTING, PLAN, TASKS, current main/content/briefing/objectives/experience/landscape/upload presentation and earlier clarity review. Only this review is owned by this lane. No live browser, controller output, audio audition, playthrough or hardware-feel claim. Concurrent story/runtime changes can supersede observations below.

## Diagnosis

The player can follow instructions without understanding what the actions accomplish. They press to look, choose between poetic nouns, squeeze a memory title, and continue. The interface explains the ritual more often than it demonstrates a discovery, a recipient, or a consequence. Stronger resistance can make that ritual more satisfying, but cannot supply its meaning.

The core story should be legible from three experiences: **I show Earth something they could not otherwise see; Earth answers; dust removes the light and eventually the answer.** Later, the player must unmistakably become the people calling back. That causal spine is more useful than another identity paragraph.

## Highest-impact fixes for this pass

### 1. Make the Earth handover a change of composition, not only wording

At `earth-listens`, `scene.environment='earth'` changes the Mars palette; `desiredFrame()` still frames the rover. Observe immediately advances because signal is zero. Then the same central memory apparatus sends upward, with its destination changed to OPPORTUNITY. This leaves a rational player thinking they are still the rover trying to call Earth. On phone upload screens the heading is hidden, removing another role cue.

Bounded implementation: at the existing act transition, pull away from the rover or freeze/dim its image as a remote subject; make the instrument source visibly EARTH and target OPPORTUNITY, retaining both endpoints throughout the interaction. Reverse the established direction/receipt relationship. A short existing caption can say “Now, on Earth.” The meaningful change is who sends and which endpoint stays dark. No mission-control room model is necessary. Keep the rover image explicitly remote rather than giving its ordinary follow camera the same agency.

Do not imply that a selected remembrance is the historical command payload. The Earth choice is what this story remembers; calling is the shared action. Decouple those meanings in the existing instrument instead of labeling a “Thank you” memory as a literal recovery command.

### 2. Show each choice before asking the player to commit it

`renderGame()` discards authored `detail` and gives every option “Choose a memory.” Choosing “Send the horizon” does not change the framed subject, then opens a second send action. At Last Chance “fine lines” versus “wider view” is especially suitable for a visible consequence, yet remains two text alternatives over the same image. This teaches that choices are decorative menu advancement.

Bounded minimum: use each existing concise detail in its existing choice slot; make verbs describe selection rather than falsely promise that the choice already sends. On focus/selection, frame the horizon versus ground, or detail versus wide outcrop. Keep the chosen subject visible behind/within the memory band during compression, then send that subject/title. Scope first to the first two choices rather than adding a new camera system for every poetic option. Reduced motion can snap to the same end composition. The player should predict the difference before confirming it.

If only one runtime change fits, preserve a small visual token of the selected memory through sending, receipt, and the next scene. The ending list alone is too delayed to teach consequence. No inventory panel is needed: reuse the selected band and receipt.

### 3. Turn the first press into a visible act of seeing

“Raise your cameras” currently calls generic `inspect()` plus a one-second timer. There is no observation target for scene zero, so the framing remains rover-centered. The tutorial has said “be their eyes,” but the first action does not establish a camera view or subject. The first full trigger interaction consequently feels like charging a UI object whose relationship to Mars is unclear.

Bounded implementation: use the existing inspect camera transition for a deliberate rover-to-first-view reveal. Let the resulting landscape remain visible while choosing horizon/ground. On send, depart from that subject; on reply, return a small distinct receipt toward the rover/player. Keep the first healthy send fast and dependable. The player should be able to explain “I showed them this view, and they saw it,” without reading the journal.

### 4. Establish dust → less light → silence through changed familiar behavior

The story currently names fading light, but later goals include “A clearer view of the sky” and “The last sunlit ridge.” Driving toward those markers can suggest a survival solution: find better sunlight and save the rover. Meanwhile transmission effort increases with low signal. Together these affordances risk teaching that the player's mechanical competence determines survival.

Keep the fixed history and forgiving thresholds. Stage dust visibly before the first weakened send, and repeat the familiar first-send composition as the receipt becomes incomplete and then absent. A brief existing caption can identify that dust blocks sunlight. Avoid framing travel as a light-seeking remedy; treat those sites as looking/remembering stops. Do not introduce a new fail state, narrower charge window, extra mandatory attempts or an escalation that makes endless squeezing look like the recovery solution.

## Trigger feel implications

The user's request for strong effects at the start of travel is compatible with clarity: early resistance should correspond immediately to visible inward plate motion. Late force/vibration should coincide with the moment the compressed memory becomes ready; release should cause a distinct departure. Strong early force without visible motion can read as a locked or broken control, especially before the player knows the mechanic. Keep analog success thresholds unchanged and the button path obvious.

The strongest sensory climax must have a clear owner. “Charged” is local readiness; “sent” is local departure; “received” is a remote acknowledgment. They should not share one success burst. Later unanswered calls still need local departure confirmation, but never a received cue. Physical effort may increase with fading link, yet must not imply “press harder to rescue Opportunity.” Archive keeping should feel settled and lighter, not like another failing radio transmission.

## What not to add

Another onboarding paragraph, another glossary, more permanent HUD labels, a signal-alignment puzzle, survival resource consumption, or a new errand will not resolve the present mismatch. Essential meaning must survive with sound off, the journal unopened, and the introduction skipped. The existing twelve-second introduction can establish the premise; the first action must prove it.

## Review gates for root's actual build

Use a fresh save, muted, and skip the introduction once. After the first receipt, ask a new player: Who are you? What did you show? Who answered? What changed because of your choice? At the act-three handover ask: Where are you now, and who are you calling? After one unanswered call ask whether stronger/better input could change the historical outcome. Answers reveal story comprehension; successfully completing button presses does not.

Prioritize first-view causality and Earth role reversal above cosmetic typography. Existing automated tests can verify mode-specific endpoints, selected-memory continuity, one-shot release, and absence of a received cue on silence. They cannot establish whether the player cares or whether stronger hardware resistance feels good. Those remain physical/new-player playtest questions.

No external game comparisons were needed for these source-grounded findings; no claims about other games or new historical facts were introduced. No runtime edits, publication, or commit made by this lane.
