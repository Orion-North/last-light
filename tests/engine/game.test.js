import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, transition } from '../../src/engine/game.js';
import { createSound } from '../../src/audio/sound.js';

const scenes = [0, 1, 2].map((index) => ({
  id: `scene-${index}`,
  power: 100 - index * 45,
  choices: ['a', 'b'].map((letter) => ({
    id: `${index}-${letter}`,
    memory: { title: `Memory ${index}${letter}`, text: `Remember ${letter}.` },
  })),
}));
scenes.push({ id: 'epilogue', end: true, choices: [] });

function deepFreeze(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') deepFreeze(child);
  }
  return value;
}

function playScene(state, choiceId, content = scenes) {
  let next = transition(state, { type: 'OBSERVE' }, content);
  next = transition(next, { type: 'CHOOSE', choiceId }, content);
  next = transition(next, { type: 'TRANSMIT' }, content);
  return transition(next, { type: 'NEXT' }, content);
}

test('each new session starts with an independent empty archive', () => {
  const a = createState();
  const b = createState();
  assert.deepEqual(a, {
    sceneIndex: 0, phase: 'observe', memories: [], selected: null,
    paused: false, complete: false,
  });
  assert.notEqual(a.memories, b.memories);
});

test('actions must follow observe, choose, transmit, next and reject unknown choices', () => {
  const start = createState();
  for (const type of ['CHOOSE', 'TRANSMIT', 'NEXT', 'BOGUS']) {
    assert.equal(transition(start, { type, choiceId: '0-a' }, scenes), start);
  }
  const observed = transition(start, { type: 'OBSERVE' }, scenes);
  assert.equal(observed.phase, 'choose');
  assert.equal(transition(observed, { type: 'CHOOSE', choiceId: 'wrong' }, scenes), observed);
  const chosen = transition(observed, { type: 'CHOOSE', choiceId: '0-a' }, scenes);
  assert.equal(chosen.phase, 'transmit');
  assert.equal(chosen.memories.length, 1);
  assert.equal(transition(chosen, { type: 'CHOOSE', choiceId: '0-b' }, scenes), chosen);
  assert.equal(transition(chosen, { type: 'NEXT' }, scenes), chosen);
  const received = transition(chosen, { type: 'TRANSMIT' }, scenes);
  assert.equal(received.phase, 'received');
  assert.equal(transition(received, { type: 'TRANSMIT' }, scenes), received);
});

test('all eight choice paths reach the same historical end but preserve distinct memories', () => {
  const archives = new Set();
  for (let path = 0; path < 8; path += 1) {
    let state = createState();
    for (let i = 0; i < 3; i += 1) {
      state = playScene(state, `${i}-${path & (1 << i) ? 'b' : 'a'}`);
    }
    assert.equal(state.complete, true);
    assert.equal(state.sceneIndex, 3);
    assert.equal(state.phase, 'complete');
    assert.equal(state.selected, null);
    assert.equal(state.memories.length, 3);
    archives.add(state.memories.map((item) => item.choiceId).join(','));
    assert.equal(transition(state, { type: 'NEXT' }, scenes), state);
  }
  assert.equal(archives.size, 8);
});

test('paused story ignores progression, then resumes the exact interaction', () => {
  let state = transition(createState(), { type: 'OBSERVE' }, scenes);
  state = transition(state, { type: 'PAUSE' }, scenes);
  for (const type of ['OBSERVE', 'CHOOSE', 'TRANSMIT', 'NEXT']) {
    assert.equal(transition(state, { type, choiceId: '0-a' }, scenes), state);
  }
  const resumed = transition(state, { type: 'RESUME' }, scenes);
  assert.equal(resumed.phase, 'choose');
  assert.equal(resumed.paused, false);
  assert.equal(transition(resumed, { type: 'CHOOSE', choiceId: '0-a' }, scenes).phase, 'transmit');
});

test('restart works while paused and after completion without carrying memories', () => {
  let state = createState();
  for (let i = 0; i < 3; i += 1) state = playScene(state, `${i}-b`);
  assert.deepEqual(transition(state, { type: 'RESTART' }, scenes), createState());
  state = transition(state, { type: 'PAUSE' }, scenes);
  assert.deepEqual(transition(state, { type: 'RESTART' }, scenes), createState());
});

