# MOTION-14 — keep landscape animations enabled

- Agent / owner: Sol landscape lane.
- Branch / worktree: shared `develop/v0.14.1`; disjoint file ownership.
- Allowed paths: `src/ui/landscape.js`, this handoff.
- Acceptance criteria: remove OS and API reduced-motion suppression; preserve explicit immediate camera paths, pause/visibility behavior and gameplay.
- Changes and rationale: removed the media-query read, reduced flag and `setReducedMotion` method (including the fallback API). Normal camera tweens, contact packet travel, guide pulse, terrain tracks, dust movement, palette blending and intro camera movement now run regardless of OS motion preference. Explicit immediate frames and the deliberate Earth handover cut remain; animation updates still require an unpaused visible document.
- Files changed: `src/ui/landscape.js`, `docs/handoffs/MOTION-14.md`.
- Interface/dependency changes: `setReducedMotion` removed; root owns removal of callers. No dependencies added.
- Checks actually run and results: pinned Node `--check src/ui/landscape.js` passed; scoped `git diff --check` passed; source search confirms no reduced-motion identifiers remain in landscape. Read-only integration search of `src` and `index.html` found only the unrelated historical phrase “reduced sunlight” at the time of review.
- Unrun checks / blockers: no browser or physical controller checks, per assigned scope; root owns full integration/build checks. An initial integration search also named a nonexistent root `styles.css`, then was repeated on existing paths.
- Commit(s): none.
- Next action for integrator: run combined source/build/test checks and review the settings/caller/CSS removal.
