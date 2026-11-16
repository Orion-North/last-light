import test from 'node:test';
import assert from 'node:assert/strict';
import { createSound } from '../../src/audio/sound.js';

/** A deterministic clock and observable Web Audio graph, not an audio renderer. */
function musicHarness() {
  let now = 0;
  let nextTimerId = 0;
  const timers = new Map();
  const sources = [];
  const nodes = [];
  const contexts = [];
  const listeners = new Map();
  const keys = ['setTimeout', 'clearTimeout', 'AudioContext', 'document'];
  const originals = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));

  function parameter() {
    return {
      value: 0, target: null, events: [],
      cancelScheduledValues() {},
      setTargetAtTime(value) { this.target = value; },
      setValueAtTime(value) { this.target = value; },
      linearRampToValueAtTime(value) { this.target = value; this.events.push(value); },
      exponentialRampToValueAtTime(value) { this.target = value; },
    };
  }

  function node(kind) {
    const result = {
      kind, connections: [],
      gain: parameter(), pan: parameter(), frequency: parameter(), Q: parameter(), playbackRate: parameter(),
      threshold: parameter(), knee: parameter(), ratio: parameter(),
      attack: parameter(), release: parameter(),
      connect(destination) { this.connections.push(destination); return destination; },
      disconnect() { this.connections = []; },
      start(when = now) { this.started = when; },
      stop(when = now) { this.stopped = when; },
    };
    nodes.push(result);
    return result;
  }

  class AudioContextMock {
    constructor() {
      this.state = 'suspended';
      this.sampleRate = 8000;
      this.destination = node('destination');
      contexts.push(this);
    }
    get currentTime() { return now; }
    createGain() { return node('gain'); }
    createBiquadFilter() { return node('filter'); }
    createStereoPanner() { return node('panner'); }
    createDynamicsCompressor() { return node('compressor'); }
    createOscillator() { const source = node('oscillator'); sources.push(source); return source; }
    createBufferSource() { const source = node('buffer'); sources.push(source); return source; }
    createBuffer(channels, length, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { sampleRate, getChannelData: channel => data[channel] };
    }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }

  const documentMock = {
    hidden: false,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
  globalThis.AudioContext = AudioContextMock;
  globalThis.document = documentMock;
  globalThis.setTimeout = (callback, milliseconds) => {
    const id = ++nextTimerId;
    timers.set(id, { callback, when: now + milliseconds / 1000 });
    return id;
  };
  globalThis.clearTimeout = id => timers.delete(id);

  function finishSources() {
    for (const source of sources) {
      if (!source.ended && source.stopped <= now) {
        source.ended = true;
        source.onended?.();
      }
    }
  }

  function advance(seconds) {
    const until = now + seconds;
    let callbacks = 0;
    while (true) {
      const next = [...timers.entries()].sort((a, b) => a[1].when - b[1].when)[0];
      if (!next || next[1].when > until) break;
      assert.ok(++callbacks < 10000, 'scheduler must not enter an immediate timer loop');
      now = next[1].when;
      timers.delete(next[0]);
      next[1].callback();
      finishSources();
    }
    now = until;
    finishSources();
  }

  function hasSilentGain(node, seen = new Set()) {
    if (seen.has(node)) return false;
    seen.add(node);
    if (node.kind === 'gain' && (node.gain.target ?? node.gain.value) === 0) return true;
    return node.connections.some(next => hasSilentGain(next, seen));
  }

  return {
    sources, nodes, timers, contexts, listeners, advance,
    notes: () => sources.filter(source => !source.loop && source.started !== undefined && source.stopped !== undefined),
    assertCanceled() {
      assert.equal(timers.size, 0, 'no scheduler runs while sound is inactive');
      assert.ok(this.notes().every(source => source.stopped <= now), 'active and future notes are canceled');
    },
    assertAmbienceSilent() {
      for (const source of sources.filter(source => source.loop)) {
        assert.ok(source.stopped <= now || hasSilentGain(source), 'looping ambience must also be muted');
      }
    },
    setHidden(value) {
      documentMock.hidden = value;
      listeners.get('visibilitychange')?.();
    },
    restore() {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

async function withMusic(run) {
  const harness = musicHarness();
  let sound;
  try {
    sound = createSound();
    await run(sound, harness);
  } finally {
    sound?.destroy();
    harness.restore();
  }
}

test('tool pitch responds to pressure in an audible register without allocating voices', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(source => source.kind === 'oscillator');
    const gain = motor.connections[0].connections[0];
    const count = h.sources.length;
    sound.setActivity({ toolActive: true, toolPressure: .2, toolMotion: .8 });
    const low = motor.frequency.target;
    const soft = gain.gain.target;
    sound.setActivity({ toolActive: true, toolPressure: 1, toolMotion: .8 });
    assert.ok(low >= 135 && motor.frequency.target <= 200);
    assert.ok(motor.frequency.target > low, 'pressure raises pitch, not only gain');
    assert.ok(gain.gain.target > soft);
    assert.equal(h.sources.length, count, 'tool updates reuse the fixed graph');
    sound.setActivity({ toolActive: true, toolPressure: 1, toolMotion: 0 });
    assert.equal(gain.gain.target, 0, 'stationary tool is quiet');
    sound.setActivity({ toolActive: true, toolPressure: 1, toolMotion: 1 });
    h.advance(1);
    assert.equal(gain.gain.target, 0, 'stale tool input is quiet');
  });
});

