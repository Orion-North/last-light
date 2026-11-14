import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes } from '../../src/content/story.js';
import { createState, transition } from '../../src/engine/game.js';
import { restoreSession, serializeSession } from '../../src/session.js';
import { discoveredScenes, transmissionProfile, endingMemories } from '../../src/ui/experience.js';

test('journal unlocks after observation and stays unlocked across save/resume and later scenes', () => {
  let state = createState();
  assert.deepEqual(discoveredScenes(state, scenes), []);
  state = transition(state, { type: 'OBSERVE' }, scenes);
  assert.deepEqual(discoveredScenes(state, scenes).map(s => s.id), [scenes[0].id]);
  state = restoreSession(serializeSession(state), scenes);
  assert.equal(discoveredScenes(state, scenes).length, 1);
  for (const action of [{ type: 'CHOOSE', choiceId: scenes[0].choices[0].id }, { type: 'TRANSMIT' }, { type: 'NEXT' }]) {
    state = transition(state, action, scenes);
  }
  assert.equal(state.sceneIndex, 1);
  assert.deepEqual(discoveredScenes(state, scenes).map(s => s.id), [scenes[0].id]);
});

test('last image is partial, recovery calls unanswered, archive does not simulate a new transmission', () => {
  const profile = id => transmissionProfile(scenes.find(s => s.id === id));
  assert.equal(profile('first-morning').mode, 'reply');
  assert.equal(profile('last-image').mode, 'partial');
  assert.equal(profile('earth-listens').mode, 'silence');
  assert.equal(profile('last-call').mode, 'silence');
  assert.equal(profile('months').mode, 'archive');
  assert.equal(profile('months').delay, 0);
  assert.ok(profile('earth-listens').delay > profile('first-morning').delay);
  assert.equal(profile('first-morning').effort, 0);
  assert.ok(profile('last-image').effort > .9);
  assert.equal(profile('last-call').effort, 1);
  assert.equal(profile('months').effort, 0);
});

test('ending recalls chosen memories, including the last choice, without duplicating short archives', () => {
  const memories = Array.from({length: 11}, (_, index) => ({ title: `Choice ${index}` }));
  assert.deepEqual(endingMemories(memories), [memories[0], memories[1], memories[2], memories[10]]);
  assert.deepEqual(endingMemories(memories.slice(0, 2)), memories.slice(0, 2));
  assert.deepEqual(endingMemories([]), []);
});
