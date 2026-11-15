# Contributing to Last Light

For bugs and playtest impressions, [open an issue](https://github.com/Orion-North/last-light/issues/new/choose). Include what you were trying to do, what happened, the scene, and your browser/controller setup. Mark story spoilers.

For code changes, use Node.js 22+ (Node 24 in CI). Run `npm run dev` for the local game, then `npm run check`, `npm test`, and `npm run build` before submitting a focused PR. Verify relevant player behavior in the browser; automated checks do not establish controller feel or emotional pacing.

Read the [architecture](docs/ARCHITECTURE.md) and [asset ledger](public/ASSETS.csv). Preserve credits and vendor notices. The original project license is undecided; do not introduce a license or assume asset terms cover the whole project.

## Agent coordination

Use the repository root as the workspace. Every agent reads [AGENTS.md](AGENTS.md)
and receives a bounded task from the integrator. The initial integrator is Codex;
roles are transferable and are not tied to one model's capabilities.

## Work lanes

| Lane | Owned paths | Deliverable |
| --- | --- | --- |
| Runtime | `src/engine/`, `tests/engine/` | Deterministic state and scene transitions |
| Story and research | `src/content/`, `docs/SOURCES.md` | Sourced beats, content, fact/fiction labels |
| Presentation | `src/ui/`, `public/images/` | Responsive scenes, controls, accessibility |
| Sound | `src/audio/`, `public/audio/` | Optional sound, fades, mute behavior |
| Integrator / QA | Root config, `src/contracts/`, `tests/e2e/`, task board | Contracts, integration, build, browser checks |

These are boundaries, not automatic assignments. Each active task narrows them to
specific files. The integrator merges asset ledger updates supplied in handoffs.

## Fast parallel delivery

Begin with Codex and available subagents. Define the minimum shared contract and
sample content while story research runs separately, then dispatch runtime,
content, and presentation work in parallel. Schedule sound and independent review
as slots become available. Claude and Antigravity can join those same lanes later.

Use AI heavily for implementation, story variants, asset creation, and review;
record asset provenance and verify scientific claims. Integrate at each small
working milestone instead of waiting for whole lanes to finish. Automated review
supports human playtesting; emotional pacing needs an actual playthrough.

## Branch and worktree procedure

The integrator records ownership in [TASKS.md](docs/TASKS.md) before dispatching
work. From the repository root, after a baseline commit exists:

```sh
git worktree add -b agent/claude/story ../last-light-claude main
```

Open that worktree in Claude. Use the same pattern with another task and agent
name for Antigravity or Codex. Each agent commits only assigned files. The
integrator reviews and merges branches one at a time, checks the combined result,
and updates the task board. Do not merge concurrently or force-push.

When multiple tools cannot share a live conversation, the task board and handoff
files are the coordination record. The board is deliberately single-writer;
agents report changes rather than racing to claim rows. Handoffs go in
`docs/handoffs/<task-id>.md` using the [template](docs/handoffs/TEMPLATE.md).

## Handoff and review

Include scope, changed paths, dependency/interface changes, checks and results,
limitations, and the next action. Unrun checks must be marked unrun. Shared
interface changes go through the integrator before dependent work resumes.

PRs should include source/build checks and relevant behavior tests; browser changes need checks of the affected keyboard/controller flow, mute, and pause behavior.

The entry files are provided for onboarding. Antigravity CLI delegation was
subsequently verified with a read-only Gemini critique; see
[the handoff procedure](docs/ANTIGRAVITY.md). Claude has not been tested directly.
Explicitly require external editing agents to read `AGENTS.md` before work;
the isolated critique test did not verify automatic instruction loading.