test('immediate Continue preserves the complete Earth answer across score sections', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    sound.setNarrative(0, 'received');
    h.advance(3);
    const accompaniment = h.notes().slice();
    sound.beginTransmission();
    assert.ok(accompaniment.every(source => source.stopped <= h.contexts[0].currentTime));
    const before = h.sources.length;
    sound.finishTransmission();
    const answer = h.sources.slice(before);
    assert.equal(answer.length, 4);
    const endings = answer.map(source => source.stopped);
    sound.setNarrative(1, 'travel');
    sound.setScene('day');
    assert.deepEqual(answer.map(source => source.stopped), endings, 'Continue leaves scheduled answer tails intact');
    assert.ok(answer.every(source => source.connections.length > 0));
    h.advance(3);
    assert.ok(answer.every(source => source.connections.length === 0), 'finished answer voices release their graph');
    assert.equal(h.timers.size, 1, 'the next section retains a single scheduler');
  });
});

test('mute, pause and visibility cancel foreground tails without deferred replies', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    for (const gate of [
      { stop: () => sound.setMuted(true), resume: () => sound.setMuted(false) },
      { stop: () => sound.pause(), resume: () => sound.resume() },
      { stop: () => h.setHidden(true), resume: () => h.setHidden(false) },
    ]) {
      sound.beginTransmission();
      const before = h.sources.length;
      sound.finishTransmission();
      const answer = h.sources.slice(before);
      assert.equal(answer.length, 4);
      sound.setNarrative(1, 'travel');
      gate.stop();
      h.assertCanceled();
      assert.ok(answer.every(source => source.connections.length === 0));
      await gate.resume();
      const count = h.sources.length;
      sound.finishTransmission();
      assert.equal(h.sources.length, count, 'resuming cannot fabricate a late receipt');
    }
  });
});

test('partial and recovery signals leave the authored answer window empty', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    for (const [index, mode, notes] of [[7, 'partial', 3], [10, 'call', 4]]) {
      sound.setNarrative(index, 'received');
      const before = h.sources.length;
      sound.beginTransmission(mode);
      assert.equal(h.sources.length - before, notes);
      const afterQuestion = h.sources.length;
      sound.finishTransmission(mode);
      sound.finishTransmission();
      sound.textPulse({ first: true });
      h.advance(2.2);
      assert.equal(h.sources.length, afterQuestion, 'no answer, text pulse, or score fills the missing reply');
      h.assertAmbienceSilent();
    }
  });
});


test('terminal articulation varies gently, continues long thoughts and never catches up', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const before = h.sources.length;
    sound.textPulse({ first: true, character: 'I', index: 0 });
    const opening = h.sources.slice(before);
    assert.equal(opening.length, 2, 'one key and one gentle phrase-start voice');
    assert.ok(opening.every(source => source.stopped - source.started <= .08));
    assert.ok(opening[1].connections[0].gain.events[0] <= .006);
    const firstKey = opening[0];
    const firstCutoff = firstKey.connections[0].frequency.value;
    const afterOpening = h.sources.length;
    sound.textPulse({ character: 'x', index: 1 });
    sound.textPulse({ character: 'y', index: 2 });
    assert.equal(h.sources.length, afterOpening, 'same-frame characters never create a burst');
    h.advance(.07);
    sound.textPulse({ character: 'a', index: 3 });
    const nextKey = h.sources.at(-1);
    assert.equal(h.sources.length, afterOpening + 1, 'ordinary characters have no pitched voice');
    assert.notEqual(nextKey.playbackRate.value, firstKey.playbackRate.value);
    assert.notEqual(nextKey.connections[0].frequency.value, firstCutoff);
    for (let i = 4; i < 30; i++) { h.advance(.07); sound.textPulse({ character: 'e', index: i }); }
    const count = h.sources.length;
    h.advance(.07); sound.textPulse({ character: ' ', index: 30 });
    assert.equal(h.sources.length, count, 'spaces stay silent');
    assert.equal(h.sources.filter(source => source.buffer === firstKey.buffer).length, 28, 'later words remain articulated beyond the old sixteen-key limit');
    h.advance(.07);
    sound.textPulse({ character: ',', index: 31, punctuation: true });
    const punctuation = h.sources.at(-1);
    assert.ok(punctuation.connections[0].connections[0].gain.events[0] < .025 * .7, 'punctuation is softer than an ordinary key');
  });
});

test('terminal keys respect inactive audio and resume without deferred characters', async () => {
  await withMusic(async (sound, h) => {
    sound.textPulse({ first: true, character: 'A' });
    assert.equal(h.sources.length, 0, 'typing cannot unlock audio');
    await sound.start();
    for (const gate of [
      { stop: () => sound.setMuted(true), resume: () => sound.setMuted(false) },
      { stop: () => sound.pause(), resume: () => sound.resume() },
      { stop: () => h.setHidden(true), resume: () => h.setHidden(false) },
      { stop: () => { h.contexts[0].state = 'suspended'; }, resume: () => sound.start() },
    ]) {
      h.advance(.1); sound.textPulse({ first: true, character: 'A' });
      gate.stop();
      const count = h.sources.length;
      for (let i = 0; i < 5; i++) sound.textPulse({ first: i === 0, character: 'B', index: i });
      assert.equal(h.sources.length, count);
      await gate.resume();
      assert.equal(h.sources.length, count, 'resume cannot replay skipped characters');
      h.advance(.1);
      sound.textPulse({ character: 'C', index: 8 });
      assert.equal(h.sources.length, count + 1, 'only a newly revealed character speaks');
    }
  });
});
