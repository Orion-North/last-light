# Last Light — short project plan

**Current platform scope (November 14, 2026): web only.** A desktop browser with
a controller is the primary target. The Windows/Electron edition and its build
workflow are removed; earlier native-edition milestones below are historical.
Browser Gamepad rumble and optional USB WebHID trigger effects remain supported.

**v0.19 focus:** controller scrolling and disconnect recovery, readable short-screen
receipts, clearer Earth recovery actions, and a visible consequence for the archive
choice. The cinematic score and centered sending instrument remain intact.

**Pitch:** You are Opportunity. Every day you wake, look, investigate, and send
something home. As a dust storm erases the sunlight, familiar routines become
harder to complete. The final silence hurts because the player remembers what
those routines meant.

**Audience and fit:** Aim for ages 12+ and casual players. The challenge asks for
engaging education about retired space hardware and its science. Use intimate,
psychological sadness, loneliness, and attachment; keep the story age-appropriate.
Opportunity is explicitly listed in the official resources.

## A 10–15 minute experience

1. **Routine / wonder (3–4 minutes):** Learn one simple observe → choose → transmit
   interaction. Use the camera and a rock investigation to reveal evidence of
   ancient water. Let the player build an attachment to sending discoveries home.
2. **The storm (4–6 minutes):** Reuse the interaction as available power dwindles.
   Choose which discoveries to revisit and preserve in the story's final archive.
   Changes in sound, scenery, and repetition create unease; controls remain clear.
3. **Silence / remembrance (2–3 minutes):** Contact ends. An Earth-side epilogue
   reveals the continued recovery attempts and celebrates the rover's discoveries.
   The archive reflects player choices; the historical outcome stays the same.

The player cannot cause or prevent the mission's end. Power and internal thoughts
are clearly dramatized, not a faithful telemetry simulation. Emotional weight
comes from care and accumulated memories, with a closing note of gratitude.

## Hackathon scope

Three acts in a compact real-time 3D Mars environment, with short drives to
observations, one recurring discovery loop, and one personalized ending.
Web link, phone and desktop, touch and keyboard, readable text, mute, captions,
pause/restart. Use AI extensively for code, story iteration, art,
sound production where tools permit, and review. Use NASA’s textured rover model; target under 20 MB for this first 3D version.
Keep the playable story short; use the speed gain for richer atmosphere and polish.
Physical terrain, cinematic lighting, dust, and an original adaptive score belong
in the intended experience. Brief voice work or more elaborate visuals can follow a complete draft.
Accounts, backend, live AI calls, open-world traversal, and a branching campaign
remain outside the baseline.

## Accelerated build once development is requested

- **First 30 minutes:** Codex establishes minimal contracts and tooling while a
  subagent develops the sourced beats. Neither waits for the other's final output.
- **30 minutes–2 hours:** Parallel runtime, narrative, and visual work using shared
  sample data; Codex integrates small increments. Start with Codex plus subagents;
  Claude and Antigravity can take over lanes when added.
- **Hours 2–4:** Target a complete playable three-act draft. Add sound as a lane
  frees up; check phone interaction and the ending immediately.
- **Hours 4–8:** Iterate on emotional impact, generated assets, sound, and pacing;
  run factual, accessibility, and browser reviews alongside fixes.
- **Hours 8–12:** Target a polished submission build, credits, deployment, and demo.

These are working targets, not guarantees. Re-estimate after the first integrated
draft; tool access, asset generation, and playtesting may take longer. Merge and
review continuously. If time slips, reduce extra effects before sacrificing the
ending, science, or accessibility.

**Current direction:** implementation authorized. Build and verify the first
playable with parallel agents, real 3D assets, and a dedicated soundtrack designer.

## Current development pass — v0.3

No photography system. Improve the existing short journey through three changes:

1. **Look closely:** inspect authored 3D layers at Last Chance and grains at
   Berry Bowl. A short question comes before the scientific interpretation.
2. **Send, then listen:** choose a memory, deliberately send it, and learn a
   consistent visible/audio receipt. Later the same routine meets silence.
3. **Remember:** unlock discoveries after inspection, recall chosen memories in
   the ending, and use qualitative conditions with a “take your time” cue.

Keep text brief and details optional. Test the complete journey muted, with
reduced motion, and at phone size. Human playtesting must establish whether the
emotional beat works; automated checks cannot establish that.

## Previous v0.2 experience revision

The 3D world is the main view. Driving leads to a brief scan and a compact choice
that sends a memory immediately. One-line internal dialogue replaces mandatory
paragraphs; history and the complete archive are optional journal entries.
DualSense input, terrain-sensitive browser rumble, and opt-in experimental USB
adaptive resistance are included. Full native HD haptics and a desktop edition
are deferred until the game is finished, per the user's instruction.

## Controller-first v0.4 draft

