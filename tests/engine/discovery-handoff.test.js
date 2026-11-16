import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceDiscoveryHandoff as step} from '../../src/engine/discovery-handoff.js';
test('photo reveal precedes handoff and original uplink',()=>{
 let s={stage:'revealing',elapsed:0};
 for(let i=0;i<13;i++)s=step(s,100);
 assert.equal(s.stage,'revealing');s=step(s,100);assert.equal(s.stage,'handoff');
 for(let i=0;i<6;i++)s=step(s,100);
 assert.equal(s.stage,'handoff');s=step(s,100);assert.equal(s.stage,'uplink');
});
test('pause and background stalls cannot consume a story beat',()=>{
 const s={stage:'revealing',elapsed:300};
 assert.equal(step(s,5000,{paused:true}).elapsed,300);
 assert.equal(step(s,5000).elapsed,400);
});
test('reduced motion retains ordered static beats',()=>{
 let s={stage:'revealing'};for(let i=0;i<5;i++)s=step(s,100,{reducedMotion:true});
 assert.equal(s.stage,'handoff');s=step(s,100,{reducedMotion:true});assert.equal(s.stage,'uplink');
});

test('waits briefly for the original image without trapping the player',()=>{
 let s={stage:'revealing',elapsed:0};
 for(let i=0;i<24;i++)s=step(s,100,{imageLoading:true});
 assert.equal(s.elapsed,0);assert.equal(s.imageWait,2400);
 s=step(s,100,{imageLoading:true,paused:true});assert.equal(s.imageWait,2400);
 const loaded=step(s,100);assert.equal(loaded.elapsed,100);
 for(let i=0;i<15;i++)s=step(s,100,{imageLoading:true});
 assert.equal(s.stage,'handoff');
});
