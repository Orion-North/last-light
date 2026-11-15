import test from 'node:test';
import assert from 'node:assert/strict';
import {componentHulls,poseBlocked,sweepRover,clearRoverPose,clearCamera} from '../../src/engine/rock-collision.js';
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
test('open ground near the original exploration edge remains drivable and turnable',()=>{
  assert.equal(poseBlocked({x:18.5,z:0,heading:0},[],footprint),false);
  assert.equal(poseBlocked({x:18.5,z:0,heading:Math.PI/2},[],footprint),false);
  assert.equal(poseBlocked({x:19.1,z:0,heading:0},[],footprint),true);
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

test('a rock outline leaves its empty bounding-box corner drivable',()=>{
  const diamond={minX:0,maxX:2,minY:0,maxY:1,minZ:0,maxZ:2,hull:[{x:1,z:0},{x:2,z:1},{x:1,z:2},{x:0,z:1}]};
  const small={halfWidth:.1,halfLength:.1};
  assert.equal(poseBlocked({x:.15,z:.15,heading:0},[diamond],small),false);
  assert.equal(poseBlocked({x:.6,z:.6,heading:0},[diamond],small),true);
});
test('low rock passes beneath raised solar panels but still blocks real wheel/body contact',()=>{
  const rect=(w,l)=>[{x:-w,z:-l},{x:w,z:-l},{x:w,z:l},{x:-w,z:l}];
  const rover={parts:[{minY:0,maxY:.55,hull:rect(.6,.8)},{minY:.65,maxY:.72,hull:rect(1.2,1.1)}]};
  const low={minX:.8,maxX:1,minY:0,maxY:.3,minZ:-.1,maxZ:.1};
  const pose={x:0,z:0,heading:0};
  assert.equal(poseBlocked(pose,[low],rover),false);
  assert.equal(poseBlocked(pose,[{...low,maxY:.8}],rover),true);
  assert.equal(poseBlocked({...pose,x:.3},[low],rover),true);
});
test('holding reverse and a blocked turn still permits escape',()=>{
  const from={x:0,z:0,heading:0},to={x:0,z:-.2,heading:Math.PI/2};
  const result=sweepRover(from,to,[rock],footprint);
  assert.ok(result.z<=-.19);
  assert.equal(poseBlocked(result,[rock],footprint),false);
});

test('disconnected imported parts do not fill the clear gap between wheel assemblies',()=>{
  const points=[{x:-1,y:0,z:-1},{x:-.7,y:0,z:-1},{x:-.7,y:.4,z:1},{x:-1,y:.4,z:1},
    {x:.7,y:0,z:-1},{x:1,y:0,z:-1},{x:1,y:.4,z:1},{x:.7,y:.4,z:1}];
  const children=componentHulls(points,[0,1,2,0,2,3,4,5,6,4,6,7]);
  assert.equal(children.length,2);
  const rover={parts:[{minY:0,maxY:.5,hull:[{x:-1,z:-1},{x:1,z:-1},{x:1,z:1},{x:-1,z:1}],children}]};
  const center={minX:-.1,maxX:.1,minY:0,maxY:.3,minZ:-.1,maxZ:.1};
  assert.equal(poseBlocked({x:0,z:0,heading:0},[center],rover),false);
  assert.equal(poseBlocked({x:.8,z:0,heading:0},[center],rover),true);
});
