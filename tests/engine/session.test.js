import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, transition } from '../../src/engine/game.js';
import { scenes, sources } from '../../src/content/story.js';
import { restoreSession, serializeSession, restoreCheckpoint } from '../../src/session.js';

const interactiveScenes = scenes.filter(scene => !scene.end);
const finalIndex = scenes.length - 1;

function playScene(state, choiceId) {
  let next = transition(state, { type: 'OBSERVE' }, scenes);
  next = transition(next, { type: 'CHOOSE', choiceId }, scenes);
  next = transition(next, { type: 'TRANSMIT' }, scenes);
  return transition(next, { type: 'NEXT' }, scenes);
}

function completedState() {
  return interactiveScenes.reduce(
    (state, scene) => playScene(state, scene.choices[0].id), createState(),
  );
}

test('the real story is a complete three-act sequence with source-backed observations', () => {
  assert.equal(scenes.length, 12);
  assert.equal(interactiveScenes.length, 11);
  assert.deepEqual([...new Set(scenes.map(scene => scene.act))], [1, 2, 3]);
  assert.equal(new Set(scenes.map(scene => scene.id)).size, scenes.length);
  assert.equal(scenes[finalIndex].end, true);
  assert.equal(scenes.slice(0, finalIndex).some(scene => scene.end), false);
  const sourceIds = new Set(sources.map(source => source.id));
  assert.equal(sourceIds.size, sources.length);
  for (const scene of scenes) {
    assert.ok(scene.text.trim(), `${scene.id}: narrative exists`);
    assert.ok(scene.observation?.text.trim(), `${scene.id}: observation exists`);
    assert.ok(sourceIds.has(scene.observation.sourceId), `${scene.id}: real source ID`);
    assert.ok(scene.power >= 0 && scene.power <= 100, `${scene.id}: power bounds`);
    assert.ok(scene.signal >= 0 && scene.signal <= 100, `${scene.id}: signal bounds`);
    if (scene.end) continue;
    assert.equal(scene.choices.length, 2, `${scene.id}: two meaningful choices`);
    assert.equal(new Set(scene.choices.map(choice => choice.id)).size, 2);
    assert.notDeepEqual(scene.choices[0].memory, scene.choices[1].memory);
    for (const choice of scene.choices) {
      assert.ok(choice.memory.title.trim() && choice.memory.text.trim());
      assert.ok(choice.reply.trim());
    }
  }
});

test('all 2,048 real-story paths reach the same historical end with unique complete archives', () => {
  const archives = new Set();
  const totalPaths = 2 ** interactiveScenes.length;
  assert.equal(totalPaths, 2048);
  for (let path = 0; path < totalPaths; path++) {
    let state = createState();
    const expected = [];
    for (const [index, scene] of interactiveScenes.entries()) {
      const choice = scene.choices[(path >>> index) & 1];
      expected.push({
        sceneId: scene.id,
        choiceId: choice.id,
        title: choice.memory.title,
        text: choice.memory.text,
      });
      state = playScene(state, choice.id);
      assert.equal(state.memories.length, index + 1, `path ${path}: exactly one memory per scene`);
    }
    assert.equal(state.complete, true, `path ${path} completes`);
    assert.equal(state.phase, 'complete');
    assert.equal(state.sceneIndex, finalIndex);
    assert.equal(state.selected, null);
    assert.deepEqual(state.memories, expected, `path ${path}: selected memories preserved`);
    assert.equal(new Set(state.memories.map(memory => memory.sceneId)).size, 11);
    const archive = JSON.stringify(state.memories);
    assert.equal(archives.has(archive), false, `path ${path}: archive is distinct`);
    archives.add(archive);
    assert.deepEqual(restoreSession(serializeSession(state), scenes), state);
  }
  assert.equal(archives.size, 2048);
});

test('save and restore preserve every phase in every scene for both choice alternatives', () => {
  for (const branch of [0, 1]) {
    let state = createState();
    const verify = label => {
      assert.deepEqual(restoreSession(serializeSession(state), scenes), state, label);
      const paused = transition(state, { type: 'PAUSE' }, scenes);
      const restored = restoreSession(serializeSession(paused), scenes);
      assert.deepEqual(restored, state, `${label}: saved pause reopens as playable`);
    };
    for (const scene of interactiveScenes) {
      verify(`${scene.id}: observe`);
      state = transition(state, { type: 'OBSERVE' }, scenes);
      verify(`${scene.id}: choose`);
      state = transition(state, { type: 'CHOOSE', choiceId: scene.choices[branch].id }, scenes);
      verify(`${scene.id}: transmit`);
      state = transition(state, { type: 'TRANSMIT' }, scenes);
      verify(`${scene.id}: received`);
      state = transition(state, { type: 'NEXT' }, scenes);
    }
    verify('epilogue: complete');
  }
});

