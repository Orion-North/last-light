import test from 'node:test';
import assert from 'node:assert/strict';
import { createActiveInput } from '../../src/input/active-input.js';

test('active input defaults to keyboard and only notifies device changes', () => {
  const changes = [], input = createActiveInput({ onChange: (...args) => changes.push(args) });
  assert.equal(input.current, 'keyboard');
  assert.equal(input.use('keyboard'), false);
  assert.equal(input.use('controller'), true);
  assert.equal(input.current, 'controller');
  assert.equal(input.use('controller'), false);
  assert.equal(input.use('mouse'), true);
  assert.equal(input.use('keyboard'), true);
  assert.equal(input.use('touch'), true);
  assert.deepEqual(changes, [['controller', 'keyboard'], ['mouse', 'controller'], ['keyboard', 'mouse'], ['touch', 'keyboard']]);
});

test('active input rejects unknown devices and supports an explicit starting device', () => {
  const input = createActiveInput({ initial: 'touch' });
  for (const value of ['connected', '', undefined, {}, 'gamepad']) assert.equal(input.use(value), false);
  assert.equal(input.current, 'touch');
  assert.equal(createActiveInput({ initial: 'unknown' }).current, 'keyboard');
});
