# MOTION-04 — deterministic rover velocity response

- Owner: Codex MOTION-04 subagent; shared `develop/v0.4` checkout, disjoint files.
- Changed paths: `src/engine/drive-motion.js`,
  `tests/engine/drive-motion.test.js`, this handoff.
- API: `createDriveMotion()` returns `step(input, deltaSeconds)` and `reset()`.
  Step returns `{ speed, turnRate }`; callers apply these velocities to position
  and heading. No dependencies or landscape/main changes in this lane.
- Manual behavior: forward/reverse maximum 0.85 m/s, acceleration 1.6 m/s²,
  braking 3 m/s², turn maximum 0.85 rad/s and response 4 rad/s². Reversal spends
  time braking to zero before using remaining frame time to accelerate opposite.
  This preserves velocity results across ordinary timestep partitions.
- Assisted behavior: immediate `forward * 1.2` speed and `turn * 1.5` turn rate,
  preserving prior route dynamics. Assisted state becomes the starting velocity
  for subsequent manual input; call reset when an interruption must stop instantly.
- Safety: nonfinite/nonnumeric axes become zero, finite axes clamp to [-1, 1].
  Finite dt clamps to [0, 0.05]; invalid dt becomes zero. Reset zeros both state
  values immediately. Missing/null input is accepted.
- Checks actually run: Node built-in tests, seven passed; covered gradual start,
  monotonic bounded stopping, zero-crossing reversal, target bounds, reset/no
  drift, timestep partition equivalence, untrusted values, and exact assisted
  scales. Scoped `git diff --check` passed.
- Limitations: no browser or physical controller feel test in this lane. Position
  integration/collision remain landscape responsibilities. No publication/commit.
- Next action: CAMERA-04 integrates velocity into landscape movement and reset
  into pause/blur/reset; integrator handles main input interruption semantics.
