# PLAY-11C — independent attempt and source risk review

## Scope and completion evidence

Requested: full updated-build playthrough from
`http://localhost:4173/tests/browser/controller.html?scene=first-morning&phase=observe`,
new isolated tab, manual driving, no public tab or physical controller output.

**Full playthrough NOT completed. No game scene was observed in this lane.**
The CUA inventory returned `{"apps":[],"browsers":[]}`. An explicit attempt to
create the isolated local fixture tab returned `Browser is not available: iab`.
The blocker was reported to root immediately. No alternative browser automation,
raw HTTP state manipulation, saved-state injection or source-generated completion
was used. Public tab 8 and physical hardware were untouched.

Completion markers: intro unobserved; first send unobserved; Last Chance
unobserved; Berry Bowl unobserved; manual traversal unobserved; five surveys
unobserved; signal travel unobserved; Earth handover unobserved; farewell
unobserved; ending/archive unobserved. Audio listening unperformed.

This document is therefore a **source risk review**, not another observed
playthrough. Root/A browser evidence must carry actual completion claims.

## Critical findings inferred from source

### 1. Survey repetition remains the largest experiential risk

Five later stops now use three relative camera bearings and a .6-second steady
hold per bearing. The profiles distinguish ground, horizon and dust-darkened sky;
the renderer uses actual gaze angles and fixes its eye above terrain. This is
more active than a timer, but each has the same match-point mechanic. The player
may learn to chase the amber point while ignoring what the landscape signifies.
The instructional captions help, but they do not make the world itself respond.

Recommendation: in the actual full play, ask whether each stop makes one distinct
thing visible, particularly ordinary light versus dust. If answers are mostly
"another amber point", refine composition/light or reduce repeated views before
adding any more mechanics. This is a design risk, not a witnessed failure.

### 2. Evidence close-up is deliberately a cutaway

During active geology inspection the rover is omitted from world rendering. This
solves foreground occlusion, but transition continuity needs a visual check: a
mast disappearing while still within view could feel like a rendering error.
The dedicated face/top framing should make that omission read as an evidence
close-up. Camera resets clear reveal progress; deliberate active orbit must occur
before stable-hold quality can pass. Merely watching the camera tween cannot pass.

Recommendation: verify both geology starts and exits, including pointer drag,
reduced motion, camera reset and a player who releases the stick after a small
pan. If the cutaway is visible as a pop, stage the frame before omitting the rover
or choose a camera that naturally excludes it. No visual pop was observed here.

### 3. Marker tolerances intentionally permit approximate views

Profiles accept each yaw/pitch within .16 radians (~9 degrees), with a .12-radian
move from the previous recorded view. This makes the mechanic forgiving and
prevents a stationary camera from recording consecutive overlapping views.
However, the final sky profile's initial requested yaw is only -.18, so the
player can satisfy it with a very small left movement within tolerance. That is
probably appropriate for accessibility; it should not be described as precisely
recording three surveyed geological bearings.

Recommendation: judge the feel of this generous capture, particularly when
controller input is small. Prefer clear positive confirmation over tighter
thresholds unless playtesting actually shows accidental captures.

### 4. Transmission outcomes remain semantically distinct in source

The new terminal draws Mars and Earth, a transit path and packet, and distinct
receipt text for reply, partial, silence and archive. Silence routes Earth toward
Mars and never draws the reply echo. Partial labels an incomplete frame rather
than a full success. Main requests `received` audio only for a real reply; the
sound layer independently blocks Earth-side received cues. These are good guards
against pretending an unanswered call succeeded.

Recommendation: actual play should confirm the packet reaches its destination
before outcome text changes and that the partial path does not visually imply a
fully delivered photograph. CSS/state inspection alone cannot establish timing
readability, contrast, Earth recognition or whether UI obscures the rover.

### 5. Score is structurally distinct; its quality is still unheard

The composition now has separate geology/glass, routine/felt and Earth/reed
material, altered storm timing/ending, explicit silence and a remembrance return
that combines identities. Foreground actions duck only the score bus. This is a
substantial compositional change in source, not an established good mix.

Risks to listen for: upper glass partials becoming sharp, low Earth reed getting
lost on small speakers, 7–25-second additional rests feeling like audio failure,
pressure ducking sounding like pumping, abrupt section resets feeling like cuts,
and the final motif arriving too late after a fast ending interaction. First
listen once through the game without stopping to inspect code, then compare with
sound off. Do not describe the score as emotionally effective until that happens.

## Check provenance and next action

No additional automated checks were run for this review-only task. Earlier
SOUND-11/VIEW-11 handoffs record the checks those implementation lanes actually
ran; none counts as browser completion or listening. Root should combine the
observed full playthrough from available browser lanes with these source risks,
and report the unavailable second independent playthrough explicitly.
