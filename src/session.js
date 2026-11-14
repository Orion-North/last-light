import { createState, transition } from './engine/game.js';

/** Rebuild a save from legal actions; never trust stored state objects. */
export function restoreSession(raw, scenes) {
  try {
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Number.isInteger(saved.sceneIndex) || saved.sceneIndex < 0 || saved.sceneIndex >= scenes.length || !Array.isArray(saved.choices)) return null;
    if (!['observe', 'choose', 'transmit', 'received', 'complete'].includes(saved.phase)) return null;
    if ((saved.phase === 'complete') !== Boolean(scenes[saved.sceneIndex].end)) return null;
    const expectedChoices = saved.sceneIndex + (['transmit', 'received'].includes(saved.phase) ? 1 : 0);
    if (saved.choices.length !== expectedChoices) return null;
    let state = createState();
    for (let i = 0; i <= saved.sceneIndex; i++) {
      if (scenes[i].end) return state.complete ? state : null;
      if (i === saved.sceneIndex && saved.phase === 'observe') return state;
      state = transition(state, { type: 'OBSERVE' }, scenes);
      if (i === saved.sceneIndex && saved.phase === 'choose') return state;
      const choiceId = saved.choices[i];
      if (!scenes[i].choices.some(c => c.id === choiceId)) return null;
      state = transition(state, { type: 'CHOOSE', choiceId }, scenes);
      if (i === saved.sceneIndex && saved.phase === 'transmit') return state;
      state = transition(state, { type: 'TRANSMIT' }, scenes);
      if (i === saved.sceneIndex && saved.phase === 'received') return state;
      state = transition(state, { type: 'NEXT' }, scenes);
    }
    return state.complete ? state : null;
  } catch { return null; }
}

export function serializeSession(state) {
  return JSON.stringify({ version: 1, sceneIndex: state.sceneIndex, phase: state.phase, choices: state.memories.map(m => m.choiceId) });
}
