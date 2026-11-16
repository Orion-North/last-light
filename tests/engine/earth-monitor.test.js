import test from 'node:test';
import assert from 'node:assert/strict';
import {signalMonitorTransform} from '../../src/ui/earth-station.js';
test('original signal instrument projects onto every physical monitor corner',()=>{
 for(const corners of [[{x:100,y:80},{x:900,y:95},{x:850,y:390},{x:130,y:400}],[{x:30,y:200},{x:360,y:200},{x:360,y:280},{x:30,y:280}]]) {
  const m=signalMonitorTransform(corners);
  for(const [i,[x,y]] of [[0,0],[580,0],[580,160],[0,160]].entries()) {
   const w=m[3]*x+m[7]*y+1;
   assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/w-corners[i].x)<.0001);
   assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/w-corners[i].y)<.0001);
  }
 }
});
test('unavailable or collapsed screen geometry cannot leave a stray signal overlay',()=>{
 assert.equal(signalMonitorTransform(null),null);
 assert.equal(signalMonitorTransform(Array(4).fill({x:0,y:0})),null);
 assert.equal(signalMonitorTransform([{x:NaN,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]),null);
});
