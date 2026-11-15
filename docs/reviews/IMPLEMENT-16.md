# IMPLEMENT-16 — integrated narrative source review

Reviewed the integrated changes to `main.js`, `terminal-story.js`, `story.js`, `time.js`, `briefing.js`, `upload-terminal.js`, and the new narrative tests against WRITE-16. Source review only; no browser playthrough or emotional verdict. No runtime files edited.

**No blocking source findings.** The implementation follows the agreed causal division: Last Chance completion names crossing layers; Berry Bowl completion names a difference between grains and brushed rock. Ancient-water interpretation appears only in their received thoughts. The iron-bearing comparison is not itself presented as proof of hematite. The old early discovery announcement has been removed from the OBSERVE accessibility path.

The skipped-introduction path retains Opportunity, the ancient-water mission and Earth in the first playable thought. Both pointer and controller skip paths leave `purposeKnown` false; natural completion marks it true. Its false initial value also preserves that cue when restoring the first observation. Travel silence is correctly restricted to observe, so a restored ready/received phase does not lose its result or interpretation through an absent arrival flag.

Premature mourning is removed from the mandatory voice. The ordinary afternoon attends to a bright edge; recollection names the player's actual first view without declaring that the storm cannot take it away. The final prepared line is “I’ll send this view.” Departure suppresses thoughts, partial receipt is wordless, and all post-contact scenes suppress rover speech.

The renderer now treats absent reply-mode speech as authored silence, rather than exposing the old imagined Earth response. Ordinary successful receipts retain their operational status. Partial receipt retains its status without adding a final sentence. Operational recovery/archive prose remains outside the rover voice.

The Earth passage states contact loss and the new role. Crucially, its destination also carries persistent “You are now on Earth” text and “Send a recovery command from Earth,” so skipping or restoring past the passage preserves orientation. Dates separate June contact loss, the recovery interval, February 12 final commands and February 13 mission closure.

Validation performed here: inspected the new narrative tests and integrated call sites; `git diff --check` passed at review time. I did not execute runtime tests. Human verification still needs skipped intro, immediate sending, restored first observation/received states, muted contact loss and skipped Earth handover. In particular, reading and operating the physical comparison must feel connected in play; source correctness cannot establish that experience.
