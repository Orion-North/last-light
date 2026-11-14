import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqueeze } from '../../src/engine/squeeze.js';

test('held entry and synthetic neutral cannot arm; two released triggers can',()=>{
  const s=createSqueeze();
  for(let i=0;i<30;i++)assert.equal(s.sample({left:1,right:1},.05).commit,false);
  s.sample({left:0,right:0,actualSample:false});
  assert.equal(s.sample({left:1,right:1},5).stage,'release');
  s.sample({left:0,right:0});
  for(let i=0;i<6;i++)assert.equal(s.sample({left:1,right:1},.05).commit,false);
  assert.equal(s.sample({left:1,right:1},.05).commit,true);
  assert.equal(s.sample({left:1,right:1},.05).commit,false);
});

test('one trigger cannot send and releasing early cancels settling without penalty',()=>{
  const s=createSqueeze();s.sample({left:0,right:0});
  for(let i=0;i<30;i++)assert.equal(s.sample({left:1,right:0},.05).commit,false);
  for(let i=0;i<5;i++)s.sample({left:1,right:1},.05);
  assert.ok(s.sample({left:.4,right:.4},.05).progress<.5);
  for(let i=0;i<6;i++)assert.equal(s.sample({left:1,right:1},.05).commit,false);
  assert.equal(s.sample({left:1,right:1},.05).commit,true);
});

test('detents occur once per attempt and interruption requires a fresh release',()=>{
  const s=createSqueeze();s.sample({left:0,right:0});
  assert.equal(s.sample({left:.4,right:.4},.01).cue,'tension');
  assert.equal(s.sample({left:.5,right:.5},.01).cue,null);
  assert.equal(s.sample({left:.9,right:.9},.01).cue,'lock');
  assert.equal(s.sample({left:.9,right:.9},.01).cue,null);
  s.reset();assert.equal(s.sample({left:.9,right:.9},.05).stage,'release');
  s.sample({left:0,right:0});
  assert.equal(s.sample({left:1,right:1},100).commit,false);
  assert.equal(s.sample({left:NaN,right:1},.05).stage,'release');
  assert.equal(s.sample({left:1,right:1},.05).stage,'release');
});
