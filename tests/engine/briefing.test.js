import test from 'node:test';
import assert from 'node:assert/strict';
import { createBriefing, briefingBeats } from '../../src/engine/briefing.js';

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

test('short passages hold their beat while paused and finish only once time elapses', () => {
  for (const [duration, beats] of [[7, 3], [3, 1]]) {
    const timeline = createBriefing({duration, beats});
    for(let i=0;i<10;i++) timeline.step(.1);
    const frozen=timeline.step(0);
    assert.deepEqual(timeline.step(20,true),frozen);
    assert.deepEqual(timeline.step(-10),frozen);
    for(let i=0;i<duration*10+1;i++) timeline.step(.1);
    assert.deepEqual(timeline.step(0),{progress:1,beat:beats-1,complete:true});
    assert.deepEqual(timeline.step(100),{progress:1,beat:beats-1,complete:true});
  }
  assert.throws(()=>createBriefing({duration:0}),RangeError);
  assert.throws(()=>createBriefing({beats:1.5}),RangeError);
});

// Each four-second shot must carry a single, readable purpose before play starts.
test('opening establishes role, first action, science question and communication purpose in three short beats', () => {
  assert.equal(briefingBeats.length, 3);
  for (const beat of briefingBeats) {
    assert.ok(beat.label && beat.title);
    assert.equal(typeof beat.cue, 'string');
    assert.ok(beat.title.split(/\s+/).length <= 7);
    assert.ok(beat.cue.split(/\s+/).length <= 12);
  }
  assert.match(briefingBeats[0].title, /Opportunity/);
  assert.match(briefingBeats[1].title, /ancient water/);
  assert.match(briefingBeats[2].title, /Earth.*first view/);
});
