import test from 'node:test';
import assert from 'node:assert/strict';
import {renderGeologyPanel} from '../../src/ui/geology-panel.js';
const targets=[{id:'a',label:'Bedrock'},{id:'b',label:'Grains'}];
test('pending samples disclose no invented reading and comparison waits for compare stage',()=>{
 const pending=renderGeologyPanel({stage:'sample',targets,samples:[{id:'a',reading:'Lower signal'}]});
 assert.match(pending,/Lower signal/);assert.match(pending,/Awaiting reading/);assert.doesNotMatch(pending,/data-action="compare-samples"/);
 const ready=renderGeologyPanel({stage:'compare',targets,samples:targets.map(t=>({...t,reading:'Reading'}))},true);
 assert.match(ready,/data-action="compare-samples"/);assert.match(ready,/not instrument telemetry/);
});
test('keyboard tool guidance is usable and external text escaped',()=>{
 const html=renderGeologyPanel({stage:'brush',hint:'Hold R2 <brush>',coverage:.2,progress:.4});
 assert.match(html,/Hold Space &lt;brush&gt;/);assert.match(html,/Hold to brush/);assert.match(html,/Brush progress · 40%/);
});
