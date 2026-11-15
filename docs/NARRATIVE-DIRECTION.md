# Narrative direction — WRITE-16

Writers' room draft for the next implementation, based on the shipped v0.15.1
source. Three Sol writers reviewed voice, delivery and dramatic structure, then
challenged one another's proposals. The treatment is implemented in v0.16; verification scope is recorded in
VERIFICATION.md. Emotional impact still requires human playtesting.

## The change

Let the player become familiar with a curious working presence, then lose a
familiar response. Opportunity attends to the task in front of it; it does not
narrate its own memorial. The current script repeatedly explains a discovery
before work, after work and after sending. Remove that repetition rather than
merely shrinking every sentence.

Keep one unboxed inner voice. Navigation and tool instructions remain short,
explicit actions with controller glyphs; they must work without reading thoughts.
No extra dialogue menu, reading gate, speaker label or panel.

## Delivery

| Moment | Player experience and writing |
| --- | --- |
| Opening | Establish identity, ancient-water mission and Earth once, in separate short beats. First playable action: **Look through your cameras**. If the introduction is skipped, retain a brief purpose cue so the mission is still understandable. |
| First return | The familiar signal gains meaning through a modest reaction: **“They have my first view.”** No paragraph explaining companionship. |
| Last Chance | Arrival: **“Why do these layers cross?”** Silence during tracing. Completion: **“The upper layers cross the lower ones.”** On successful receipt, one interpretation: **“Those crossing layers are evidence that water once flowed here.”** |
| Berry Bowl | Arrival can be more personal: **“They call them blueberries. I have never seen the ones on Earth.”** Brush and measure in silence. Completion: **“The grains read differently from the brushed rock.”** Receipt connects the mission's hematite finding to evidence of ancient water, once. The simplified iron-bearing readout alone is not a mineral identification. |
| Years passing | One thought spans the eleven-year passage: **“Eleven years. Still another place to look.”** Let dates and changing light carry the rest. Do not force three substantial captions through seven seconds. |
| Ordinary afternoon | **“That bright edge of stone. I’ll send that.”** A successful return needs no thought. Avoid “while it is still here”: this day should not know what comes next. |
| Storm / recollection | Explain dust blocking the panels' sunlight once. Recall the player's actual first view once, without declaring that everything is already meaningful or safe. Keep visible targets and the next action clear. |
| Last transmission | **“I’ll send this view.”** No farewell or new thought during departure. The incomplete record and missing answer interrupt the established routine. |
| Earth / ending | Stop Opportunity's voice. State the new role and action plainly: **“EARTH — Contact with Opportunity has been lost.” / “Send a recovery command.”** Reverse the signal. Mark the recovery months and mission closure; finish with the records the player helped obtain. |

All quoted thoughts above are original fiction, not historical quotations.
Science and chronology remain governed by the existing source register.

## Delivery rules and implementation checks

- Physical observation before sending; qualified interpretation on the two
  geology receipts. This resolves the team's disagreement about hiding discovery
  meaning until Earth replies. Ordinary receipts need only acknowledgement.
- No new prose while operating tools, driving or squeezing triggers. Keep the
  completed observation available during preparation; departure clears it. Sound
  and visible signal feedback carry the exchange, including when muted.
- Keep essential geology inference player-paced on receipt. No forced dwell,
  queued stale thoughts or extra confirmation. Pause freezes reveal; restored
  progress must retain purpose and role without replaying a cinematic.
- Implementation honors `travelling` during observation. Silent reply/partial
  exchanges suppress fallback response prose, so Earth dialogue cannot return.
- Do not promise an archive of exact thoughts: the current journal holds science
  and memories. Optional replay would be a separate feature, not this treatment.
- Before shipping, check skipped intro, immediate sending, tool completion,
  skipped/reloaded Earth handover and muted recovery. Ask a fresh player what
  they are doing, why the comparison matters and whose signal is missing.

Reviews: [Voice](reviews/VOICE-16.md), [Delivery](reviews/DELIVERY-16.md),
[Story](reviews/STORY-16.md).
