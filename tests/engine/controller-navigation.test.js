import test from 'node:test';
import assert from 'node:assert/strict';
import {controllerMenuTargets,hiddenByClosedDetails} from '../../src/ui/controller-navigation.js';
// Model the browser quirk: hidden detail links still return a layout rectangle.
function element(tagName,parentElement=null) {
  const node={tagName,parentElement,children:[],open:false,hidden:false,
    closest:()=>null,getClientRects:()=>[{}],
    contains(other){for(let item=other;item;item=item.parentElement)if(item===this)return true;return false;}};
  parentElement?.children.push(node);return node;
}
function entry(parent) {
  const details=element('DETAILS',parent),summary=element('SUMMARY',details),link=element('A',details);
  return {details,summary,link};
}
test('closed journal entries skip hidden sources and navigate directly to the next summary',()=>{
  const journal=element('DIALOG'),close=element('BUTTON',journal),first=entry(journal),second=entry(journal),third=entry(journal);
  const candidates=[close,first.summary,first.link,second.summary,second.link,third.summary,third.link];
  journal.querySelectorAll=()=>candidates;
  assert.deepEqual(controllerMenuTargets(journal),[close,first.summary,second.summary,third.summary]);
  first.details.open=true;
  assert.deepEqual(controllerMenuTargets(journal),[close,first.summary,first.link,second.summary,third.summary]);
  first.details.open=false;
  assert.deepEqual(controllerMenuTargets(journal),[close,first.summary,second.summary,third.summary]);
});
test('an open nested entry stays hidden when its containing entry is collapsed',()=>{
  const outer=entry(element('DIALOG')),inner=entry(outer.details);inner.details.open=true;
  assert.equal(hiddenByClosedDetails(outer.summary),false);
  assert.equal(hiddenByClosedDetails(inner.summary),true);
  assert.equal(hiddenByClosedDetails(inner.link),true);
  outer.details.open=true;
  assert.equal(hiddenByClosedDetails(inner.link),false);
});
