import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractionWait } from '../../src/engine/interaction-wait.js';

function fakeTimers() {
  const jobs = [];
  const cleared = [];
  const wait = createInteractionWait({
    setTimer(callback, delay) {
      jobs.push({ callback, delay });
      return jobs.length - 1;
    },
    clearTimer(id) { cleared.push(id); },
  });
  // Deliberately allow cleared timers to fire, like already queued callbacks.
  return { wait, jobs, cleared, fire: id => jobs[id].callback() };
}

test('completes once with pending cleared before the callback', () => {
  const { wait, jobs, fire } = fakeTimers();
  let calls = 0;
  assert.equal(wait.pending, false);
  wait.start(125, () => {
    assert.equal(wait.pending, false);
    calls++;
  });
  assert.equal(wait.pending, true);
  assert.equal(jobs[0].delay, 125);
  fire(0);
  fire(0);
  assert.equal(calls, 1);
  assert.equal(wait.pending, false);
});

test('cancel is idempotent and suppresses late completion after pause or restart', () => {
  const { wait, cleared, fire } = fakeTimers();
  let calls = 0;
  wait.cancel();
  wait.start(0, () => calls++);
  wait.cancel();
  wait.cancel();
  assert.equal(wait.pending, false);
  assert.deepEqual(cleared, [0]);
  fire(0);
  assert.equal(calls, 0);
});

test('starting again cancels the old wait without letting stale callbacks affect the new one', () => {
  const { wait, cleared, fire } = fakeTimers();
  const completed = [];
  wait.start(10, () => completed.push('old'));
  wait.start(20, () => completed.push('new'));
  assert.deepEqual(cleared, [0]);
  fire(0);
  assert.equal(wait.pending, true);
  assert.deepEqual(completed, []);
  fire(1);
  assert.deepEqual(completed, ['new']);
  assert.equal(wait.pending, false);
});

test('a completion can start another wait without old callbacks corrupting it', () => {
  const { wait, fire } = fakeTimers();
  const completed = [];
  wait.start(1, () => {
    completed.push('first');
    wait.start(2, () => completed.push('second'));
  });
  fire(0);
  assert.equal(wait.pending, true);
  fire(0);
  assert.equal(wait.pending, true);
  fire(1);
  assert.deepEqual(completed, ['first', 'second']);
  assert.equal(wait.pending, false);
});

test('invalid arguments throw without replacing a valid pending wait', () => {
  const { wait, fire } = fakeTimers();
  let calls = 0;
  wait.start(1, () => calls++);
  for (const delay of [-1, NaN, Infinity, '1', undefined]) {
    assert.throws(() => wait.start(delay, () => {}), RangeError);
  }
  assert.throws(() => wait.start(1, null), TypeError);
  assert.equal(wait.pending, true);
  fire(0);
  assert.equal(calls, 1);
});
