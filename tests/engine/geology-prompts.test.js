import test from 'node:test';
import assert from 'node:assert/strict';
import { geologyHint, renderGeologyPanel } from '../../src/ui/geology-panel.js';

test('keyboard tool guidance supports pointer drag without corrupting release instructions',()=>{
 assert.equal(geologyHint({mode:'trace'},false),'Drag along each layer · or hold Space + arrows');
 assert.equal(geologyHint({hint:'Release R2 to ready the next sample'},false),'Release Space to ready the next sample');
 assert.equal(geologyHint({hint:'Hold R2 and sweep'},true),'Hold R2 and sweep');
});
test('controller mode keeps pointer operate control mounted but hidden for seamless takeover',()=>{
 assert.match(renderGeologyPanel({stage:'brush'},true),/tool-operate" hidden/);
 assert.doesNotMatch(renderGeologyPanel({stage:'brush'},false),/tool-operate" hidden/);
});
