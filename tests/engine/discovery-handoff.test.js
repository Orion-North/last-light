import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceDiscoveryHandoff as step,waitForDiscoveryPaint} from '../../src/engine/discovery-handoff.js';
const advance=(state,time,options)=>{while(time>0){const tick=Math.min(time,100);state=step(state,tick,options);time-=tick;}return state;};

test('captured frame holds, dissolves, then original remains readable before handoff',()=>{
 let s=advance({stage:'revealing'},700);assert.equal(s.progress,0);
 s=advance(s,350);assert.equal(s.stage,'revealing');assert.equal(s.progress,.5);
 s=advance(s,350);assert.equal(s.progress,1);
 s=advance(s,1200);assert.equal(s.stage,'revealing');assert.equal(s.progress,1);
 s=advance(s,50);assert.equal(s.stage,'handoff');assert.equal(s.progress,0);
 s=advance(s,600);assert.equal(s.stage,'handoff');
 s=advance(s,50);assert.equal(s.stage,'uplink');
});
test('pause and background stalls cannot consume the captured or original beat',()=>{
 for(const elapsed of [300,1900]){
 const s={stage:'revealing',elapsed};
 assert.equal(step(s,5000,{paused:true}).elapsed,elapsed);
 assert.equal(step(s,5000).elapsed,elapsed+250);
 }
});
test('reduced motion preserves both static images without an interpolated dissolve',()=>{
 let s=advance({stage:'revealing'},600,{reducedMotion:true});assert.equal(s.progress,0);
 s=advance(s,100,{reducedMotion:true});assert.equal(s.progress,1);
 s=advance(s,1200,{reducedMotion:true});assert.equal(s.stage,'revealing');assert.equal(s.progress,1);
 s=advance(s,50,{reducedMotion:true});assert.equal(s.stage,'handoff');
 s=advance(s,100,{reducedMotion:true});assert.equal(s.stage,'uplink');
});
test('image loading waits on the captured image, pauses, and remains bounded',()=>{
 let s=advance({stage:'revealing'},700,{imageLoading:true});assert.equal(s.elapsed,700);
 s=advance(s,900,{imageLoading:true});assert.equal(s.elapsed,700);assert.equal(s.progress,0);
 assert.equal(step(s,100,{imageLoading:true,paused:true}).imageWait,900);
 const loaded=step(s,100);assert.ok(loaded.progress>0);
 s=advance(s,6000,{imageLoading:true});assert.equal(s.stage,'uplink');
});
test('ordinary low frame rates do not stretch or skip either visible image',()=>{
 let s={stage:'revealing'};
 for(let i=0;i<6;i++)s=step(s,250);
 assert.equal(s.stage,'revealing');assert.equal(s.progress,1);
 for(let i=0;i<4;i++)s=step(s,250);
 assert.equal(s.stage,'revealing');s=step(s,150);assert.equal(s.stage,'handoff');
});
test('shutter yields a real paint boundary and canceled capture cannot proceed',async()=>{
 let frames=[],current=true,finished=false;
 const wait=waitForDiscoveryPaint(()=>current,fn=>frames.push(fn)).then(value=>{finished=value;return value;});
 frames.shift()();await Promise.resolve();assert.equal(finished,false);assert.equal(frames.length,1);
 frames.shift()();assert.equal(await wait,true);
 const canceled=waitForDiscoveryPaint(()=>current,fn=>frames.push(fn));
 current=false;frames.shift()();assert.equal(await canceled,false);assert.equal(frames.length,0);
});
