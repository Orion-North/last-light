# Last Light v0.2 — information and experience critique

Reviewed November 14, 2026, baseline `3aeb99c`. Three independent GPT-6.1 Sol
reviewers examined the source and v0.2 screenshot; Codex checked their evidence
and synthesized the findings. This was not a new runtime or human playtest, an
audio audition, or a claim to have replayed the reference games. Reference facts
come from official studio/publisher descriptions and developer talk materials;
recommendations and predicted emotional effects are design judgments.

**Main finding:** the shorter HUD is a useful improvement, but the world still
illustrates information supplied by captions. The next iteration should let
players observe evidence, perform a meaningful action, and recognize a response.
Reducing word count alone does not accomplish that.

## What the professional references suggest

| Reference | Verified design emphasis | Application to Last Light |
| --- | --- | --- |
| [Outer Wilds — Mobius](https://www.mobiusdigitalgames.com/outer-wilds.html) | Questions motivate exploration; tools take photographs, test hazards, locate signals, and translate information. | Give the player a question and an instrument that reveals evidence before stating an answer. |
| [The Invincible — Starward](https://store.steampowered.com/app/731040/The_Invincible/) | Scientific exploration uses analogue tools and reporting to a remote colleague. | Make camera, brush, and transmission actions perceptible activities with observable results. |
| [FAR: Lone Sails — Okomotive](https://far-game.com/) | Keeping a vessel moving through obstacles and hazardous weather is central. | Build attachment through a familiar routine that changes as conditions deteriorate. Do not add a survival economy or a preventable mission failure. |
| [Journey — thatgamecompany](https://thatgamecompany.com/journey/) | A visible mountain destination, movement through a vast landscape, companionship, and music frame the passage. | Use a readable landmark and changes in presence and response to communicate direction and loss. Multiplayer is unnecessary here. |
| [Firewatch — Campo Santo](https://www.firewatchgame.com/about/) | A handheld radio is the player's human connection. | Establish a recognizable response from Earth as part of play, then let its absence carry meaning. |

These are principles to adapt, not evidence that every reference is text-free or
that their production budgets are needed. The relevant question is whether each
piece of information arrives when the player wants or needs it.

## Priorities

### 1. Make one scientific discovery genuinely inspectable

All three reviewers flagged this. `src/main.js:149` runs a one-second scan;
`src/ui/landscape.js:479` aims inspection at the rover. Then `src/main.js:117`
prints the scientific conclusion. The generic waypoint and decorative geology
are not a targeted instrument view of the claimed evidence.

Build one authored 3D outcrop at the actual Last Chance waypoint. Aim the
instrument at visible crossing layers; let the player inspect them, then offer
one short scientific interpretation. Use credited NASA close-ups as optional
instrument detail/reference, not as a substitute for the 3D game. At Berry Bowl,
a small before/after brush reveal could explain what was investigated; distinguish
an image from a mineral measurement and avoid invented numerical science data.

**Proposed success criterion:** four of five new players can identify the
relevant feature and explain the water inference without opening the journal.

### 2. Make contact with Earth a routine the player learns

Choices immediately call CHOOSE and TRANSMIT in `src/main.js:248`; the brief
choice-specific reply is overwritten before it can reliably be read. The same
scene response follows either choice. A button label such as “send the horizon”
does not actually frame or save that horizon.

Let the player frame one view, transmit it, and receive a consistent visible
receipt cue paired with sound. Preserve that view as a memory. Later, repeat the
same action under dust: the image becomes incomplete and the familiar receipt
never arrives. Keep fictional Earth dialogue labeled and communication timing
clearly compressed. The existing musical silence is useful support, not yet
proof of an effective emotional beat.

**Criterion:** muted players notice the missing response; players recognize
something they personally framed when it returns in remembrance.

### 3. Tell players what they can influence

`src/main.js:91` displays exact LIGHT/LINK percentages, but these are authored
scene values; driving does not spend them. The explanation is hidden in the
journal (`:134`). This risks suggesting that exploration or the wrong choice
could kill Opportunity.

Use qualitative mission conditions or a small “dramatized conditions” label,
with an unobtrusive “Take your time” onboarding cue. Make the fixed historical
outcome clear in the introduction/optional context without repeatedly spoiling
the dramatic moment. The storm may change a familiar action, but never create a
false rescue objective or blame the player.

**Criterion:** new players know whether exploration consumes power and understand
that memory choices express what they value rather than change history.

### 4. Reveal guidance when it becomes useful

The screen splits attention among title, waypoint, telemetry, interaction dock,
and controls. Small help text disappears below 850px; generic gamepads still
receive PlayStation prompts. Chapter titles can also answer the mystery before
arrival (“A river, remembered in stone”).

Teach driving, inspection, and sending one at a time with input-specific prompts.
Lead with a visual curiosity or short question; reveal the interpretive title
after discovery. Keep assistance available. Consolidate destination/distance and
current action; avoid shrinking important information to 8px to make it fit.

**Criterion:** a new keyboard, touch, or controller user completes the first
loop without opening Settings and can state what they are investigating.

### 5. Let the ending recall actions, not just authored labels

Several zero-signal scenes repeat the observe/choose/next structure. “Stay a
little longer” advances another caption. The journal can reveal the current
scientific answer before inspection and does not organize prior science as
clearly as prior poetic memories (`src/main.js:131`).

After one final attempt, allow an unhurried view and one voluntary remembrance
action. Recall a player-made image and earlier received signals. Keep a concise,
factual mission epilogue on the main path; put additional history in the journal.
Journal entries should unlock after observation and preserve a compact
“saw / measured / inferred” record with a NASA source.

**Criterion:** players can name the emotional turning point as an action or
absence, retrieve the water evidence easily, and finish without reading an essay.

## Recommended next work

Polish **one discovery and its later storm echo** before adding content: locate a
real target → inspect it → frame/send a memory → receive Earth's response → later
repeat that routine when the response fails. Test it with a few new players,
including sound-off and controller users. Keep the current real rover asset,
compact HUD, optional journal, accessibility settings, and historical guardrails.
Do not expand the map, add more prose, or start the deferred desktop/HD-haptics
edition to solve these information-design problems.

## Independent reviews

- [Learning and discovery](LEARN-03.md)
- [Emotion and nonverbal storytelling](EMOTION-03.md)
- [Interface, attention and accessibility](UX-03.md)

No gameplay code was changed or republished during this review.
