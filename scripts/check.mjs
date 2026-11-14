import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { scenes, sources } from '../src/content/story.js';
const root = fileURLToPath(new URL('../', import.meta.url));
async function files(dir) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  return (await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();
}
const sourceFiles = [...await files('src'), ...await files('scripts'), ...await files('tests')].filter(f=>/\.(js|mjs)$/.test(f));
for(const file of sourceFiles) {
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  assert.equal(result.status,0,`${file}: ${result.stderr}`);
}
assert.equal(new Set(scenes.map(s=>s.id)).size,scenes.length);
assert.equal(scenes.filter(s=>s.end).length,1);
assert.equal(scenes.at(-1).end,true);
for(const scene of scenes) {
  assert.ok(!scene.receiptMode || ['reply','partial','silence','archive'].includes(scene.receiptMode),`${scene.id}: receiptMode`);
  for(const [field,max] of Object.entries({subtitle:18,objective:8,discovery:24,response:18})) {
    assert.ok(scene[field]?.trim(),`${scene.id}: ${field}`);
    assert.ok(scene[field].trim().split(/\s+/).length<=max,`${scene.id}: ${field} too long`);
  }
  for(const choice of scene.choices) {
    assert.ok(choice.shortLabel?.trim() && choice.shortLabel.trim().split(/\s+/).length<=5);
    assert.ok(choice.shortReply?.trim() && choice.shortReply.trim().split(/\s+/).length<=18);
  }
  assert.ok(scene.text && scene.title && scene.observation?.text,scene.id);
  assert.ok(sources.some(s=>s.id===scene.observation.sourceId),scene.id);
  assert.ok(scene.end || scene.choices.length>=2,scene.id);
  assert.equal(new Set(scene.choices.map(c=>c.id)).size,scene.choices.length,scene.id);
  assert.ok(scene.power>=0 && scene.power<=100 && scene.signal>=0 && scene.signal<=100,scene.id);
}
const model=await readFile(path.join(root,'public/models/opportunity.glb'));
assert.equal(model.subarray(0,4).toString(),'glTF');
assert.equal(model.readUInt32LE(8),model.length);
const jsonLength=model.readUInt32LE(12);
const modelData=JSON.parse(model.subarray(20,20+jsonLength).toString());
assert.ok(modelData.images?.length>=1,'NASA model textures required');
assert.ok(!modelData.buffers.some(b=>b.uri),'Model must have no external buffers');
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const [,url] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await stat(path.join(root,url));
await stat(path.join(root,'vendor/three/LICENSE'));
console.log(`PASS: ${sourceFiles.length} JS syntax checks; ${scenes.length} scene contracts; local entry assets; NASA GLB (${modelData.images.length} textures); vendor license.`);
