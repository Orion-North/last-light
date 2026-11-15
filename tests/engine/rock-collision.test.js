import test from 'node:test';
import assert from 'node:assert/strict';
import {poseBlocked,sweepRover,clearRoverPose,clearCamera} from '../../src/engine/rock-collision.js';
const footprint={halfWidth:.7,halfLength:1.25};
const rock={minX:.9,maxX:1.4,minY:0,maxY:1,minZ:-.4,maxZ:.4};
test('full footprint catches turning a long deck corner into a nearby rock',()=>{
  const from={x:0,z:0,heading:0};
  assert.equal(poseBlocked(from,[rock],footprint),false);
  assert.equal(poseBlocked({...from,heading:Math.PI/2},[rock],footprint),true);
  const result=sweepRover(from,{...from,heading:Math.PI/2},[rock],footprint);
  assert.equal(result.blocked,true);assert.ok(result.heading<Math.PI/2);
  assert.equal(poseBlocked(result,[rock],footprint),false);
});
test('swept movement cannot pass through a thin obstacle between endpoints',()=>{
  const slab={minX:-2,maxX:2,minY:0,maxY:1,minZ:2,maxZ:2.05};
  const result=sweepRover({x:0,z:0,heading:0},{x:0,z:5,heading:0},[slab],footprint);
  assert.equal(result.blocked,true);assert.ok(result.z+footprint.halfLength<=2);
  const back=sweepRover(result,{...result,z:result.z-.2},[slab],footprint);
  assert.equal(back.blocked,false);assert.ok(back.z<result.z);
});
test('restored embedded saves find nearby clear ground and valid saves stay unchanged',()=>{
  const embedded={x:1,z:0,heading:.3};
  const fixed=clearRoverPose(embedded,[rock],footprint);
  assert.ok(fixed);assert.equal(poseBlocked(fixed,[rock],footprint),false);
  assert.ok(Math.hypot(fixed.x-embedded.x,fixed.z-embedded.z)<2);
  assert.deepEqual(clearRoverPose({x:-4,z:0,heading:0},[rock],footprint),{x:-4,z:0,heading:0});
});
test('map boundary contains the footprint, not just its center',()=>{
  assert.equal(poseBlocked({x:18.5,z:0,heading:0},[],footprint),true);
  assert.equal(poseBlocked({x:16,z:0,heading:0},[],footprint),false);
});
test('camera tether stops ahead of a rock with near-plane clearance',()=>{
  const b={minX:-1,maxX:1,minY:0,maxY:3,minZ:2,maxZ:3};
  const camera=clearCamera({x:0,y:1,z:0},{x:0,y:1,z:5},[b],.3);
  assert.ok(camera.z<1.7);assert.ok(camera.z>1.6);
});
test('camera height clears low rubble without unnecessary zooming',()=>{
  const b={minX:-1,maxX:1,minY:0,maxY:.3,minZ:2,maxZ:3};
  const desired={x:0,y:2,z:5};assert.deepEqual(clearCamera({x:0,y:1,z:0},desired,[b]),desired);
});
test('inspection target inside its subject keeps an external camera usable',()=>{
  const b={minX:-1,maxX:1,minY:0,maxY:1,minZ:-1,maxZ:1};
  const desired={x:0,y:3,z:2};assert.deepEqual(clearCamera({x:0,y:.5,z:0},desired,[b]),desired);
  assert.ok(clearCamera({x:0,y:.5,z:0},{x:0,y:.6,z:.5},[b]).y>1.24);
});

test('terrain lift cannot place the camera into an uphill rock',()=>{
  const b={minX:-1,maxX:1,minY:2,maxY:4,minZ:3,maxZ:6};
  const camera=clearCamera({x:0,y:0,z:0},{x:0,y:0,z:5},[b],.3,()=>2);
  assert.ok(camera.y>4.3);
});
