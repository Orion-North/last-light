const axis = value => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
const approach = (value, target, amount) => value + Math.sign(target - value) * Math.min(Math.abs(target - value), amount);

/** Small deterministic velocity response; callers own position and collisions. */
export function createDriveMotion() {
  let speed = 0;
  let turnRate = 0;

  function reset() {
    speed = 0;
    turnRate = 0;
  }

  function step(input = {}, deltaSeconds = 0) {
    const forward = axis(input?.forward);
    const turn = axis(input?.turn);
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0;
      const target = forward * 1.15;
      if (speed * target < 0) {
        // Spend time stopping first, then accelerate only with time left over.
        const stoppingTime = Math.abs(speed) / 3;
        speed = approach(speed, 0, 3 * delta);
        if (delta > stoppingTime) speed = approach(0, target, 1.6 * (delta - stoppingTime));
      } else {
        const rate = Math.abs(target) < Math.abs(speed) ? 3 : 1.6;
        speed = approach(speed, target, rate * delta);
      }
      turnRate = approach(turnRate, turn * .85, 4 * delta);
    return { speed, turnRate };
  }

  return { step, reset };
}
