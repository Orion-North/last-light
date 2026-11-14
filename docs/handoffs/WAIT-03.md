# WAIT-03 — cancellable interaction wait

- Agent / owner: Codex WAIT-03 subagent.
- Branch / worktree: shared checkout, disjoint assigned paths; no commit made.
- Allowed paths / files changed: `src/engine/interaction-wait.js`,
  `tests/engine/interaction-wait.test.js`, this handoff.
- Changes: added `createInteractionWait({ setTimer, clearTimer } = {})`, returning
  `start(delayMs, onComplete)`, `cancel()`, and a read-only `pending` getter.
  Starting replaces the prior timer. Cancellation clears the callback reference
  and invalidates its generation; even a queued stale callback cannot complete.
  Completion clears pending state before invoking user code, including when that
  code starts another wait. Invalid arguments throw before changing an existing wait.
- Dependencies: none; browser timers default, injectable timers for tests.
- Checks actually run: Node built-in test runner executed
  `tests/engine/interaction-wait.test.js`; all five tests passed. Covered delay
  forwarding, pending state, one-shot completion, repeated cancel, late callbacks,
  superseding work, reentrant start, and invalid argument handling.
- Unrun checks / limitations: no browser or main-flow integration changes in this
  lane. Timer injection follows normal asynchronous `setTimeout` behavior.
- Next action: integrator wires cancel into pause/restart and resets wait visuals;
  resume remains at transmit so the player deliberately retries. No story state
  should advance while the interaction is suspended.
