import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqueeze } from '../../src/engine/squeeze.js';

const release = s => s.sample({left:0,right:0});
function charge(s) {
  let result;
  for(let i=0;i<11;i++) {
    result=s.sample({left:1,right:1},.05);
    assert.equal(result.commit,false);
  }
  assert.equal(result.stage,'charged');
  return result;
}

test('held entry and synthetic neutral cannot arm; charged memory waits for a real release',()=>{
  const s=createSqueeze();
  for(let i=0;i<30;i++)assert.equal(s.sample({left:1,right:1},.05).stage,'release');
  s.sample({left:0,right:0,actualSample:false});
  assert.equal(s.sample({left:1,right:1},5).stage,'release');
  release(s);charge(s);
  for(let i=0;i<100;i++)assert.equal(s.sample({left:1,right:1},.05).commit,false);
  assert.equal(s.sample({left:0,right:1},.05).stage,'charged');
  assert.equal(s.sample({left:1,right:0},.05).commit,false);
  const sent=release(s);
  assert.equal(sent.commit,true);assert.equal(sent.stage,'latched');
  assert.equal(release(s).commit,false);
});

test('one trigger cannot charge and releasing early cancels settling without penalty',()=>{
  const s=createSqueeze();release(s);
  for(let i=0;i<30;i++)assert.equal(s.sample({left:1,right:0},.05).charge,0);
  for(let i=0;i<10;i++)assert.equal(s.sample({left:1,right:1},.05).stage,'pressing');
  assert.equal(release(s).commit,false);
  for(let i=0;i<10;i++)assert.equal(s.sample({left:1,right:1},.05).stage,'pressing');
  assert.equal(s.sample({left:.4,right:.4},.05).charge,0);
  charge(s);assert.equal(release(s).commit,true);
});

test('detents occur once per attempt, charge cue once, and frame deltas are bounded',()=>{
  const s=createSqueeze();release(s);
  assert.equal(s.sample({left:.4,right:.4},.01).cue,'tension');
  assert.equal(s.sample({left:.5,right:.5},.01).cue,null);
  assert.equal(s.sample({left:.9,right:.9},.01).cue,'lock');
  assert.equal(s.sample({left:.9,right:.9},.01).cue,null);
  assert.equal(charge(s).cue,'charged');
  assert.equal(s.sample({left:1,right:1},.05).cue,null);
  s.reset();release(s);
  assert.equal(s.sample({left:1,right:1},100).stage,'pressing');
  assert.ok(s.sample({left:1,right:1},NaN).charge<.1);
  s.reset();release(s);assert.equal(charge(s).cue,'charged');
});

test('pause, malformed input, and synthetic release cancel a charged send',()=>{
  for(const interrupt of [s=>s.reset(),s=>s.sample({left:0,right:0,actualSample:false}),s=>s.sample({left:NaN,right:1}),s=>s.sample({left:-1,right:0})]) {
    const s=createSqueeze();release(s);charge(s);interrupt(s);
    assert.equal(s.sample({left:1,right:1},.05).stage,'release');
    assert.equal(release(s).commit,false);
    charge(s);assert.equal(release(s).commit,true);
  }
});