test('restoration rebuilds canonical memories rather than trusting saved text or state', () => {
  const expected = completedState();
  const stored = JSON.parse(serializeSession(expected));
  const tampered = {
    ...stored,
    memories: [{ title: 'Forged memory', text: '<script>bad</script>' }],
    paused: true,
    selected: 'invented-choice',
    complete: false,
  };
  const restored = restoreSession(JSON.stringify(tampered), scenes);
  assert.deepEqual(restored, expected);
  assert.notEqual(restored.memories, expected.memories);
});

test('invalid JSON and missing or invalid fields are rejected without throwing', () => {
  for (const raw of [null, undefined, '', '{', 'null', 'true', '42', '[]', '{}']) {
    assert.equal(restoreSession(raw, scenes), null, `reject ${String(raw)}`);
  }
  const base = { version: 1, sceneIndex: 0, phase: 'observe', choices: [] };
  const mutations = [
    { version: 0 }, { version: 2 }, { version: '1' },
    { sceneIndex: -1 }, { sceneIndex: .5 }, { sceneIndex: scenes.length },
    { sceneIndex: '0' }, { sceneIndex: null },
    { phase: 'paused' }, { phase: '' }, { phase: null },
    { choices: null }, { choices: {} }, { choices: 'horizon' },
  ];
  for (const mutation of mutations) {
    assert.equal(restoreSession(JSON.stringify({ ...base, ...mutation }), scenes), null, JSON.stringify(mutation));
  }
});

test('impossible phases, mismatched choice counts, and foreign choices are rejected', () => {
  const complete = JSON.parse(serializeSession(completedState()));
  const cases = [
    { ...complete, phase: 'observe' },
    { ...complete, phase: 'choose' },
    { ...complete, phase: 'transmit' },
    { ...complete, phase: 'received' },
    { ...complete, sceneIndex: finalIndex - 1 },
    { ...complete, choices: complete.choices.slice(0, -1) },
    { ...complete, choices: [...complete.choices, 'extra-choice'] },
    { ...complete, choices: complete.choices.map((id, index) => index === 5 ? 'invented-choice' : id) },
    { version: 1, sceneIndex: 0, phase: 'complete', choices: [] },
    { version: 1, sceneIndex: 0, phase: 'observe', choices: [scenes[0].choices[0].id] },
    { version: 1, sceneIndex: 0, phase: 'choose', choices: [scenes[0].choices[0].id] },
    { version: 1, sceneIndex: 0, phase: 'transmit', choices: [] },
    { version: 1, sceneIndex: 0, phase: 'received', choices: [] },
    { version: 1, sceneIndex: 0, phase: 'transmit', choices: [scenes[1].choices[0].id] },
    { version: 1, sceneIndex: 1, phase: 'observe', choices: [] },
  ];
  for (const value of cases) {
    assert.equal(restoreSession(JSON.stringify(value), scenes), null, `reject ${JSON.stringify(value)}`);
  }
});


test('physical checkpoints preserve arrival and survey captures without altering story state',()=>{
  let state=createState();for(const scene of scenes.slice(0,3))state=playScene(state,scene.choices[0].id);
  const checkpoint={sceneId:'marathon',position:{x:-10,z:3,heading:.4},reached:true,survey:{step:1,lastCapture:{yaw:-.35,pitch:.12}}};
  const raw=serializeSession(state,checkpoint);
  assert.deepEqual(restoreSession(raw,scenes),state);
  assert.deepEqual(restoreCheckpoint(raw,scenes),checkpoint);
  const travelling={...checkpoint,reached:false,survey:null};
  assert.equal(restoreCheckpoint(serializeSession(state,travelling),scenes).reached,false);
  assert.equal(restoreCheckpoint(serializeSession(state),scenes),null);
  for(const mutation of [{sceneId:'blueberries'},{position:{x:999,z:0,heading:0}},{position:{x:0,z:0,heading:'bad'}}]){
    const invalid=serializeSession(state,{...checkpoint,...mutation});
    assert.equal(restoreCheckpoint(invalid,scenes),null);assert.deepEqual(restoreSession(invalid,scenes),state);
  }
});

// Assisted progression is explicitly labeled, while invalid/future provenance is ignored.
const { restoreAssistedScenes } = await import('../../src/session.js');
{
  let assisted=createState();
  assisted=transition(assisted,{type:'OBSERVE'},scenes);
  assisted=transition(assisted,{type:'CHOOSE',choiceId:scenes[0].choices[0].id},scenes);
  const raw=serializeSession(assisted,null,{assistedScenes:[scenes[0].id,scenes[1].id,'unknown',scenes[0].id]});
  assert.deepEqual(restoreAssistedScenes(raw,scenes),[scenes[0].id]);
  assert.deepEqual(restoreAssistedScenes('bad',scenes),[]);
}
