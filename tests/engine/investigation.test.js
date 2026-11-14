import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvestigation } from '../../src/engine/investigation.js';
import { currentObjective, inputMode } from '../../src/ui/objectives.js';
test('investigation needs a genuinely steady readable view, with bounded elapsed time', () => {
  const probe = createInvestigation();
  assert.equal(probe.sample({quality:1,steady:false},10).progress,0);
  assert.equal(probe.sample({quality:0,steady:true},.2).progress,0);
  assert.equal(probe.sample({quality:1,steady:true},100).complete,false);
  for(let i=0;i<6;i++) probe.sample({quality:1,steady:true},.2);
  assert.equal(probe.sample({quality:1,steady:true},.2).complete,true);
  probe.reset();
  assert.equal(probe.sample({quality:1,steady:true},0).progress,0);
});
test('controller drive is restricted to traversal; modal always takes precedence', () => {
  for(const phase of ['choose','transmit','received']) assert.equal(inputMode({screen:'game',phase,travelling:true}),'menu');
  assert.equal(inputMode({screen:'game',phase:'observe',travelling:true}),'drive');
  assert.equal(inputMode({screen:'game',investigating:true}),'inspect');
  assert.equal(inputMode({screen:'game',investigating:true,modal:true}),'menu');
});
test('destination, choice and Earth viewpoint each have concrete objectives', () => {
  assert.equal(currentObjective({phase:'observe',scene:{},goal:{label:'Berry Bowl'},reached:false}),'Drive to Berry Bowl');
  assert.equal(currentObjective({phase:'choose',scene:{}}),'Choose what to remember');
  assert.equal(currentObjective({phase:'transmit',scene:{signal:0}}),'Call Opportunity from Earth');
});
