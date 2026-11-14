# TIME-CRITIC-07 — elapsed time without padding

Review of `develop/v0.7`; source inspection, not emotional playtesting. Read AGENTS, README, PLAN, TASKS and CONTRIBUTING, then actual story, main scene/save flow, renderer and audio APIs. Only this review document is owned by this lane.

## Diagnosis

The story already contains fourteen years, but the player's activity supplies almost none of their grammar. Early 2004 science leads immediately into March 2015, then into 2018. Marathon and ordinary-day both use `sunset`; a compact date eyebrow changes while the same landscape and interaction continue. Thus dates describe adjacent errands rather than interrupting the present. More driving or another paragraph would extend minutes without conveying years.

## Preferred minimum

Add two brief authored temporal seams at the existing transitions into marathon and ordinary-day. Keep the close rover composition as the visual anchor; visibly leave one date and arrive at another. Reuse the familiar receive/home musical identity if audio is on. The first seam may repeat its short look/send/answer gesture to imply a routine that outlasted the original mission. The second should be shorter, returning us to the same learned rhythm in 2018. These are compressed fictional presentation, never reconstructed telemetry or simulations of every sol.

The date endpoints must communicate the elapsed interval with sound off. Use an existing heading/date area or one transient time treatment; a second persistent clock is unnecessary. The years advance because the narrative advances, never because the player waits, drives, pauses or explores. Do not add observations, choices, routes, journal entries or resource depletion.

Match the rover composition rather than a recognizable rock: keeping the same landmark would imply Opportunity remained at one real site throughout eleven years. A cut/dip and altered light suffice; accelerated celestial cycles, long orbits and sped-up driving are dispensable.

## Scrutiny of proposals

- **Story lane:** supports two seams and no errands. Challenged a persistent year/age counter because the existing sol/date eyebrow already serves that role, while ticking numbers suggest a simulated mission clock. Challenged two equal montages: eleven years needs greater weight than the later three-year seam.
- **Sensory lane:** supports returning close framing and retaining the current musical identity. Dust/matte changes are optional and secondary. They primarily suggest contamination or failure, and monotonic dust accumulation risks implying the eventual contact loss was inevitable rover decay. Do not sacrifice model fidelity or add material machinery to make this cue work.
- **Rejected:** mandatory repeated send loops, longer traversal, more historical paragraphs, fake intermediate factual dates, annual/daily tickers, visibly worsening driving controls, weakening receipts before the existing storm, invented mechanical damage and any player-dependent aging. These add duration, uncertainty or systems rather than clarifying elapsed years.

## Historical boundaries

Existing sourced endpoints are sol 48 in 2004, sol 3968 / March 24, 2015 (marathon), generic Perseverance Valley / 2018, and sol 5111 / June 10, 2018 (last contact). Keep the pre-storm ordinary day generic rather than assigning an invented activity to an exact date. Sources N1/N8 and the historical-conventions section of `docs/SOURCES.md` support these endpoints. Do not derive an exact landing anniversary by mixing local and UTC dates.

The fourteen-year rover lifetime ends in June 2018. Earth recovery continues to February 2019. A calendar cue must switch to Earth and must never imply a functioning rover waiting onboard during recovery. Replaying receipt sounds in an ellipsis is fictional routine, not a claim of uninterrupted daily communication.

## Integration acceptance

1. Trigger presentation only after successful authored NEXT into the two destination scenes. Preserve scene/choice IDs and save version. Saving destination first permits refresh/resume to restore directly without replaying a partial montage or recording artificial progress.
2. Presentation blocks driving, observe, choice and upload. Clear keyboard/controller/pointer holds on entry and exit; require fresh primary input afterward. A held NEXT must not also skip the seam or activate the destination. Skipping must restore one destination once.
3. Pause, hidden tab, controller loss and settings freeze the presentation clock and hush audio. Resume must not fast-forward elapsed wall time. Restart cancels RAF/timers and stale callbacks. Loading a saved scene bypasses seams.
4. Reduced motion retains a static, readable before/after date treatment and skip action; no accelerated lighting, orbit or strobing. Muted play conveys the full temporal fact. Keyboard, touch and controller can skip without trapping focus.
5. End state restores normal close camera, objective, waypoint, input context and narrative audio. No contact pulse, rumble, held upload or artificial memory may survive the seam.
6. Check both boundaries manually with sound off/reduced motion, skip, pause/resume, refresh, and held primary. Unit tests can prove lifecycle; human playtesting must establish whether the routine now feels remembered rather than merely labeled.

