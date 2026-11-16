import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three/three.module.js';
import { refineLastChance, refineBerryBowl, mapLastChancePoint, inverseLastChanceFace } from '../../src/ui/world-geology-refinement.js';

test('world weathering maps every layer and solid core without touching shared field geometry', () => {
  const shared = new THREE.BoxGeometry(1, 1, 1);
  const front = new THREE.BoxGeometry(3, 1.3, .72);
  front.translate(0, .65, .18);
  const materials = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
  let compiled = 0;
  materials.forEach(material => { material.onBeforeCompile = () => compiled++; });
  const group = new THREE.Group();
  const lamina = new THREE.Mesh(front, materials[0]);
  const backing = new THREE.Mesh(shared, materials[1]);
  backing.scale.set(1.35, .65, .57);
  group.add(lamina, backing);
  const before = front.attributes.position.array.slice();
  const fieldBefore = shared.attributes.position.array.slice();
  const owned = [];
  refineLastChance({ THREE, group, materials, own: resource => { owned.push(resource); return resource; } });
  assert.notEqual(backing.geometry, shared);
  assert.deepEqual(shared.attributes.position.array, fieldBefore);
  assert.deepEqual(owned, [backing.geometry]);
  assert.equal(group.children.length, 2, 'solid host replaces the existing backing mesh');
  assert.deepEqual(backing.position.toArray(), [0, 0, 0]);
  assert.deepEqual(backing.scale.toArray(), [1, 1, 1]);
  const corePosition = backing.geometry.attributes.position;
  for (const value of corePosition.array) assert.ok(Number.isFinite(value));
  assert.ok(backing.geometry.boundingBox.max.z < .425, 'core stays behind exposed lamina faces');
  assert.ok(backing.geometry.boundingBox.min.z < -.4, 'host rock has a substantial rear body');
  assert.ok(backing.geometry.boundingBox.max.z - backing.geometry.boundingBox.min.z > .8,
    'rounded body is deeper than the shallow laminated exposure');
  assert.ok(backing.geometry.boundingBox.max.y > .9 && backing.geometry.boundingBox.max.y < 1,
    'actual crown is about thirty percent lower');
  const ray = new THREE.Raycaster();
  for (const y of [.2, .5, .8, 1.1]) {
    const mapped = mapLastChancePoint(0, y, .385);
    ray.set(new THREE.Vector3(mapped.x, mapped.y, 2), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(backing)[0];
    assert.ok(hit, `solid rock backs the lamina openings at y=${y}`);
    assert.ok(hit.point.z > .39 && hit.point.z < .425);
  }
  // Rear shaping must not move any front-cap contact: its mapped face is
  // still the same authoritative source used by forward/inverse tool picking.
  let frontCaps = 0;
  for (let i = 0; i < backing.geometry.groups[0].count; i++) {
    if (corePosition.getZ(i) < .39) continue;
    const inverse = inverseLastChanceFace(corePosition.getX(i), corePosition.getY(i));
    const expected = mapLastChancePoint(inverse.x, inverse.y, .385);
    assert.ok(Math.abs(expected.z - corePosition.getZ(i)) < .00001,
      'weathered rear leaves the front cap on its original mapped contact surface');
    frontCaps++;
  }
  assert.ok(frontCaps > 10);
  const after = front.attributes.position.array;
  for (let i = 0; i < after.length; i += 3) {
    const expected = mapLastChancePoint(before[i], before[i + 1], before[i + 2]);
    assert.ok(Math.abs(after[i] - expected.x) < .00001);
    assert.ok(Math.abs(after[i + 1] - expected.y) < .00001);
    assert.ok(Math.abs(after[i + 2] - expected.z) < .00001);
  }
  const shader = { vertexShader: '#include <begin_vertex>', fragmentShader: '#include <color_fragment>' };
  materials[0].onBeforeCompile(shader);
  assert.equal(compiled, 1, 'existing scanned/dry shader still compiles');
  assert.match(shader.fragmentShader, /vWeatherPosition/);
  const position = front.attributes.position, normal = front.attributes.normal, uv = front.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(normal.getY(i)) > .9) {
      assert.ok(Math.abs(uv.getY(i) - (position.getZ(i) * 1.35)) < .0001,
        'top surfaces sample both texture dimensions instead of stretching one row');
    }
  }
});

