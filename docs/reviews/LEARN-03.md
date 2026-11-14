# LEARN-03 — discovery and learning

Baseline: `3aeb99c`. Read the project instructions, README, plan, task board,
contribution guide, `main.js`, `story.js`, and `landscape.js`; inspected the supplied
v0.2 screenshot. This is code/screenshot review, not a runtime playtest or a claim
to have played the references. Findings and predicted player effects are design
inferences; reference facts below come from primary sources.

The landscape and concise voice establish solitude, and the science writing
carefully separates evidence of water from proof of life. However, the current
loop mostly asks the player to arrive and click to receive an answer. It rarely
asks them to notice the evidence that makes the answer meaningful.

## 1. P1 — Make the first discovery visibly inspectable

**Evidence:** `src/main.js:149–161` runs a one-second scan timer, then
`src/main.js:117` prints the conclusion. `src/ui/landscape.js:479–505` frames the
rover during inspection. The layered outcrop is decorative geometry at a fixed
location (`landscape.js:178–191`), separate from the Last Chance goal
(`main.js:40`). The screenshot likewise emphasizes rover and beacon; it does not
show a diagnostic scientific close-up.

**Reference fact:** Mobius describes the Little Scout as a tool for photographs
and environmental hazard tests, making instruments useful for investigating
the world ([official Outer Wilds page](https://www.mobiusdigitalgames.com/outer-wilds.html)).

**Small change:** At Last Chance, open one credited NASA detail image already
identified in `story.js:14`; let players magnify crossing layers before revealing
the interpretation. Provide equivalent descriptive text and an immediate skip.
**Success:** Four of five new players can point to the relevant layers and explain
that they are evidence of past water, without opening the journal.

## 2. P1 — Teach one meaningful instrument action

**Evidence:** “Brush a clear patch” (`story.js:68`) invokes the same generic scan;
the crucial comparison of cleaned rock and grains exists in optional prose
(`story.js:78–79`). Players can finish knowing the word hematite without knowing
how the rover helped establish the claim.

**Reference fact:** Starward’s official store description identifies telemeter
and tracker use and interactions with analogue technology
([The Invincible](https://store.steampowered.com/app/731040/The_Invincible/)).

**Small change:** Make Berry Bowl a single before/after brush reveal, followed by
two labeled measurement samples, rock and spheres. No simulated chemistry or
precision minigame required. **Success:** Four of five players explain why a clean
patch enables a comparison and distinguish an image from mineral measurement.

## 3. P2 — Give guidance a question worth following

**Evidence:** `main.js:39–46` fixes the route; `main.js:114` tells players to follow
the beacon. “A river, remembered in stone” (`story.js:49`) supplies the answer
before investigation. Autodrive is useful accessibility support, but the current
motivation is task completion rather than curiosity.

**Reference fact:** Kelsey Beachum’s [GDC session](https://www.gdcvault.com/play/1027008)
describes player-determined, diegetic progression driven by curiosity.

**Small change:** Keep the finite route and assistance. Rename the pre-scan beat
“Why do these layers cross?” and give a visible pale-rock landmark before the
beacon instruction. Reveal the existing title after inspection. **Success:** Four
of five players can say what they are investigating before arrival.

## 4. P2 — Let the journal preserve discoveries rather than pre-answer them

**Evidence:** `main.js:131–134` exposes the current observation regardless of scan
phase. Its memory archive stores poetic selections rather than browsable science;
earlier scientific context can be harder to retrieve than the current answer.

**Reference fact:** Beachum’s [GDC slides](https://media.gdcvault.com/GDC%2B2021/beachum_gdc_2021%281%29.pdf)
describe signaling available information, player-chosen access, and revisitable
key information.

**Small change:** Before inspection, show an unanswered question. After inspection,
retain a three-line “saw / measured / inferred” entry with its NASA link, accessible
from the ending. **Success:** Players retrieve the water evidence in two actions
and explain why it does not establish life.
