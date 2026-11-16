import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceDiscoveryHandoff as step} from '../../src/engine/discovery-handoff.js';
test('photo reveal precedes handoff and original uplink',()=>{
 let s={stage:'revealing',elapsed:0};
 for(let i=0;i<8;i++)s=step(s,100);
 assert.equal(s.stage,'revealing');s=step(s,100);assert.equal(s.stage,'handoff');
 for(let i=0;i<4;i++)s=step(s,100);
 assert.equal(s.stage,'handoff');s=step(s,100);assert.equal(s.stage,'uplink');
});
test('pause and background stalls cannot consume a story beat',()=>{
 const s={stage:'revealing',elapsed:300};
 assert.equal(step(s,5000,{paused:true}).elapsed,300);
 assert.equal(step(s,5000).elapsed,550);
});
test('reduced motion retains ordered static beats',()=>{
 let s={stage:'revealing'};for(let i=0;i<4;i++)s=step(s,100,{reducedMotion:true});
 assert.equal(s.stage,'handoff');s=step(s,100,{reducedMotion:true});assert.equal(s.stage,'uplink');
});

test('waits briefly for the original image without trapping the player',()=>{
 let s={stage:'revealing',elapsed:0};
 for(let i=0;i<9;i++)s=step(s,100,{imageLoading:true});
 assert.equal(s.elapsed,0);assert.equal(s.imageWait,900);
 s=step(s,100,{imageLoading:true,paused:true});assert.equal(s.imageWait,900);
 const loaded=step(s,100);assert.equal(loaded.elapsed,100);
 for(let i=0;i<10;i++)s=step(s,100,{imageLoading:true});
 assert.equal(s.stage,'handoff');
});

test('low frame rates do not stretch the photo transition',()=>{
 let s={stage:'revealing',elapsed:0};
 for(let i=0;i<4;i++)s=step(s,250);
 assert.equal(s.stage,'handoff');
 for(let i=0;i<2;i++)s=step(s,250);
 assert.equal(s.stage,'uplink');
});
