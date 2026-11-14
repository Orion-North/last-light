# TOOLS-13 — distinct geological actions

Owned files: `src/engine/geology-tool.js`, `src/ui/landscape.js`, `tests/engine/geology-tool.test.js`, this handoff.

Last Chance now traces two opposite-dip layer paths instead of repeating Berry Bowl's brush/read loop. Holding R2 near a dotted guide fills unique spatial bins along that path. A stationary probe cannot finish it. Each of the two distinct paths requires 32 of 40 bins; completing the first requires a real trigger release before the second can record. Both paths become qualitative direction observations, then Cross explicitly compares them. The probe can move without pressure after the release gate arms. Gold and blue guide dots conform to the actual rock face, become green as visited, and turn fully green when recorded. There is no dust patch or pair of stationary sample rings at Last Chance.

Berry Bowl keeps brushing, two distinct steady readings, and explicit comparison. Entry and pause safety gates still require an actual neutral sample (`actualSample !== false`); synthetic mode-change neutral cannot arm a carried trigger. Pointer steadiness and controller steadiness both remain checked.

Snapshot/event contract adds `mode: 'trace'|'brush'` and `paths: [{id,label,x,y,reading,points:[{x,y,visited}],progress,complete}]`. Last Chance `stage:'trace'` precedes compare/complete. Existing API, targets, samples, coverage, progress, hint, operating, toolMotion and cursor remain. Trace progress is the mean of both paths' completion fractions. Compare/complete hints take priority over the release gate. Initial guides use normalized lower center y=.79 and upper center y=-.05, with opposite slopes, within reachable local geometry bounds.

Checks actually run: all 9 tool behavior tests pass; repository check passes 43 JavaScript syntax checks and 12 scene contracts. Tests cover idle saturation, off-path motion, unique paths, real release between paths, explicit comparison, safe paused coverage, synthetic-neutral refusal, and Berry Bowl steadiness/readings. Browser visual/controller verification of the new tracing interaction remains for root; no full updated playthrough or publication is claimed here.