## Handoff

No runtime edits, external research, browser playtest or tests performed by this review lane. Early recommendations and proposal challenges were sent to the integrator and both proposing agents. Awaiting integrated treatment for final audit.

## Selected treatment refinement

Integrator selected seven seconds for 2004→2015 and three seconds for 2015→2018, with no Earth montage or new mechanics. This is cohesive with the critique. Seven seconds should contain an actual change of repeated familiar presentation rather than seven seconds holding a date; immediate skip bounds its pacing cost. Story-lane alternative of summarizing recovery through February before the final-call scene was rejected because it pre-empts chronology and diverts effort from the rover's long active life.

Additional runtime inspection identified stale waypoint arrivals as a risk: existing arrival handling guards `screen === 'game'`; passages should use a distinct screen/input context so late arrivals cannot render over them. Preserve the introduction's early controller action guard before journal/camera handling. A modal render or world-status refresh must likewise not overwrite the active passage.

## Final source audit of integrated treatment

Root integration now reviewed in `main.js`, `briefing.js`, `journey.css`, `content/time.js`, story edits and renderer finish. No blocking source defect found. Destination is saved before a passage; restore enters the destination directly. Distinct `passage` screen suppresses travel, inspection and late waypoint rendering. The single existing presentation RAF freezes on paused/hidden/not-ready state, and both restart and title cancel it. Resume retains the paused renderer during a passage. Renderer pause cancels any residual contact pulse. Static endpoint dates communicate the jump muted; reduced motion suppresses light cycling and retains the date/caption treatment. No scoring, resource depletion or new tasks were introduced.

Recommended small hardening: clear `pressed` and `padInput` on presentation entry/exit, preventing stale movement after automatic completion. Controller menu context rearming already protects held primary. Browser QA should specifically exercise native Space held across automatic completion, both seams with modal pause/resume, refresh mid-seam and reduced-motion setting changes.

The proposed finish shader has no source-level blocker: shared finite age uniform, world-normal upward mask, stable compilation key, reversible reset and late model load are coherent. Source review cannot establish shader compilation or whether its appearance reads as subtle accumulated time; root owns screenshot comparison and omission if it reads as damage.

Latest user-focus audit: existing `journey.css` places glyph-leading short action labels on the left and adapts them to interaction context. Existing close gameplay follow/contact framing remains intact; the new passages freeze that view. Opening now states identity, drive/look activity, ancient-water goal, sending to Earth and companionship in three concise beats. No additional legend or explanation is warranted by source inspection.

This lane performed source review only; no browser playtest or automated tests run. Emotional effectiveness and physical-device/control feel remain human playtest questions.

## Scoped camera fix verified

Browser QA by the integrator found restored received-phase scenes retaining rock inspection framing. Reviewed the fix: scene initialization now inspects only restored `choose`; other non-observe phases call `focusRover(true)`. Restored transmit then rebuilds its existing contact setup. Ordinary investigation and OBSERVE still explicitly inspect, preserving those flows. Passage entry explicitly calls `focusRover(true)` before pausing; that method clears inspection/contact framing before computing the close rover frame. Keyboard/controller movement clearing is now present at both passage entry and finish. No source concern found with these scoped changes.

Integrator reports clean browser logs, first-passage pause/reload restoring 2015, second-passage close framing, held-Space behavior, and 14 test files / 36 checks / build passing. These are integrator-provided results, not independently rerun by this review lane.
