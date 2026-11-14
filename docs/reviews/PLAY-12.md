# PLAY-12 — revised-version review status

2026-11-14. Assigned independent full v0.12 playthrough. Browser access check returned `apps: [], browsers: []`; explicitly selecting the previously working browser `2` returned “Browser is not available.” No v0.12 play was independently witnessed in this agent context. The earlier PLAY-11A full baseline and targeted v0.11 geology checks must not be represented as v0.12 verification.

The integrator is conducting a full revised UI playthrough and will supply its recorded events/screenshots for critique here. Review of those artifacts will be labeled **recorded-run review**, not independent interaction. No public player tab or physical controller was operated.

Initial source-only review of `geology-tool.js`: swept dust coverage and two distinct samples create a tangible operation before interpretation. The qualitative layer/iron comparisons avoid presenting numerical invented telemetry. During actual play, check whether 56% coverage across the whole square matches the visibly dusty region; whether release after brushing is evident; whether unread rings remain legible; and whether sampling explicitly tells the player to stop moving (the engine requires stick magnitude below .18 for a .7-second dwell). These are test questions, not observed defects.

## Recorded-run review — first four travel legs

Reviewed integrator-provided `work/play12/full-run.txt` through the valley survey / dust-route start, plus `01-sending.jpg`, `02-tool-ready.jpg`, and `03-berry-comparison.jpg`. The record identifies a fresh restart and continuous route; four manual travel legs, genuine swept brushing and two separately acquired samples at each geological site, explicit comparison, analog sending, a pause during partial Berry brushing, and reduced-motion transmission. These are recorded observations, not my independent interaction. The sound toggle was enabled in the record; screenshots/AX text do not establish how the music actually sounded.

The new causal chain is substantially stronger: tool deployment exposes a dusty work area; brush progress changes; unread rings become separate readings; compare produces the science and uplink. The held-trigger transition did not accidentally transmit. The Berry comparison screenshot presents lower bedrock/higher grain signal together, on the rock, with a clear next action. This directly addresses the previous version's biggest failure: knowledge appearing after an arbitrary camera angle.

The outgoing-signal screenshot now has identifiable Mars/Earth endpoints, a bright travelling packet, and separate call/reply indicators. This is clearer than the old abstract brackets. The partial route record shows rover-relative steering hints and actual arrivals; the new surveys have distinct successive bearings, rather than a timed scan dressed as observation.

### Remaining concrete concerns

- **P2: use one progress scale for brushing.** The record shows “36% cleared” while the Dust cleared progress value is .6386. Source confirms the bar is coverage / .56 while the label is raw coverage. Sampling therefore starts around “56% cleared.” Present a named target (“36% of patch; 56% needed”) or normalize both consistently; acknowledge “enough exposed” at the transition. The screenshot's remaining orange dust is otherwise liable to look unfinished.
- **P2: name the stillness requirement during sample acquisition.** Source requires stick magnitude below .18 for a .7-second dwell, but the displayed instruction is only “Hold R2 to read …”. Tell players “Stop moving, hold R2” or make unstable contact visibly interrupt the probe reading. The recorded operator succeeded, so this is an instructional weakness, not a witnessed blocker.
- **P2: strengthen the physical tool representation.** The tool-ready image reads primarily as a small circular reticle over a dusty rectangle. Show a brief arm deployment/contact or a clearer brush/probe head so “operate an instrument” remains a physical action rather than painting away an overlay.
- **P3: keep an actual result in the memory.** The comparison looks valuable; retain a small image of that cleaned patch and the two readings in the sent record/ending. A prose title alone weakens the connection between the new work and its preservation.

Final record reviewed below; the independent-interaction limitation still applies.

Review follow-up: source now labels both brush number and bar “Brush progress” using the same normalized value. This resolves the inconsistent-scale concern above; the earlier recorded screen documents why it was raised. No separate browser retest of that wording was available to this reviewer.


## Completed recorded route and final verdict

The completed log now reaches **You were here** and opens **11 discoveries / 11 memories**. It records all six manual drives, both brush/sample/compare operations, all five later surveys (including personalized ground recall), the final partial image, explicit Earth handover, recovery call, Earth archive, and final no-reply call. No tools/surveys were skipped; passage Continue controls were used. Reviewed final `04-partial.jpg` and `05-earth-call.jpg`: the missing reply has empty answer bars, and the Earth call visibly reverses endpoint order/direction. No console warning/error was reported by the operator; this reviewer did not independently inspect console output. The transcript contains no reliable wall-clock duration, so no player-duration claim is made.

This recorded run supports a complete revised-version progression pass. It does **not** establish independent full-playthrough testing by this reviewer, physical controller feel, musical quality, emotional impact, or a measured 10–15 minute runtime. Sound-on UI state is not listening evidence. Root is separately checking the final wording changes; the continuous run predates those copy-only fixes.

The version has moved beyond selecting descriptions: actual swept coverage, two acquired readings, and deliberate comparison make the geological memories earned. Varied multi-bearing surveys and directional travel keep the player acting through the storm. There is no recorded progression blocker. The highest-value remaining work is presentation depth, not more menus:

1. **P2 — Show an actual incomplete image.** The partial screenshot shows a dotted route and “INCOMPLETE FRAME,” but no image content missing its lower portion/tiles. Reuse the selected world view and visibly lose pieces on arrival; the loss then belongs to something the player recognizes.
2. **P2 — Preserve the physical results in the ending.** The archive still consists of prose titles and sentences. Carry the brushed patch, paired readings, and remembered first view into visual archive cards. The new tool work deserves to survive as a recognizable artifact.
3. **P2 — Strengthen instrument embodiment.** The brush/probe cursor operates correctly, but a brief arm/contact movement would make the deployment and material interaction feel less like clearing a rectangular overlay.
4. **P3 — Give Earth its own instrument foreground.** The reversed signal direction clearly establishes role. The Mars backdrop nevertheless persists; a receiver/channel panel or remote-view frame would distinguish operating from Earth without requiring extra exposition.

Follow-up source verification confirms the stillness hint now says “Stop moving, then hold R2 …”; along with the normalized brush readout, the two clarity defects raised during this review have been addressed in source. Neither should be reported as an unresolved final-build defect.

Only this report was changed. No game code or shared task board was edited.
