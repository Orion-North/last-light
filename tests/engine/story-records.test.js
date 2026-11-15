import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes, recordedChoice } from '../../src/content/story.js';
import { createState, transition } from '../../src/engine/game.js';
import { restoreSession, serializeSession } from '../../src/session.js';

test('performed observations and calls make factual automatic records without a farewell choice', () => {
  let state = createState();
  while (!state.complete) {
    const scene = scenes[state.sceneIndex];
    state = transition(state, { type: 'OBSERVE' }, scenes);
    const automatic = recordedChoice(scene, state);
    assert.equal(automatic === null, ['first-morning', 'months'].includes(scene.id));
    state = transition(state, { type: 'CHOOSE', choiceId: (automatic || scene.choices[0]).id }, scenes);
    state = restoreSession(serializeSession(state), scenes);
    assert.ok(state);
    const memory = state.memories.at(-1);
    if (scene.id === 'dust') assert.match(memory.text, /sky darkened/);
    if (scene.id === 'blueberries') assert.match(memory.text, /Brushing and comparing/);
    if (scene.id === 'earth-listens') assert.match(memory.text, /No reply returned/);
    if (scene.id === 'last-call') {
      assert.equal(memory.choiceId, 'thank-you', 'existing saved id remains compatible');
      assert.match(memory.title, /unanswered call/);
      assert.doesNotMatch(memory.text, /thank|farewell|you choose/i);
      assert.match(memory.text, /eight months.*1,000/);
    }
    state = transition(state, { type: 'TRANSMIT' }, scenes);
    state = transition(state, { type: 'NEXT' }, scenes);
  }
});

test('every legacy choice id still restores through real engine transitions', () => {
  for (let target = 0; target < scenes.length - 1; target++) {
    for (const variant of scenes[target].choices) {
      let state = createState();
      for (let index = 0; index <= target; index++) {
        state = transition(state, { type: 'OBSERVE' }, scenes);
        state = transition(state, { type: 'CHOOSE', choiceId: index === target ? variant.id : scenes[index].choices[0].id }, scenes);
        if (index < target) {
          state = transition(state, { type: 'TRANSMIT' }, scenes);
          state = transition(state, { type: 'NEXT' }, scenes);
        }
      }
      assert.deepEqual(restoreSession(serializeSession(state), scenes), state, `${scenes[target].id}/${variant.id}`);
    }
  }
});
