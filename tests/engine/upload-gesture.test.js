import test from 'node:test';
import assert from 'node:assert/strict';
import { createUploadGesture, createStickUpload } from '../../src/engine/upload-gesture.js';

const idle = { progress: 0, commit: false };
const point = (y, extra = {}) => ({ x: 0, y, id: 1, active: true, ...extra });
function swipe({ duration = 300, finishY = -.1, finishX = 0, cancelled = false } = {}) {
  const gesture = createUploadGesture();
  gesture.sample(point(.6), 0);
  gesture.sample(point(finishY, { x: finishX }), duration / 2);
  return gesture.sample(point(finishY, { x: finishX, active: false, cancelled }), duration);
}

test('upward progress is visible while held but commits only on a real release once', () => {
  const gesture = createUploadGesture();
  assert.deepEqual(gesture.sample(point(.6), 0), idle);
  const halfway = gesture.sample(point(.325), 80);
  assert.ok(Math.abs(halfway.progress - .5) < 1e-10); assert.equal(halfway.commit, false);
  assert.deepEqual(gesture.sample(point(-.1), 160), { progress: 1, commit: false });
  assert.deepEqual(gesture.sample(point(-.1, { active: false }), 200), { progress: 1, commit: true });
  assert.deepEqual(gesture.sample(point(-.1, { active: false }), 210), idle);
});

test('duration accepts deliberate flick and slow swipe boundaries, rejects twitch and timeout', () => {
  for (const duration of [70, 300, 1800]) assert.equal(swipe({ duration }).commit, true);
  for (const duration of [0, 69, 1801, 5000]) assert.deepEqual(swipe({ duration }), idle);
});

test('distance and lateral boundaries allow an exact intended swipe without requiring ids', () => {
  const gesture = createUploadGesture();
  gesture.sample({ x: 0, y: .6, active: true }, 0);
  assert.equal(gesture.sample({ x: .35, y: .05, active: false }, 70).commit, true);
  gesture.sample(point(.6), 100);
  assert.equal(gesture.sample(point(.051, { active: false }), 200).commit, false);
});

test('short, downward, horizontal, and cancelled gestures do not commit', () => {
  for (const options of [{ finishY: .2 }, { finishY: 1 }, { finishX: .36 }, { cancelled: true }]) {
    assert.deepEqual(swipe(options), idle);
  }
});

test('release coordinates are checked and a horizontal excursion cannot be repaired', () => {
  const gesture = createUploadGesture();
  gesture.sample(point(.6), 0);
  gesture.sample(point(0, { x: .4 }), 100);
  assert.deepEqual(gesture.sample(point(-.1), 150), idle);
  assert.deepEqual(gesture.sample(point(-.1, { active: false }), 200), idle);
  gesture.sample(point(.6), 300);
  assert.deepEqual(gesture.sample(point(-.1, { x: .5, active: false }), 500), idle);
});

test('identity change blocks held-contact handoff until release', () => {
  const gesture = createUploadGesture();
  gesture.sample(point(.6), 0);
  assert.deepEqual(gesture.sample(point(-.1, { id: 2 }), 100), idle);
  assert.deepEqual(gesture.sample(point(-.5, { id: 2 }), 150), idle);
  assert.deepEqual(gesture.sample(point(-.5, { id: 2, active: false }), 200), idle);
  gesture.sample(point(.6, { id: 3 }), 300);
  assert.equal(gesture.sample(point(-.1, { id: 3, active: false }), 400).commit, true);
});

test('reset cancels a tracked swipe and requires its release before another start', () => {
  const gesture = createUploadGesture();
  gesture.sample(point(.6), 0); gesture.sample(point(-.1), 100); gesture.reset();
  assert.deepEqual(gesture.sample(point(-.5), 200), idle);
  assert.deepEqual(gesture.sample(point(-.5, { active: false }), 250), idle);
  gesture.sample(point(.6), 300);
  assert.equal(gesture.sample(point(-.1, { active: false }), 400).commit, true);
  gesture.reset(); gesture.reset();
  gesture.sample(point(.6), 500);
  assert.equal(gesture.sample(point(-.1, { active: false }), 600).commit, true);
});

test('invalid samples and reversed time cancel safely without later release committing', () => {
  for (const invalid of [point(NaN), point(2), point(0, { x: Infinity }), null]) {
    const gesture = createUploadGesture(); gesture.sample(point(.6), 100);
    assert.deepEqual(gesture.sample(invalid, 200), idle);
    assert.deepEqual(gesture.sample(point(-.1, { active: false }), 300), idle);
  }
  for (const time of [NaN, Infinity, 50]) {
    const gesture = createUploadGesture(); gesture.sample(point(.6), 100);
    assert.deepEqual(gesture.sample(point(-.1), time), idle);
    assert.deepEqual(gesture.sample(point(-.1, { active: false }), 300), idle);
  }
});

test('stick requires neutral then sustained up, commits once until neutral again', () => {
  const stick = createStickUpload();
  for (let i = 0; i < 20; i++) assert.deepEqual(stick.sample(-1, .05), idle);
  stick.sample(0, 0);
  for (let i = 0; i < 12; i++) assert.equal(stick.sample(-1, .05).commit, false);
  assert.deepEqual(stick.sample(-1, .05), { progress: 1, commit: true });
  for (let i = 0; i < 20; i++) assert.deepEqual(stick.sample(-1, .05), idle);
  stick.sample(0, 0);
  for (let i = 0; i < 12; i++) stick.sample(-1, .05);
  assert.equal(stick.sample(-1, .05).commit, true);
});

test('stick reset, partial release, invalid delta and hidden-time spikes never ghost commit', () => {
  const stick = createStickUpload(); stick.sample(0, 0);
  assert.equal(stick.sample(-1, 20).commit, false);
  stick.reset(); assert.deepEqual(stick.sample(-1, .05), idle);
  stick.sample(0, 0); stick.sample(-1, .05);
  assert.deepEqual(stick.sample(-.4, .05), idle);
  assert.equal(stick.sample(-1, .05).progress < .1, true);
  for (const delta of [NaN, Infinity, undefined, -1]) assert.equal(stick.sample(-1, delta).commit, false);
  assert.deepEqual(stick.sample(NaN, .05), idle);
  assert.deepEqual(stick.sample(-1, .05), idle);
});

test('screen drag can be slow but still requires a real release and respects cancellation', () => {
  const gesture = createUploadGesture({ maxDurationMs: Infinity });
  gesture.sample(point(.6), 0);
  assert.deepEqual(gesture.sample(point(-.1), 8000), { progress: 1, commit: false });
  assert.deepEqual(gesture.sample(point(-.1, { active: false }), 9000), { progress: 1, commit: true });
  gesture.sample(point(.6), 10000);
  assert.deepEqual(gesture.sample(point(-.1, { active: false, cancelled: true }), 19000), idle);
});
