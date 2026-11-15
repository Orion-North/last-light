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
  t.setCursor(b.x, b.y); hold(t, 100); assert.equal(t.snapshot().samples.length, 1);
  t.setInput({}); t.setInput({pressure:1}); hold(t); assert.equal(t.snapshot().stage, 'compare');
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


test('reload preserves brush coverage and a completed reading but not a held input',()=>{
  const t=createGeologyTool('blueberries');brush(t);
  const a=t.snapshot().targets[0];t.setCursor(a.x,a.y);t.setInput({});t.setInput({pressure:1});hold(t);
  const checkpoint=JSON.parse(JSON.stringify(t.checkpoint()));
  const restored=createGeologyTool('blueberries',checkpoint);
  assert.deepEqual(restored.checkpoint(),checkpoint);
  const b=restored.snapshot().targets[1];restored.setCursor(b.x,b.y);restored.setInput({pressure:1});hold(restored,100);
  assert.equal(restored.snapshot().samples.length,1);
  restored.setInput({});restored.setInput({pressure:1});hold(restored);assert.equal(restored.snapshot().stage,'compare');
  const compared=createGeologyTool('blueberries',restored.checkpoint());assert.equal(compared.snapshot().stage,'compare');assert.equal(compared.compare(),true);
  assert.equal(createGeologyTool('blueberries',compared.checkpoint()).snapshot().complete,true);
});

test('reload preserves partial tracing and reconstructs completed paths from visited points',()=>{
  const t=createGeologyTool('stone-ripples');t.setInput({});t.setInput({pressure:1});
  for(const p of t.snapshot().paths[0].points.slice(0,12)){t.setCursor(p.x,p.y);t.update(.05);}
  const r=createGeologyTool('stone-ripples',t.checkpoint());assert.deepEqual(r.checkpoint(),t.checkpoint());
  tracePath(r,0);const r2=createGeologyTool('stone-ripples',r.checkpoint());assert.equal(r2.snapshot().samples.length,1);
  tracePath(r2,1);assert.equal(r2.snapshot().stage,'compare');
  const forged=createGeologyTool('stone-ripples',{sceneId:'stone-ripples',stage:'complete',sampleIds:['lower','upper']});
  assert.equal(forged.snapshot().stage,'trace');assert.equal(forged.snapshot().samples.length,0);
});

test('trace feedback follows adjacent nearest dots and reverse revisits, not coverage radius', () => {
  const t = createGeologyTool('stone-ripples');
  const points = t.snapshot().paths[0].points;
  t.setCursor(points[0].x, points[0].y); t.setInput({}); t.update(.05);
  t.setInput({ pressure: .8 }); t.update(.05);
  assert.equal(t.snapshot().feedback.pulse, 1);
  assert.equal(t.snapshot().feedback.active, false);
  assert.ok(t.snapshot().paths[0].points.filter(p => p.visited).length > 1);
  for (let i = 1; i <= 4; i++) {
    t.setCursor(points[i].x, points[i].y); t.update(.05);
    assert.equal(t.snapshot().feedback.pulse, i + 1);
    assert.equal(t.snapshot().feedback.active, true);
  }
  t.setCursor(points[3].x, points[3].y); t.update(.05);
  assert.equal(t.snapshot().feedback.pulse, 6);
  hold(t, 20); assert.equal(t.snapshot().feedback.pulse, 6);
  assert.equal(t.snapshot().feedback.active, false);
  const midpoint = { x: (points[3].x + points[4].x) / 2, y: (points[3].y + points[4].y) / 2 };
  for (let i = 0; i < 20; i++) { t.setCursor(midpoint.x + (i % 2 ? .0001 : -.0001), midpoint.y); t.update(.05); }
  assert.equal(t.snapshot().feedback.pulse, 6);
  t.setCursor(0, -.94); t.update(.05);
  assert.equal(t.snapshot().feedback.active, false); assert.equal(t.snapshot().feedback.pulse, 6);
});

test('brush feedback uses actual motion, stops at bounds, and never persists in saves', () => {
  const t = createGeologyTool('blueberries'); t.setInput({}); t.setInput({pressure: .7});
  t.update(.05); assert.equal(t.snapshot().feedback.active, false);
  t.setCursor(.2, .1); t.update(.05);
  assert.equal(t.snapshot().feedback.active, true); assert.equal(t.snapshot().feedback.motion, 1);
  assert.ok(t.snapshot().feedback.roughness > 0);
  t.setCursor(.95, .1); t.setInput({x:1, pressure:.7}); t.update(.05); t.update(.05);
  assert.equal(t.snapshot().feedback.active, false); assert.equal(t.snapshot().feedback.motion, 0);
  t.setInput({}); assert.equal(t.snapshot().feedback.pressure, 0);
  assert.equal('feedback' in t.checkpoint(), false);
  t.setInput({x:-1, pressure:1}); t.update(.05); assert.equal(t.snapshot().feedback.active, true);
  t.update(.05, true); assert.equal(t.snapshot().feedback.active, false);
  t.setInput({pressure:1}); t.setCursor(0,0); t.update(.05); assert.equal(t.snapshot().feedback.active, false);
  const restored = createGeologyTool('blueberries', t.checkpoint());
  assert.deepEqual(restored.snapshot().feedback, {active:false, mode:'brush', pulse:0, motion:0, pressure:0, roughness:0});
});

test('feedback ends at stage boundaries and resumes without replaying old contacts', () => {
  const t = createGeologyTool('stone-ripples'); tracePath(t,0);
  assert.equal(t.snapshot().feedback.active, false);
  const pulse = t.snapshot().feedback.pulse;
  t.update(.05,true); assert.equal(t.snapshot().feedback.pulse,pulse);
  t.setInput({pressure:1}); hold(t); assert.equal(t.snapshot().feedback.pulse,pulse);
  tracePath(t,1); assert.equal(t.snapshot().stage,'compare'); assert.equal(t.snapshot().feedback.active,false);
  const completedPulse=t.snapshot().feedback.pulse;
  t.setInput({});t.setInput({x:1,pressure:1});hold(t);t.compare();
  assert.equal(t.snapshot().feedback.pulse,completedPulse);assert.equal(t.snapshot().feedback.active,false);
});

test('a fast held sweep counts crossed dots once each instead of one frame pulse', () => {
  const t=createGeologyTool('stone-ripples'), points=t.snapshot().paths[0].points;
  t.setCursor(points[0].x,points[0].y);t.setInput({});t.update(.05);t.setInput({pressure:1});t.update(.05);
  t.setCursor(points[5].x,points[5].y);t.update(.05);
  assert.equal(t.snapshot().feedback.pulse,6);
  t.setCursor(points[0].x,points[0].y);t.update(.05);
  assert.equal(t.snapshot().feedback.pulse,11);
});
