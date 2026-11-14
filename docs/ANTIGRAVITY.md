# Antigravity delegation

Verified on 2026-11-14 using the installed `agy` CLI and existing account sign-in.
Codex can invoke it for a bounded assignment and collect its structured result.
This is an external CLI handoff, not a native Codex subagent connection.

## Verification

- `agy models` successfully listed the account's model catalog.
- A read-only critique using `gemini-4-argon-medium` returned `SUCCESS` in about
  26 seconds. It received a self-contained brief and selected game-code excerpts
  in an isolated scratch directory. No game files were changed.
- The response identified the immediate `CHOOSE` → `TRANSMIT` transition and
  questioned whether a photography interface would justify its scope. It gave
  a proposed player test, making it useful as an independent design review.
- This tested text/code critique only. It did not test file editing, browser
  control, image generation, or the other listed models. It was not a playtest
  or a comparison of model quality. The requested word limit was exceeded.

The catalog exposed Gemini 4 Argon/Hydrogen, Gemini 3.8 Flash, Claude Opus/Sonnet
5.5, and GPT-OSS 120B options. Availability can change; query `agy models` before
choosing a different model. Only Argon Medium inference was verified here.

## Handoff procedure

Keep GPT-6.1 Sol as the default subagent. Use an assigned Antigravity lane for
independent critique or a bounded alternative proposal when useful. Reserve
Astra for work that materially needs it. No evidence yet establishes a speed,
cost, or quality advantage for Antigravity over Sol on this project.

1. Record task ID, owner, scope, and acceptance criteria in `TASKS.md`.
2. For review, provide only the needed brief/excerpts. For future editing, create
   a separate worktree and explicitly require reading `AGENTS.md` and the task.
3. Pin the model. The verified invocation used `--mode plan --sandbox`,
   `--input-format stream-json --output-format stream-json`, and
   `--print-timeout 120s`. Send a user event through stdin and close stdin:

   ```json
   {"event":"user","message":{"content":"Bounded assignment and relevant excerpts"}}
   ```

4. Check the returned init model, result status, response, and tool activity;
   process exit alone does not establish a successful assignment.
5. Codex reviews the handoff, verifies proposed changes, and integrates them.
   Agents do not publish independently. Do not bypass permission prompts.

This machine required approved elevated execution for the CLI's local service
socket and normal log storage. That does not grant future runs blanket approval.
Keep account data and raw CLI logs outside the repository.

[Official headless CLI documentation](https://antigravity.google/docs/cli/headless/).