test('transitions never mutate state or content, and archive copies content values', () => {
  const frozenContent = deepFreeze(structuredClone(scenes));
  const original = deepFreeze(createState());
  const advanced = playScene(original, '0-b', frozenContent);
  assert.equal(original.sceneIndex, 0);
  assert.equal(original.memories.length, 0);
  assert.equal(advanced.sceneIndex, 1);
  assert.deepEqual(advanced.memories[0], {
    sceneId: 'scene-0', choiceId: '0-b', title: 'Memory 0b', text: 'Remember b.',
  });
  assert.notEqual(advanced.memories[0], frozenContent[0].choices[1].memory);
});

test('incomplete content and bad actions do not crash or move beyond bounds', () => {
  const state = createState();
  assert.equal(transition(state, null, scenes), state);
  assert.equal(transition(state, {}, scenes), state);
  assert.equal(transition(state, { type: 'OBSERVE' }, []), state);
  assert.equal(transition(state, { type: 'OBSERVE' }, null), state);
  const invalidIndex = { ...state, sceneIndex: -1 };
  assert.equal(transition(invalidIndex, { type: 'OBSERVE' }, scenes), invalidIndex);
  const loneScene = [scenes[0]];
  const complete = playScene(state, '0-a', loneScene);
  assert.equal(complete.sceneIndex, 0);
  assert.equal(complete.complete, true);
});

test('restored archive cannot accumulate two memories for the same scene', () => {
  const old = {
    ...createState(), phase: 'choose',
    memories: [{ sceneId: 'scene-0', choiceId: '0-a', title: 'Old', text: 'Old' }],
  };
  const next = transition(old, { type: 'CHOOSE', choiceId: '0-b' }, scenes);
  assert.equal(next.memories.length, 1);
  assert.equal(next.memories[0].choiceId, '0-b');
});

test('absence of Web Audio is safe and destroy is idempotent', async () => {
  const sound = createSound();
  assert.equal(await sound.start(), false);
  sound.setScene('storm');
  sound.setMuted(true);
  sound.cue('transmit');
  sound.pause();
  assert.equal(await sound.resume(), false);
  sound.destroy();
  sound.destroy();
  assert.equal(await sound.start(), false);
});

test('audio starts on demand once, respects mute/pause, resumes and closes', async () => {
  const previousAudioContext = globalThis.AudioContext;
  const contexts = [];
  function parameter() {
    return {
      value: 0, targets: [],
      cancelScheduledValues() {},
      setTargetAtTime(value) { this.targets.push(value); },
      setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
    };
  }
  function node() {
    return {
      gain: parameter(), frequency: parameter(), Q: parameter(),
      threshold: parameter(), knee: parameter(), ratio: parameter(),
      attack: parameter(), release: parameter(),
      connect(destination) { return destination; }, disconnect() {},
      start() {}, stop() {},
    };
  }
  class AudioContextMock {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.destination = node();
      this.gains = [];
      this.oscillators = [];
      contexts.push(this);
    }
    createGain() { const gain = node(); this.gains.push(gain); return gain; }
    createOscillator() { const oscillator = node(); this.oscillators.push(oscillator); return oscillator; }
    createDynamicsCompressor() { return node(); }
    createBufferSource() { return node(); }
    createBiquadFilter() { return node(); }
    createBuffer(channels, size) { return { getChannelData: () => new Float32Array(size) }; }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  globalThis.AudioContext = AudioContextMock;
  try {
    const sound = createSound();
    sound.setScene('storm');
    assert.equal(contexts.length, 0, 'construction does not request audio');
    assert.deepEqual(await Promise.all([sound.start(), sound.start()]), [true, true]);
    assert.equal(contexts.length, 1);
    const context = contexts[0];
    const master = context.gains[0];
    assert.equal(master.gain.targets.at(-1), 0.52);
    sound.setMuted(true);
    assert.equal(master.gain.targets.at(-1), 0);
    const ambientVoices = context.oscillators.length;
    sound.cue('transmit');
    assert.equal(context.oscillators.length, ambientVoices);
    sound.setMuted(false);
    sound.cue('transmit');
    assert.equal(context.oscillators.length, ambientVoices + 4);
    sound.pause();
    assert.equal(master.gain.targets.at(-1), 0);
    sound.cue('observe');
    assert.equal(context.oscillators.length, ambientVoices + 4);
    assert.equal(await sound.resume(), true);
    assert.equal(master.gain.targets.at(-1), 0.52);
    assert.equal(await sound.start(), true, 'repeated start remains usable after synchronous resume');
    sound.destroy();
    assert.equal(context.state, 'closed');
    assert.equal(await sound.resume(), false);
    assert.equal(await sound.start(), false);
  } finally {
    if (previousAudioContext === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = previousAudioContext;
  }
});
