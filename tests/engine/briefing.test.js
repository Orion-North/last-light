import test from 'node:test';
import assert from 'node:assert/strict';
import { createBriefing } from '../../src/engine/briefing.js';

test('briefing holds while paused and bounds a resumed frame after interruption', () => {
  const briefing = createBriefing();
  for(let i=0;i<20;i++) briefing.step(.1);
  const before = briefing.step(0);
  for(let i=0;i<100;i++) assert.deepEqual(briefing.step(100, true), before);
  assert.ok(briefing.step(100).progress - before.progress < .012);
  assert.equal(briefing.step(NaN).complete, false);
  let frame;
  for(let i=0;i<150;i++) frame=briefing.step(.1);
  assert.deepEqual(frame, {progress:1,beat:2,complete:true});
});