test('mapped tool coordinates invert and contact the same lowered physical face', () => {
  const geometry = new THREE.PlaneGeometry(2.6, 1.1, 32, 20);
  geometry.translate(0, .65, .54);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material), group = new THREE.Group();
  group.add(mesh);
  refineLastChance({ THREE, group, materials: [material] });
  const ray = new THREE.Raycaster();
  for (const x of [-1, -.5, 0, .5, 1]) for (const y of [.2, .5, .8, 1.1]) {
    const mapped = mapLastChancePoint(x, y, .54);
    const inverse = inverseLastChanceFace(mapped.x, mapped.y);
    assert.ok(Math.abs(inverse.x - x) < 1e-12 && Math.abs(inverse.y - y) < 1e-12);
    ray.set(new THREE.Vector3(mapped.x, mapped.y, 2), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(group, true)[0];
    assert.ok(hit, 'mapped contact ray hits the actual face');
    assert.ok(Math.abs(hit.point.z - mapped.z) < .0002, 'tool lift can start from the physical surface');
  }
  const front = mapLastChancePoint(0, .7, .54).z;
  const core = mapLastChancePoint(0, .7, .385).z;
  assert.ok(front - core > .05 && front - core < .06, 'relief stays shallow but laminae remain exposed');
  for (const slope of [-.19, .17]) {
    const a = mapLastChancePoint(-1, .6 - slope, .54);
    const b = mapLastChancePoint(1, .6 + slope, .54);
    assert.equal(Math.sign(b.y - a.y), Math.sign(slope), 'crossing beds retain opposite dips');
  }
});

function bowl() {
  const bowlHeight = (x, z) => .16 + .035 * Math.sin(x * 7 + z * 4);
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(3, 2, 10, 10), new THREE.MeshStandardMaterial());
  const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial(), 96);
  const group = new THREE.Group(); group.add(slab, grains);
  return { THREE, group, bowlHeight, grains, slab };
}

test('smaller mineral grains remain finite, grounded and clear of the probe patch', () => {
  const site = bowl(), second = bowl();
  const slabBefore = site.slab.geometry.attributes.position.array.slice();
  refineBerryBowl(site); refineBerryBowl(second);
  assert.deepEqual(site.slab.geometry.attributes.position.array, slabBefore,
    'brush/probe height surface is untouched');
  assert.equal(site.group.children.length, 2, 'same world meshes, no added reference set');
  assert.deepEqual(site.grains.instanceMatrix.array, second.grains.instanceMatrix.array);
  const matrix = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < site.grains.count; i++) {
    site.grains.getMatrixAt(i, matrix); matrix.decompose(p, q, s);
    for (const value of [...p.toArray(), ...s.toArray()]) assert.ok(Number.isFinite(value));
    assert.ok(s.x >= .0163 && s.x <= .0329);
    assert.ok(s.y / s.x >= .579 && s.y / s.x <= .851, 'nodules sit oblate on the host rock');
    assert.ok(Math.hypot(p.x - .5, p.z + .1024) > .38 + s.x - .001,
      `grain ${i} must not block host-rock comparison`);
    assert.ok(p.y >= site.bowlHeight(p.x, p.z));
    assert.ok(p.y - site.bowlHeight(p.x, p.z) < .029);
    assert.ok(Math.hypot(p.x / 1.48, p.z / .91) < 1.03,
      `grain ${i} lies on the slab, not outside the perimeter`);
  }
  assert.ok(site.grains.boundingSphere.radius > 0);
  assert.equal(site.grains.material.metalness, 0);
});
