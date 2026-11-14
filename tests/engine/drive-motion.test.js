import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveMotion } from '../../src/engine/drive-motion.js';

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
function cruise(motion, input = { forward: 1, turn: 1 }) {
  let result;
  for (let i = 0; i < 30; i++) result = motion.step(input, .05);
  return result;
}

test('manual start is gradual, monotonic, and never overshoots either target', () => {
  const motion = createDriveMotion();
  let previous = { speed: 0, turnRate: 0 };
  for (let i = 0; i < 30; i++) {
    const result = motion.step({ forward: 1, turn: 1 }, .05);
    assert.ok(result.speed >= previous.speed && result.speed <= .85);
    assert.ok(result.turnRate >= previous.turnRate && result.turnRate <= .85);
    if (!i) { near(result.speed, .08); near(result.turnRate, .2); }
    previous = result;
  }
  near(previous.speed, .85);
  near(previous.turnRate, .85);
});

test('release brakes monotonically to rest within a bounded distance', () => {
  const motion = createDriveMotion();
  cruise(motion);
  let previous = .85;
  let distance = 0;
  for (let i = 0; i < 20; i++) {
    const { speed, turnRate } = motion.step({}, .02);
    assert.ok(speed >= 0 && speed <= previous);
    distance += speed * .02;
    previous = speed;
    if (i === 19) assert.deepEqual({ speed, turnRate }, { speed: 0, turnRate: 0 });
  }
  assert.ok(distance > 0 && distance < .13);
});

test('reverse brakes through zero before accelerating in the opposite direction', () => {
  const motion = createDriveMotion();
  near(motion.step({ forward: 1 }, .05).speed, .08);
  near(motion.step({ forward: -1 }, .08 / 3).speed, 0);
  near(motion.step({ forward: -1 }, .05).speed, -.08);
  const result = cruise(motion, { forward: -1, turn: -1 });
  near(result.speed, -.85);
  near(result.turnRate, -.85);
});

test('reset immediately removes speed and steering with no subsequent drift', () => {
  const motion = createDriveMotion();
  cruise(motion);
  motion.reset();
  motion.reset();
  assert.deepEqual(motion.step({}, .05), { speed: 0, turnRate: 0 });
  near(motion.step({ forward: 1 }, .01).speed, .016);
});

test('equivalent time partitions agree across acceleration, reverse, and release', () => {
  function run(delta) {
    const motion = createDriveMotion();
    let result;
    for (const [duration, input] of [[.4, { forward: 1, turn: 1 }], [.35, { forward: -1, turn: -.5 }], [.2, {}]]) {
      for (let i = 0; i < Math.round(duration / delta); i++) result = motion.step(input, delta);
    }
    return result;
  }
  const a = run(.05), b = run(.01);
  near(a.speed, b.speed);
  near(a.turnRate, b.turnRate);
});

test('untrusted axes and deltas are safe and bounded', () => {
  for (const delta of [NaN, Infinity, -1, undefined, '1']) {
    const motion = createDriveMotion();
    assert.deepEqual(motion.step({ forward: 1, turn: 1 }, delta), { speed: 0, turnRate: 0 });
  }
  const motion = createDriveMotion();
  assert.deepEqual(motion.step(null, .05), { speed: 0, turnRate: 0 });
  assert.deepEqual(motion.step({ forward: NaN, turn: Infinity }, .05), { speed: 0, turnRate: 0 });
  assert.deepEqual(motion.step({ forward: '1', turn: undefined }, .05), { speed: 0, turnRate: 0 });
  const result = motion.step({ forward: 100, turn: -100 }, 20);
  near(result.speed, .08);
  near(result.turnRate, -.2);
});

test('assisted movement bypasses smoothing and preserves existing route scales', () => {
  const motion = createDriveMotion();
  assert.deepEqual(motion.step({ forward: .5, turn: -.5, assisted: true }, .01), { speed: .6, turnRate: -.75 });
  assert.deepEqual(motion.step({ forward: -1, turn: 1, assisted: true }, .01), { speed: -1.2, turnRate: 1.5 });
  assert.deepEqual(motion.step({ assisted: true }, .01), { speed: 0, turnRate: 0 });
});
