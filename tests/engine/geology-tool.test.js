import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeologyTool } from '../../src/engine/geology-tool.js';
function brush(tool) {
  tool.setInput({});
  tool.setInput({ pressure: 1 });
  for (let y = -.85; y <= .9; y += .19) for (let x = -.85; x <= .9; x += .19) {
    tool.setCursor(x, y); tool.update(.05);
  }
}
function hold(tool, count = 16) { for (let i = 0; i < count; i++) tool.update(.05); }
test('idle and a held brush cannot clear the patch; actual spatial coverage does', () => {
  const t = createGeologyTool('blueberries'); hold(t, 100); assert.equal(t.snapshot().coverage, 0);
  t.setInput({ pressure: 1 }); hold(t, 500); assert.ok(t.snapshot().coverage < .06);
  brush(t); assert.equal(t.snapshot().stage, 'sample');
});
test('requires trigger release, distinct surface readings, and deliberate comparison', () => {
  const t = createGeologyTool('blueberries'); brush(t);
  const [a, b] = t.snapshot().targets;
  t.setCursor(a.x, a.y); hold(t); assert.equal(t.snapshot().samples.length, 0);
  t.setInput({}); t.update(.05); t.setInput({ pressure: 1 }); hold(t);
  assert.equal(t.snapshot().samples.length, 1); hold(t, 100); assert.equal(t.snapshot().samples.length, 1);
  assert.equal(t.compare(), false);
  t.setCursor(b.x, b.y); hold(t); assert.equal(t.snapshot().stage, 'compare');
  hold(t, 100); assert.equal(t.snapshot().complete, false);
  assert.equal(t.compare(), true); assert.equal(t.snapshot().complete, true);
});
test('pause clears held input; invalid input and unsupported scenes are bounded', () => {
  assert.equal(createGeologyTool('storm'), null);
  const t = createGeologyTool('blueberries'); t.setInput({ x: Infinity, y: NaN, pressure: NaN }); hold(t);
  assert.deepEqual(t.snapshot().cursor, { x: 0, y: 0 });
  t.setInput({ pressure: 1 }); t.update(.05, true); hold(t); assert.equal(t.snapshot().coverage, 0);
  t.setCursor(Infinity, NaN); assert.deepEqual(t.snapshot().cursor, { x: 0, y: 0 });
});

test('a trigger carried from driving cannot operate until an observed release', () => {
  const t = createGeologyTool('blueberries');
  t.setInput({ pressure: 1, x: 1 }); hold(t, 100);
  assert.equal(t.snapshot().coverage, 0);
  assert.match(t.snapshot().hint, /Release R2/);
  t.setInput({}); t.update(.05); t.setInput({ pressure: 1 }); t.update(.05);
  assert.ok(t.snapshot().coverage > 0);
});
test('pause interrupts a partly acquired sample and requires release before resuming', () => {
  const t = createGeologyTool('blueberries'); brush(t);
  const target = t.snapshot().targets[0]; t.setCursor(target.x, target.y);
  t.setInput({}); t.setInput({ pressure: 1 }); hold(t, 10);
  t.update(.05, true); t.setInput({ pressure: 1 }); hold(t, 50);
  assert.equal(t.snapshot().samples.length, 0);
  t.setInput({}); t.setInput({ pressure: 1 }); hold(t, 16);
  assert.equal(t.snapshot().samples.length, 1);
});

test('a pointer wiggling inside one target must settle before a reading accumulates', () => {
  const t = createGeologyTool('blueberries'); brush(t);
  const target = t.snapshot().targets[0];
  t.setInput({}); t.setInput({ pressure: 1 });
  for (let i = 0; i < 100; i++) {
    t.setCursor(target.x + (i % 2 ? .04 : -.04), target.y);
    t.update(.05);
  }
  assert.equal(t.snapshot().samples.length, 0);
  hold(t, 16);
  assert.equal(t.snapshot().samples.length, 1);
});

test('synthetic neutral cannot arm a carried trigger after entry or pause', () => {
  const t = createGeologyTool('blueberries');
  t.setInput({ pressure: 0, actualSample: false });
  t.setInput({ pressure: 1, actualSample: true }); hold(t);
  assert.equal(t.snapshot().coverage, 0);
  t.setInput({ pressure: 0, actualSample: true }); t.setInput({ pressure: 1 }); hold(t);
  assert.ok(t.snapshot().coverage > 0);
  brush(t); const target = t.snapshot().targets[0]; t.setCursor(target.x, target.y);
  t.stop(); t.setInput({ pressure: 0, actualSample: false });
  t.setInput({ pressure: 1, actualSample: true }); hold(t, 40);
  assert.equal(t.snapshot().samples.length, 0);
  t.setInput({ pressure: 0, actualSample: true }); t.setInput({ pressure: 1 }); hold(t);
  assert.equal(t.snapshot().samples.length, 1);
});

function tracePath(tool, index) {
  tool.setInput({}); tool.setInput({ pressure: 1 });
  for (const point of tool.snapshot().paths[index].points) { tool.setCursor(point.x, point.y); tool.update(.05); }
}
test('Last Chance traces two unique spatial paths; holding one point never completes', () => {
  const t = createGeologyTool('stone-ripples');
  assert.equal(t.snapshot().mode, 'trace'); assert.equal(t.snapshot().stage, 'trace');
  assert.equal(t.snapshot().paths.length, 2);
  const point = t.snapshot().paths[0].points[0]; t.setCursor(point.x, point.y);
  t.setInput({}); t.setInput({ pressure: 1 }); hold(t, 1000);
  assert.equal(t.snapshot().samples.length, 0); assert.ok(t.snapshot().progress < .1);
  tracePath(t, 0); assert.equal(t.snapshot().samples.length, 1);
  for (const p of t.snapshot().paths[1].points) { t.setCursor(p.x, p.y); t.update(.05); }
  assert.equal(t.snapshot().samples.length, 1);
  t.setInput({ pressure: 0, actualSample: false }); t.setInput({ pressure: 1 }); hold(t);
  assert.equal(t.snapshot().samples.length, 1);
  tracePath(t, 1); assert.equal(t.snapshot().stage, 'compare');
  assert.equal(t.snapshot().complete, false); assert.match(t.snapshot().hint, /compare the layer directions/); assert.equal(t.compare(), true); assert.equal(t.snapshot().hint, 'Comparison recorded');
});
test('tracing ignores off-path sweeps and retains coverage safely through pause', () => {
  const t = createGeologyTool('stone-ripples'); t.setInput({}); t.setInput({ pressure: 1 });
  for (let x = -.9; x < .9; x += .03) { t.setCursor(x, -.94); t.update(.05); }
  assert.equal(t.snapshot().coverage, 0);
  const points = t.snapshot().paths[0].points;
  for (const p of points.slice(0, 12)) { t.setCursor(p.x, p.y); t.update(.05); }
  const coverage = t.snapshot().coverage; t.update(.05, true);
  t.setInput({ pressure: 1 }); for (const p of points) { t.setCursor(p.x, p.y); t.update(.05); }
  assert.equal(t.snapshot().coverage, coverage); assert.equal(t.snapshot().samples.length, 0);
  tracePath(t, 0); assert.equal(t.snapshot().samples.length, 1);
});
