# Shared agent instructions

## Scope and authority

- Current phase: first playable implementation, explicitly authorized by the user.
  Build the complete three-act experience with parallel subagents and verify it.
  Codex owns integration and publication; use the existing repository.
- Read `README.md`, `docs/PLAN.md`, `docs/TASKS.md`, and `CONTRIBUTING.md` first.
- These instructions are shared by Codex, Claude, Antigravity, and subagents.
  Keep tool entry files as pointers instead of copying policy into them.
- User instructions take precedence over project conventions.

## Collaboration

- Codex is the initial integrator. Delegate bounded tasks to subagents when useful;
  do not launch other external AI tools unless the user assigns them work.
- User preference: use GPT-6.1 Sol for future subagents where available. Reserve
  Astra for tasks that materially need its stronger reasoning. Supply a bounded
  task brief when the orchestration API requires a fresh context for model choice.
- Development is AI-intensive: parallelize independent implementation, narrative,
  asset, and review tasks within available agent slots. Use a minimal shared
  contract and sample data to avoid making every lane wait for final story content.
  Integrate small increments; keep human playtesting for emotional quality.
- The integrator assigns a task ID, owner, branch/worktree, allowed paths, and done
  criteria before parallel editing. Only the integrator updates the shared task board.
- Use one worktree per independently running agent. Do not share a checkout for
  concurrent writes. Shared-checkout subagents must have disjoint allowed paths.
- Do not change another task's files, shared interfaces, dependency files, or root
  configuration without coordination with the integrator.
- Preserve existing user changes. Never reset, clean, force-push, or overwrite them.
- Handoff: changed files, summary, checks actually run, unresolved issues, commit
  if present. Do not claim tests, tool integrations, or deploys you have not verified.

## Product constraints

- Web-only: maintain the browser game and GitHub Pages deployment. The Windows
  wrapper and native distribution have been removed at the user’s request.
- Follow the short plan: a finite three-act browser experience, no runtime AI or backend.
- Keep history sourced in `docs/SOURCES.md`; label invented thoughts, compressed
  timelines, and simplified power behavior. Never present invented dialogue as
  NASA telemetry or imply the player could have saved the rover.
- Darkness must not reduce text/control contrast or hide keyboard focus. Core
  interactions must work with touch, keyboard, and sound off.
- Record external/generated assets in `public/ASSETS.csv` with attribution and
  usage terms. No credentials, private transcripts, or downloaded source archives in Git.
- When coding begins, prefer small modules and meaningful behavior checks. Run
  relevant checks and report limitations. Keep game content separate from runtime.
