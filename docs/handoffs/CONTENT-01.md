# CONTENT-01 — first playable narrative

- Agent / owner: story subagent.
- Branch / worktree / base commit: shared checkout, disjoint file ownership;
  assignment base `27a5b38`. No commit made.
- Allowed paths: `src/content/story.js`, `docs/SOURCES.md`, this handoff.
- Acceptance criteria: 10–12 contract-compatible scenes, coherent three-act
  emotional arc, source-backed science, distinct memory choices, historical ending.
- Changes: twelve scenes, eleven interactive; warmth and discovery → a thinning
  world → Earth recovery and remembrance. Each interactive scene has two choices,
  two distinct replies and archive entries. Final epilogue is `end: true`.
- Files changed: the three allowed files above.
- Interface/dependency changes: none. Exact documented content exports `scenes`,
  `sources`, `credits`; no runtime imports or network dependency.
- Checks run: Node imported the module and validated scene IDs, required fields,
  act/environment values, source references, choice counts, and a unique final
  ending. Passed. `git diff --check` passed for content and source notes.
- Narrative volume: about 2,389–2,425 words per choice path including observation
  notes, choice text, and later archive entries. Roughly 12 minutes at 200 wpm;
  actual playtime depends on reading/interaction and remains to be playtested.
- Science: Last Chance imaging and sediment layers (N6); Berry Bowl brushing,
  spectrometer comparison, and hematite (N7). N5 provides instrument context.
- Historical distinction: June 10, 2018 last contact; February 12, 2019 final
  recovery commands; February 13, 2019 mission declaration. No fabricated telemetry.
- Unrun checks / limitations: no browser playtest or rendered text-layout check;
  no claim to reproduce real mission dialogue. The final-image illustration must
  remain labeled dramatized unless the original NASA image is later substituted.
- Next action: integrate and playtest pacing. After `last-image`, all transmissions
  are Earth-side narration/calls with no rover answer. Do not label those panels as
  successfully received rover messages. Use credits text to disclose dramatization.
