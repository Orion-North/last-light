import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../src/ui/mission-photo-scene.js',import.meta.url),'utf8');
const threeUrl=new URL('../../vendor/three/three.module.js',import.meta.url).href;
const utilsSource=await readFile(new URL('../../vendor/three/addons/utils/BufferGeometryUtils.js',import.meta.url),'utf8');
const utilsUrl=`data:text/javascript;base64,${Buffer.from(utilsSource.replace("from 'three'",`from '${threeUrl}'`)).toString('base64')}`;
const valleySource=await readFile(new URL('../../src/ui/mission-valley-model.js',import.meta.url),'utf8');
const valleyUrl=`data:text/javascript;base64,${Buffer.from(valleySource.replace("from 'three'",`from '${threeUrl}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utilsUrl}'`)).toString('base64')}`;
const linked=source.replace("from 'three'",`from '${threeUrl}'`).replace("from './mission-valley-model.js'",`from '${valleyUrl}'`);
const {createMissionPhotoScene}=await import(`data:text/javascript;base64,${Buffer.from(linked).toString('base64')}`);
test('mission reference scenes switch independently, expose finite camera profiles and dispose',()=>{
 const model=createMissionPhotoScene(),ids=['first-morning','stone-ripples','blueberries','ordinary-day','last-image'];
 for(const id of ids){
  const profile=model.setScene(id);assert.ok(profile);
  for(const point of [profile.eye,profile.target])for(const axis of ['x','y','z'])assert.ok(Number.isFinite(point[axis]));
  assert.ok(profile.aspect>0 && profile.fov>0 && profile.fov<90);
  const visible=model.scene.children.filter(child=>child.isGroup && child.visible);assert.equal(visible.length,1);assert.equal(visible[0].name,`mission-photo-${id}`);
  let meshes=0;visible[0].traverse(object=>{if(!object.isMesh)return;meshes++;const p=object.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));});assert.ok(meshes>0);
 }
 const profile=model.setScene('last-image');assert.equal(profile.aspect,1);assert.equal(profile.missingDataFraction,.25);
 const last=model.scene.children.find(child=>child.name==='mission-photo-last-image');assert.equal(last.children.length,1,'last image contains sky only, with sensor mask delegated to renderer');
 assert.equal(model.setScene('unsupported'),null);model.dispose();assert.equal(model.scene.children.length,0);
});
