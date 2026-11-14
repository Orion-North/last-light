# PRESENTATION-08 — trigger contact instrument

Owned paths: `src/ui/upload-terminal.js`, `src/ui/upload-terminal.css`,
`tests/engine/upload-terminal.test.js`, this handoff. No commit.

Replaced the swipe packet/dish with two individually pressure-driven arcs. The
selected memory sits between them; pressure brings both sides into contact and
commitment concentrates its light. Sending compresses the memory to a focal point
and releases a signal toward the labeled destination. Archive keeps the action
local. Recovery calls retain CALL / OPPORTUNITY / NO REPLY and never promise a
response. Partial receipts remain explicitly partial.

Integration: existing render arguments and `.upload-terminal`,
`.upload-terminal__body`, `#upload-progress`, transmit and next selectors remain.
Optional `input` defaults to `pointer`; actual controller use sets `controller`.
Every ready mode exposes `#squeeze-hint` and commitment progress. Root owns hint
updates, release-to-arm, the 0.35-second commitment, actual pressure values via
`--squeeze-left` / `--squeeze-right`, progress via `--upload-progress`, and optional
`data-squeeze` release / ready / pressing / latched. The initial controller hint
is “Release both triggers”; generic left/right ornament avoids assuming a
controller brand. Pointer/touch/keyboard retain one action button.

CSS stays transparent over the world, uses vector paths and no assets, includes
short-landscape and 601–900px portrait composition, and disables decorative
animation/transitions for both reduced-motion mechanisms.

Checks run with bundled Node: `node tests/engine/upload-terminal.test.js` — four
behavior checks passed (input alternatives, ready pressure contract, truthful
receipts, escaped content/stable containers). `git diff --check` on owned source
and tests passed. Browser visual checks and hardware feel were not performed in
this lane; integrator should verify 820×1180 portrait and 1280×720 / short
landscape against the live scene and root pressure integration.

Final polish: the memory title appears once, in h2; the core keeps only its
MEMORY/CALL marker and focal light. Ready-stage instructions appear only in
`squeeze-hint`; the passed prompt remains visible during sending for narrative
waiting text, and footers describe destination/status. Progress labels now read
Send / Call / Archive commitment. The same four tests pass again, plus owned
source/test whitespace checks.

Transform reasoning check (source-only): left translation is -24px at zero and
+34px at full pressure; right is +24px at zero and -34px at full pressure. Thus
both move 58px inward, not outward. At the centerline the inner arcs move from
x=41/279 toward x=99/221; their upper/lower tips approach and overlap around the
focal axis, enclosing the memory. Browser rendering remains integrator-owned.
