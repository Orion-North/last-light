import test from 'node:test';
import assert from 'node:assert/strict';
import { storyLine } from '../../src/content/terminal-story.js';
import { scenes } from '../../src/content/story.js';

const scene = id => scenes.find(item => item.id === id);
const line = (id, phase, options = {}) => storyLine({scene:scene(id), phase, ...options}).text;
const phases = ['observe', 'choose', 'transmit', 'received', 'complete'];

test('tool use and departing signals suppress thoughts in every scene and phase', () => {
  for (const item of scenes) for (const phase of phases) {
    for (const flag of ['investigating', 'transmitting']) {
      assert.equal(storyLine({scene:item, phase, [flag]:true}).text, '', `${item.id}/${phase}/${flag}`);
    }
  }
});

test('post-contact, partial receipt and completed experience have no rover voice', () => {
  for (const item of scenes.filter(item => item.act === 3 || item.end)) {
    for (const phase of phases) assert.equal(storyLine({scene:item, phase}).text, '');
  }
  assert.equal(line('last-image','received'), '');
  for (const item of scenes) assert.equal(storyLine({scene:item,phase:'complete'}).text, '');
  assert.equal(storyLine({}).text, '');
});

test('skipped introduction retains mission purpose while completed introduction avoids repetition', () => {
  const cue = line('first-morning', 'observe');
  assert.ok(cue.length <= 140);
  for (const fact of ['Opportunity', 'ancient water', 'Earth']) assert.ok(cue.includes(fact));
  assert.equal(line('first-morning','observe',{purposeKnown:true}), 'What shall I show them first?');
  assert.equal(line('first-morning','received'), 'They have my first view.');
});

test('geology separates physical comparison from the single received interpretation', () => {
  for (const id of ['stone-ripples','blueberries']) {
    const result = line(id,'choose');
    assert.ok(result);
    assert.doesNotMatch(result, /water|hematite/i);
    assert.equal(line(id,'transmit'), result);
    assert.match(line(id,'received'), /water/);
  }
  assert.match(line('blueberries','choose'), /read differently/);
  assert.match(line('blueberries','received'), /Hematite/);
});

test('routine receipts are wordless and final frame does not predict the loss', () => {
  for (const id of ['marathon','ordinary-day','dust','smaller-world']) assert.equal(line(id,'received'), '');
  assert.match(line('last-image','transmit'), /Sun.*dust.*send/);
  assert.doesNotMatch(line('last-image','transmit'), /last|final|die|never|goodbye/i);
  assert.equal(line('last-image','transmit',{transmitting:true}), '');
});

test('recollection follows the actual first selection without repeating on receipt', () => {
  for (const choiceId of ['ground','horizon']) {
    const recalled = {choiceId};
    const text = line('smaller-world','choose',{recalled});
    assert.match(text, choiceId === 'ground' ? /soil beneath my wheels/ : /first crater rim/);
    assert.equal(line('smaller-world','transmit',{recalled}), text);
    assert.equal(line('smaller-world','received',{recalled}), '');
    assert.doesNotMatch(text, /storm cannot|whatever happens|already home/i);
  }
  assert.equal(line('smaller-world','observe'), '');
});

test('travel suppresses observation only, preserving restored ready and receipt states', () => {
  for (const item of scenes) assert.equal(storyLine({scene:item,phase:'observe',travelling:true}).text, '');
  for (const phase of ['choose','transmit','received']) {
    assert.equal(line('stone-ripples',phase,{travelling:true}), line('stone-ripples',phase));
  }
});
