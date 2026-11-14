# CONTROL-04 — controller-first clarity and participation

Reviewed the local `develop/v0.4` source on 2026-11-14 after reading the shared
instructions, README, plan, task board, and contribution guide. Scope: main input
routing, controller polling, presentation helpers, story, and styles. This is code
review, not browser or controller playtesting. The user's live game was untouched.
Only this review document changed; no commit or publication.

## Fix first

### 1. Separate traversal from selection

`src/main.js:377–381` permits driving in every game phase except active scan or
send. `onInput` at 449–451 always routes the left stick to drive and right stick
to camera when unpaused. Consequently, a player trying to move selection with
the left stick moves the rover during memory choice or receipt instead. D-pad
navigation exists, but analog menu navigation does not. During a modal, controller
polling suppresses analog input entirely (`src/input/controller.js:100–103`).

Fix: explicit modes—traverse, inspect, choose, send/listen, modal, ending. Route
left stick to driving only in traverse, to selection in choose/modal/ending,
and to no movement while waiting. Require neutral stick before accepting a
new mode's navigation; use a deadzone and repeat delay. Preserve D-pad support.
Stop residual velocity at transitions into interaction so a previously held stick
cannot carry the rover away from the authored inspection target.

Acceptance: hold forward through arrival, then choose; rover remains stationary.
Both left stick and D-pad can select either memory and all settings. A held stick
does not immediately skip the first choice when the mode changes.

### 2. Primary interaction currently chooses Autodrive by default

While travelling, the main button is Autodrive. With no focused control, primary
fallback includes `[data-action="assist"]` (`src/main.js:444`). Pressing the face
button advertised as “Interact” therefore starts autonomous travel, even though
the player has not explicitly selected assistance. Repeating that behavior can
delegate all six routes and leave only menu clicks as participation.

Fix: contextual primary at range (“Look closer”), and a short destination/distance
cue outside range. Keep Autodrive as an explicit optional action reached through
selection or settings; do not make it the default primary action. Name the next
task in the hint instead of the generic “Interact.” The first arrival should say
“Examine the layers,” followed by “Choose a memory,” then “Send home.”

Acceptance: pressing primary while travelling does not silently enable assistance;
the destination remains clear without opening a journal or reading instructions.

### 3. Looking closely is currently a passive delay

`scan()` (`src/main.js:208–220`) automatically reveals the scientific interpretation
after one second. No camera position, examined feature, or player observation
affects completion. `sendMemory()` adds another timed wait. The two strong
geological targets therefore do not yet change what the player actually does.
This is a design inference about engagement, not a measured playtest result.

Small mechanic recommended: on Last Chance and Berry Bowl only, enter a steady
inspection view. Right stick moves a reticle across the actual authored rock;
an outlined broad target highlights layers or grains. Show one instruction:
“Find the crossing lines” / “Look at the round grains.” A forgiving alignment
fills a short visible ring; primary confirms the observation. Reveal the existing
one-line discovery and choices afterward. No score, penalty, survival cost, or
failure state. Reduced motion keeps the same task with a static camera; keyboard,
touch, and an explicit assist provide equivalent completion. Pause/restart cancel
the task, and no held input should confirm the subsequent memory automatically.

Prefer this one active scan over adding antenna tuning simultaneously. If antenna
alignment is later added, teach it during early successful sends, show signal
feedback visually, and preserve authored partial/no-reply results regardless of
player skill. Never suggest more accurate tuning could save Opportunity.

## Additional concrete controller gap

Long journals and credits have no continuous controller scroll. D-pad only moves
between focusable elements (`src/main.js:422–438`); paused controller polling
stops analog input. In particular, the journal's final memory cards contain no
focusable controls, so their lower content cannot reliably be reached by a
controller once the last NASA link has been focused. Route right-stick Y to the
open dialog's scroll container while paused, without moving camera or selection.
The same approach can support the ending panel. Add a brief scroll glyph only
when the panel actually overflows.

## Keep

The explicit send/receipt phase, visible muted-compatible silence, optional
journal, chosen ending memories, cancellable waits, and family-specific glyphs
are useful foundations. The busy-primary guard now prevents repeated face-button
presses from opening Journal during a pending transmission. Add mechanics around
those phases without changing historical outcomes or expanding required prose.

## Second-audit targets

Verify mode routing and neutral gating; controller scroll; primary outside range;
scan cancellation on pause/disconnect/restart; muted and reduced-motion completion;
and preservation of authored no-reply results. Automated checks can establish
these behaviors. Physical controller feel and emotional engagement still need
human playtesting.

## PAD-04 implementation follow-up

Controller now exposes drive/menu/inspect modes. Menu stick navigation works while
paused, produces neutral continuous input, and gates held sticks after transitions,
blur and reconnect. Inspection preserves look without drive. Sixteen controller
tests passed, including repeat/hysteresis and ghost-input checks. Root still owns
mode selection and gameplay integration; the original findings above are not yet
claimed resolved end-to-end. Menu scrolling remains a separate unimplemented gap.

## Independent integration audit

