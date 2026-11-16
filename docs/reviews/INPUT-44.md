# INPUT-44 — controls and first-run review

The input runtime, experience and first-run audit were assigned to GPT-6.1 Sol
agents with disjoint ownership; root integrated and exercised the combined game.

Critical findings addressed:
- A connected idle controller must not replace keyboard guidance. Only meaningful
  activity claims input; drift, held values and focus baselines are ignored.
- Switching prompts by rerendering could swallow the first mouse click. Existing
  controls now update in place, preserving pointer capture and clicked targets.
- Camera aiming guidance disappeared with the exploration controls. A single
  context cue now gives arrows, drag or right-stick aiming alongside capture.
- Enter from the focused title canvas failed to begin. It now invokes the primary
  action while native buttons retain their own activation and intro cannot skip.
- Browser audio suspension could accidentally become a saved mute. Desired sound
  remains enabled and retries on a gesture; explicit mute is saved and respected.
- A duplicated drag instruction was removed. Arbitrary geology hints still retain
  their text and escaping; only the two known default instructions are condensed.

Browser checks passed: idle pad, pad/keyboard takeover, first mouse click, fresh
sound preference, mute reload, title Enter and intro protection. Native Enter
unlocked a running AudioContext. Native mouse traced both layers; keyboard Enter
compared, arrows aimed, Enter captured/sent, and EARTH RECEIVED was observed.
The Earth reduced-motion short-screen fixture passed three simulated-trigger calls.

No physical controller feel or fresh full emotional playthrough is claimed.
The first-run audit found no reason to add a tutorial panel or force additional
text onto the game. Remaining priorities are human pacing/feel review and further
source-informed terrain work, rather than more UI.
