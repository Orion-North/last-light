# TOOLS-12 — hands-on geology review

2026-11-14. CRITIC-12. Review of the proposed v0.12 interaction and later integrated source, with UI verification status stated explicitly below.

## Pre-implementation recommendations

The proposed brush → two samples → compare sequence gives discovery a causal action, provided each stage leaves visible evidence. Brushing must reward coverage of new surface, not elapsed holding or repeated rubbing at one point. Dust should disappear under the reticle, and exposed coverage should explain readiness. The player should be able to inspect the result before the game names its interpretation.

The two sample zones need distinct visible materials, explicit collected states, and qualitative readings shown together at comparison. A comparison command before both samples should explain the missing sample. Let right stick position a persistent tool reticle and R2 apply the tool; release-safe stage transitions prevent a held trigger from unintentionally collecting the next sample. Cross should perform comparison only when the evidence is ready.

A transmission should visibly travel Mars → Earth, arrive, and return as a distinct acknowledgment. Recovery reverses the outbound direction and then leaves the same established return interval empty. Use a short, recognizable musical question and a response at a consistent point early in the story, then preserve that expected response space later. Maintain a visible equivalent of these changes for muted play.

## Verification status

**No v0.12 UI playthrough completed.** Before the integrated build was ready, `cua.getState()` returned no apps or browsers. The explicitly assigned browser ID `2` also returned “Browser is not available: 2.” Reported this blocker immediately to the integrator. No old-build playthrough, scene seeding, skipped observation, controller output, or alternative automation was used as a substitute. The requested fresh introduction → six manual drives → ending/archive run remains pending browser access and a ready build.

## Integrated v0.12 source review

Inspected `src/main.js`, `src/ui/geology-panel.js`, `src/ui/landscape.js`, `src/engine/geology-tool.js`, transmission-panel code, and audio signal scheduling after integration. This is an independent **source review**, not independent UI or listening verification.

The tool now clears actual spatial cells; stationary rubbing cannot satisfy the 56% coverage threshold. Two distinct unread targets produce authored readings, both are required before a deliberate comparison, and collected rings change state. The panel presents the readings together and calls the comparison simplified rather than telemetry. Brush-to-probe transition requires an observed release. Pause, blur, pointer cancellation and tool exit stop input; partial sample dwell is discarded. These address the central baseline critique in implementation.

The send panel has separate Mars/Earth bodies, outbound packets, return echo, incomplete-frame/no-return outcomes, and visible call/reply phrases. Audio begins a fixed question and answers normal early transmissions, while call/partial completion preserves an answer window without playing its answer. Cancellation clears the pending musical state. Source inspection cannot establish whether these animations and melodies are readable or emotionally effective in real play.

One remaining **P2 consistency issue**: controller sampling requires low stick movement while pointer sampling always supplies zero motion, so dragging within a sample ring can continue acquisition without the steadiness constraint. Consider measuring actual cursor displacement per update and using it for both input methods. This is not an identified completion blocker.

Attempted the geology and music test command, but this review shell has no `node` executable in PATH; it returned `node: command not found`, so no test pass is claimed here. Integrator checks and the integrator's full UI run are separate evidence. No implementation files changed.

## Final automated verification and follow-up

With the integrator-provided explicit Node runtime, the complete `tests/engine/*.test.js` aggregate passed all **17 test files**. Direct geology execution passed **7 tests**, including synthetic-neutral rejection at entry/pause and pointer steadiness; direct music execution passed **17 tests**, including the learned question with an empty expected answer, interrupted partial question, and lifecycle cancellation. `scripts/check.mjs` passed **43 JS syntax checks / 12 scene contracts / entry assets / NASA GLB and license checks**. `scripts/build.mjs` completed successfully and wrote `dist/` (landscape 1.86 MB).

The earlier pointer steadiness P2 has now been addressed: sample acquisition checks actual cursor displacement in addition to stick motion, with a regression that wiggles within one ring and then settles. The release trust gate now rejects `actualSample:false` neutral updates; main input preserves actual-sample provenance, while explicit keyboard/pointer events can arm their own input. Pause stops the tool and clears dwell. These fixes resolve the two concrete source-level concerns reviewed here. No remaining publication blocker was found in this source/check pass. The fresh full UI journey is being performed separately by the integrator; this report does not claim that journey as my own.