Reviewed updated main flow, objective/mode helpers, investigation accumulator,
landscape sampling, and controller styles without opening a browser. Ran the
controller and investigation tests together: all 19 passed. These unit checks do
not cover main's DOM/lifecycle wiring.

Resolved in code: rover motion is limited to traversal, menu/inspection modes
are synchronized, focused controller actions have a persistent visible outline,
primary outside destination range gives a destination cue instead of silently
enabling Autodrive, and each phase exposes a concrete objective. The geological
investigation now samples actual camera-facing quality and steadiness; its oblique
starting view makes orbiting meaningful. Physical feel remains unverified.

Remaining actionable integration findings sent to the integrator:

1. Disconnect only clears driving. Pending investigation/scan/transmission keeps
   running, so a clear-view investigation can finish and a send can resolve while
   the controller is disconnected. Cancel/pause active interaction on a genuine
   connected-to-disconnected transition. Avoid treating initial absent hardware
   as an interruption for touch/keyboard players.
2. Same-mode menu transitions retain stick-repeat state. Opening settings from
   choices, or confirming a choice into transmit, calls `setInputMode('menu')`
   while already in menu mode. That call is intentionally a no-op, so a held stick
   continues navigating the newly rendered context. Add an explicit context-change
   rearm or context identifier, waiting for neutral in the new menu. Do not rearm
   on ordinary render refreshes. Test holding a stick through Options and through
   choice confirmation.
3. The integrator already identified the active-investigation primary guard:
   `scanning` blocks controller activation of the explicit Assist observation
   action. Permit that explicit assist while retaining busy-primary suppression
   for passive scan/send waits. Also keep the visible instruction about moving
   the **view** rather than moving the rover, which is intentionally frozen.

Long journal scrolling is still outside the mode contract: menu continuous input
is deliberately neutral, and D-pad focus jumps cannot expose all nonfocusable
memory cards. This remains a controller-only reading gap, rather than a blocker
for the core journey.

Added `controller.rearmMenu()` after this audit so the integrator can reset the
neutral gate on actual same-mode context changes. Its test holds the stick through
a paused menu change, verifies no navigation until release, and confirms ordinary
same-mode refresh preserves repeat. All 17 controller tests passed afterward.

Final saved-main code audit: the three integration findings above are now
addressed. Input context includes screen, scene, phase, modal and investigation;
only changes rearm the menu. A genuine disconnect enters settings through pause,
canceling active interaction. Focused Assist observation is explicitly allowed
through the busy-primary guard. Initial controller status callbacks are safe via
optional controller calls, with title render subsequently synchronizing menu mode.
No further critical defect found in this read-only audit. No browser/controller
playtest or main DOM lifecycle test was performed; long journal scrolling remains
the known controller-reading limitation.

## CONTACT-04 integration audit

Read the later contact aiming/main/controller integration without browser use.
Touch reports only update aim; inactive/cleanup reports do not send. Right stick,
arrows and canvas drag provide alternate aim input. The menu scroll callback now
routes to a dialog or ending/interaction panel, addressing the earlier reading
gap. Mode changes correctly select inspection during aiming and menu during the
receipt wait; historical results remain authored.

Actionable findings sent promptly to the integrator:

1. **Accidental send from focused Journal:** primary during contact unconditionally
   calls `sendMemory()`. A player can D-pad to Journal, see its focus/glyph, press
   primary, and send instead. Respect an explicitly focused enabled non-transmit
   action; contextual send is appropriate only for the send target or no selected
   menu action.
2. **Relative drag treated as persistent velocity:** canvas pointer deltas and USB
   touch deltas feed the same persistent velocity API as sticks. A dragged finger
   held stationary keeps aiming until release; USB can continue until another
   report or stale timeout. Consume relative displacement once, or reset relative
   velocity each frame. Keep velocity behavior for sticks/held arrows only.
3. **Stale pointer ownership:** `stopContact()` clears USB ownership but leaves
   `contactPointer`. Pause/title/restart during a drag can carry that stale owner
   into the next contact, suppressing right-stick fallback. Clear it and neutralize
   all contact input on interruption; release capture where appropriate.
4. **Contact camera reset is a no-op:** Triangle and the reset button call
   `setContact(true)` while active; landscape immediately returns in that case.
   Provide an explicit contact reset path or restart contact framing deliberately.

These are source-level findings, not observed physical controller behavior. No
new test or browser run was needed for this audit; USB decoding and lifecycle
unit checks had already passed all 20 controller tests in TOUCH-04.

Saved-fix recheck: all four CONTACT findings above are addressed in source.
Primary respects focused non-send actions; stop clears both input owners; relative
pointer/touch input uses bounded angular nudges that clear velocity; active contact
setup now resets instead of returning early. No further critical defect found.
One minor gating edge remains worth tightening: reset updates rendered alignment
immediately while main's alignment quality is sampled about every 95 ms. An
immediate reset-then-primary can briefly use pre-reset quality. Clear cached
quality/disable Send on reset, or force an immediate renderer sample. This is
source inspection only; no browser or hardware behavior was claimed verified.