Drive to a named landmark → move the view to reveal a real rock feature → hold
steady to record it → choose a memory → send and listen. One objective stays visible.
Left stick drives during travel and selects in menus; right stick investigates.
Optional observation/driving assistance keeps the journey accessible. Two geological
investigations replace automatic scans; later remembrance remains deliberate and brief.
Scanned dry surfaces, clearer landmark geometry, and a dust-layered Mars sky improve
place and mood. Every implementation pass gets a separate agent review and fixes;
playtesting must still establish enjoyment and emotion. Native desktop remains deferred.

## Terminal upload — v0.5

Choose a memory, then swipe it upward in a central terminal and wait for Earth’s
receipt. The optional USB DualSense touchpad performs the gesture; standard
controllers hold the right stick upward or press the bottom face button. Screen
drag and an Upload button keep iPad and keyboard play complete. The panel holds
one memory title, one instruction, and a short response. Later silence and the
archive have distinct call/keep actions, preserving the historical outcome.
Short thoughts remain centered captions outside the terminal.

## Authored presentation — v0.6

A twelve-second skippable camera introduction establishes identity, geology and the
send-home purpose. It previews the outcrop, then returns to the first camera action;
saved sessions bypass it. The upload uses an open antenna diagram with visible
origin/destination and a moving memory, keeping the landscape visible. Journey
steps change with the current role; arrivals and investigations use explicit verbs.

Last Chance has curved, chipped lamination and scanned microdetail. Berry Bowl
has an actual depression and varied embedded/loose grains; merged/instanced
geometry keeps these hero objects to eight draw calls. The reconstructions remain
artistic teaching assets, not surveyed geometry. Manual speed rises from .85 to
1.15 world units/s, assisted from 1.2 to 1.45; braking and steering stay controlled.
Design research and independent critique: reviews/DESIGN-06.md.

## Mission time — v0.7

Keep the short playable route. Two skippable matched-camera passages mark the
eleven-year and three-year jumps; soft changes in light repeat over the same
rover, with no camera sweep. The existing date caption names mission age, the
rover acquires a subtle matte finish, and the familiar wake/look/send routine
returns in later lines. Earth’s eight-month recovery remains in its existing
scene. No extra errands, timers or historical branches. Reduced motion removes
the light cycles. A saved destination resumes directly without replaying a passage.

## Tactile send and Windows preview — v0.8

Sending now uses a fresh two-trigger squeeze, pressure-driven arcs, two restrained
feedback detents, and the existing pressure audio layer. A brief full-pressure
settle commits once; early release is harmless. Standard button fallback remains.
Adaptive resistance is optional original-DualSense USB output; iPad uses ordinary
controller APIs. The controller cursor is hidden, with mouse interaction retained.
Scene meaning and the current objective move into a central typographic composition;
optional telemetry remains peripheral. Windows desktop is now explicitly requested:
an isolated Electron shell bundles the game and provides a portable test build.
Native HD haptic audio remains outside this release.


## Current target — v0.10

Desktop browser and Windows with a controller. The user withdrew iPad targeting;
existing touch/keyboard fallback stays, but graphics and verification prioritize
desktop. Immediate stronger independent trigger vibration, concrete choice
meanings and first-view previews, an explicit Earth perspective handover, and
more grounded lighting/shadows address the latest playtest feedback.


## Current target — v0.11

Manual rover travel only. Replace nine text selections with records produced by
observing the world. Two geological close-ups and five varied mast observations
lead to the established squeeze/release rhythm. The storm recalls the actual
first selected view. Mars/Earth signal travel, partial arrival, reversed recovery
calls and missing receipts communicate the story through feedback. Compose
distinct adaptive musical sections; preserve quiet and accessibility.

Full baseline critique: PLAY-11A completed the browser journey (assisted baseline
route, muted); PLAY-11B/C lacked browser access and are source reviews only.
The new build gets targeted browser checks; neither automated paths nor review
prose establish that it is enjoyable or emotionally successful.


## Current target — v0.12

Make the geology tangible: brush actual dust from the surface, move the probe to
two distinct zones, hold steady for qualitative readings, then compare them.
Keep the rock visible and the readings side by side; no extra choice menu.
Sending animates packets between Mars and Earth and teaches a four-note call and
answer. Later calls preserve the expected answer interval but leave it silent.
Manual travel, fixed history, optional sound and reduced-motion alternatives stay.


## Current target — v0.13

Controller sends require a real two-trigger charge/release; Cross continues after
receipt but never bypasses sending. A central three-step cue and larger trigger
glyphs explain the action. Last Chance traces two opposing layer paths; Berry
Bowl brushes and measures two surfaces. Tool UI keeps one instruction hierarchy.
USB trigger vibration starts at maximum supported amplitude, with stronger
sustained charged resistance; pressure thresholds stay accessible and unchanged.


## Current target — v0.15

Opportunity-only inner voice in a bottom terminal; no multi-speaker log. Brief
first-person thoughts connect observation, discovery, sending and attachment.
A quick text reveal and quiet mechanical articulation never delay controls.
Remove competing top story headings and duplicate captions. At contact loss the
voice falls silent; the explicit Earth handover, reversed signal and operational
receipts carry the recovery ending. Science details stay in the journal.
