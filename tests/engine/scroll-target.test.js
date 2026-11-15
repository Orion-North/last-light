import test from 'node:test';
import assert from 'node:assert/strict';
import {controllerScrollTarget} from '../../src/ui/scroll-target.js';
const box=(height,content)=>({clientHeight:height,scrollHeight:content});
const root=nodes=>({querySelector:selector=>nodes[selector]||null});
test('long upload receipts scroll their reading surface rather than the full-screen signal frame',()=>{
  const story=box(110,310),dock=box(390,390);
  assert.equal(controllerScrollTarget(root({'.upload-terminal > .story-shell':story,'.interaction-dock':dock})),story);
});
test('open modal takes priority over the paused game, including short modal content',()=>{
  const modal=box(500,500),story=box(110,310);
  assert.equal(controllerScrollTarget(root({'.upload-terminal > .story-shell':story}),modal),modal);
});
test('ordinary fieldwork and ending remain scrollable; fitting surfaces do not swallow scroll',()=>{
  const dock=box(250,460),ending=box(300,650);
  assert.equal(controllerScrollTarget(root({'.interaction-dock':dock})),dock);
  assert.equal(controllerScrollTarget(root({'.brief-ending':ending})),ending);
  assert.equal(controllerScrollTarget(root({'.upload-terminal > .story-shell':box(100,100),'.interaction-dock':box(390,390)})),null);
});
