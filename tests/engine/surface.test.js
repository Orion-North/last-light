import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSurface} from '../../src/input/surface.js';
const at={x:2,z:3,heading:0,speed:.8};
test('flat sand stays quiet; wheel-scale uneven ground creates texture',()=>{
  const flat=sampleSurface(()=>0,at);
  const rough=sampleSurface((x,z)=>Math.sin(z*5)*.12,at);
  assert.equal(flat.roughness,0);
  assert.ok(rough.roughness>.1);
  assert.equal(flat.speed,.8);
});
test('a smooth incline adds load without inventing roughness; blocked contact saturates load',()=>{
  const ramp=sampleSurface((x,z)=>z*.4,at);
  assert.ok(ramp.roughness<1e-12);
  assert.ok(ramp.slip>0);
  const rock=sampleSurface(()=>0,{...at,blocked:true});
  assert.equal(rock.slip,1);
  assert.equal(rock.blocked,true);
});
