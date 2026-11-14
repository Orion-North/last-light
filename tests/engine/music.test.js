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
      value: 0, target: null,
      cancelScheduledValues() {},
      setTargetAtTime(value) { this.target = value; },
      setValueAtTime(value) { this.target = value; },
      linearRampToValueAtTime(value) { this.target = value; },
      exponentialRampToValueAtTime(value) { this.target = value; },
    };
  }

  function node(kind) {
    const result = {
      kind, connections: [],
      gain: parameter(), pan: parameter(), frequency: parameter(), Q: parameter(),
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

test('score starts on demand and schedules non-silent musical buffers through one scheduler', async () => {
  await withMusic(async (sound, h) => {
    assert.equal(h.contexts.length, 0, 'construction does not request browser audio');
    assert.equal(h.timers.size, 0);
    assert.deepEqual(await Promise.all([sound.start(), sound.start()]), [true, true]);
    h.advance(5);
    assert.equal(h.contexts.length, 1);
    assert.equal(h.timers.size, 1);
    const musicalBuffers = h.notes().filter(source => source.kind === 'buffer');
    assert.ok(musicalBuffers.length > 1, 'music contains a phrase, not only looping wind');
    assert.ok(musicalBuffers.some(source => source.buffer.getChannelData(0).some(sample => Math.abs(sample) > 0.01)), 'synthesized instruments contain non-zero samples');
    assert.ok(h.notes().some(source => source.kind === 'oscillator'), 'the opening supports its melody with a sustained layer');
    await sound.start();
    await sound.resume();
    h.advance(30);
    assert.equal(h.timers.size, 1, 'repeat start/resume never adds overlapping schedulers');
  });
});

test('mute, pause, and hidden tabs cancel current/future notes and resume without backlog', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(4);
    const gates = [
      { stop: () => sound.setMuted(true), resume: () => sound.setMuted(false) },
      { stop: () => sound.pause(), resume: () => sound.resume() },
      { stop: () => h.setHidden(true), resume: () => h.setHidden(false) },
    ];
    for (const gate of gates) {
      gate.stop();
      h.assertCanceled();
      h.assertAmbienceSilent();
      const before = h.notes().length;
      sound.cue('transmit');
      h.advance(35);
      assert.equal(h.notes().length, before, 'no notes/cues emit while inactive');
      await gate.resume();
      assert.equal(h.notes().length, before, 'resume does not immediately dump a backlog');
      h.advance(3);
      assert.ok(h.notes().length > before, 'music resumes with a new phrase');
      assert.equal(h.timers.size, 1);
    }
  });
});

test('both narrative silences remove music and ambience, then remembrance restores the score', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    for (const scene of [7, 10]) {
      sound.setScene('night');
      sound.setNarrative(scene, 'observe');
      h.advance(3);
      sound.setNarrative(scene, 'received');
      h.assertCanceled();
      h.assertAmbienceSilent();
      const before = h.notes().length;
      sound.cue('received');
      h.advance(40);
      assert.equal(h.notes().length, before, `scene ${scene} preserves the silence`);
    }
    const beforeReturn = h.notes().length;
    sound.setScene('dawn');
    sound.setNarrative(11, 'complete');
    h.advance(5);
    assert.ok(h.notes().length > beforeReturn, 'the epilogue returns musical material');
    assert.equal(h.timers.size, 1);
    sound.destroy();
    sound.destroy();
    h.assertCanceled();
    assert.equal(h.listeners.size, 0, 'visibility listener is removed');
    assert.equal(h.contexts[0].state, 'closed');
    const beforeDestroy = h.notes().length;
    h.advance(40);
    assert.equal(h.notes().length, beforeDestroy);
    assert.equal(await sound.start(), false);
  });
});


test('activity uses a fixed graph, stops on stale input, and investigation suppresses driving', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(source => source.kind === 'oscillator' && source.stopped === undefined);
    const motorGain = motor.connections[0].connections[0];
    const before = h.sources.length;
    for (let i = 0; i < 100; i += 1) sound.setActivity({ moving: true, speed: 0.8, roughness: 0.7 });
    assert.equal(h.sources.length, before, 'terrain updates never allocate sources');
    assert.ok(motorGain.gain.target > 0);
    sound.setActivity({ moving: true, speed: 1, investigating: true });
    assert.equal(motorGain.gain.target, 0);
    sound.setActivity({ moving: true, speed: 1 });
    h.advance(1);
    assert.equal(motorGain.gain.target, 0, 'lost input cannot leave a running motor');
    sound.setActivity({ moving: true, speed: 1 });
    sound.pause();
    assert.equal(motorGain.gain.target, 0);
  });
});

test('interaction cues distinguish investigation, transmission, and an Earth reply', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const pitches = kind => {
      const before = h.sources.length;
      sound.cue(kind);
      return h.sources.slice(before).map(source => source.frequency.value);
    };
    assert.equal(pitches('investigate').length, 2);
    const charged = pitches('charged');
    assert.equal(charged.length, 2);
    const sent = pitches('transmit');
    assert.ok(sent.at(-1) > sent[0], 'departure rises away');
    assert.ok(Math.max(...charged) < Math.max(...sent));
    const reply = pitches('received');
    assert.equal(sent.length, 3);
    assert.equal(reply.length, 3, 'a distinct cue is not suppressed by another cue type');
    assert.ok(Math.max(...reply) < Math.max(...sent), 'Earth reply is a warmer lower-register answer');
    assert.deepEqual(pitches('received'), [], 'duplicate feedback is bounded');
  });
});

test('long exploration alternates orchestration and includes audible breathing room', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(30);
    const before = h.notes().length;
    h.advance(7);
    const solo = h.notes().slice(before);
    assert.ok(solo.length > 0);
    assert.ok(solo.every(source => source.kind === 'buffer'), 'second statement leaves the sustained layer out');
    h.advance(9);
    const resting = h.notes().length;
    h.advance(15);
    assert.equal(h.notes().length, resting, 'long composed rest avoids a constant loop');
    h.advance(8);
    assert.ok(h.notes().length > resting, 'next variation returns after the rest');
  });
});


test('contact alignment reuses the motor graph and cleans up on silence and destroy', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(source => source.kind === 'oscillator' && source.stopped === undefined);
    const gain = motor.connections[0].connections[0];
    const grit = h.sources.filter(source => source.loop)[1];
    const gritGain = grit.connections[0].connections[0];
    const count = h.sources.length;
    sound.setActivity({ contactActive: true, contactQuality: 0.5 });
    assert.equal(motor.frequency.target, 165);
    assert.ok(gritGain.gain.target > 0);
    sound.setActivity({ contactActive: true, contactQuality: 4 });
    assert.equal(motor.frequency.target, 220, 'pressure clamps before pitch mapping');
    assert.ok(gain.gain.target > 0.06);
    assert.equal(gritGain.gain.target, 0, 'clear alignment removes radio grit');
    assert.equal(h.sources.length, count);
    sound.setNarrative(7, 'received');
    assert.equal(gain.gain.target, 0);
    h.assertAmbienceSilent();
    sound.destroy();
    assert.ok(h.sources.every(source => source.stopped <= h.contexts[0].currentTime), 'persistent activity sources also stop on teardown');
  });
});


test('charged contact settles once while held, resets, and stops on stale input', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(source => source.kind === 'oscillator' && source.stopped === undefined);
    const gain = motor.connections[0].connections[0];
    const count = h.sources.length;
    const hold = () => sound.setActivity({ contactActive: true, contactQuality: 1, contactCharged: true });
    hold();
    assert.ok(gain.gain.target > 0);
    h.advance(0.4);
    hold();
    const settling = gain.gain.target;
    assert.ok(settling > 0 && settling < 0.025);
    h.advance(0.4);
    hold();
    assert.equal(gain.gain.target, 0, 'held updates never restart the charged tail');
    assert.equal(h.sources.filter(source => source.stopped === undefined).length, count, 'holds allocate no persistent voices');
    sound.setActivity({ contactActive: true, contactQuality: 0.5 });
    assert.ok(gain.gain.target > settling);
    hold();
    assert.equal(gain.gain.target, 0.025, 'fresh charge has a finite settle');
    sound.setActivity({});
    assert.equal(gain.gain.target, 0, 'replacement activity clears contact');
    hold();
    h.advance(1);
    assert.equal(gain.gain.target, 0, 'stale input goes silent');
  });
});

test('charged and departure transients are finite and canceled by pause', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const before = h.sources.length;
    sound.cue('charged');
    sound.cue('transmit');
    const transients = h.sources.slice(before);
    assert.equal(transients.length, 5);
    assert.ok(transients.every(source => source.stopped - source.started < 0.4));
    sound.pause();
    h.assertCanceled();
    const pausedCount = h.sources.length;
    sound.cue('charged');
    assert.equal(h.sources.length, pausedCount);
  });
});


test('final hold compression builds late at fixed trigger pressure without adding voices', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(source => source.kind === 'oscillator' && source.stopped === undefined);
    const gain = motor.connections[0].connections[0];
    const count = h.sources.length;
    const compress = charge => sound.setActivity({ contactActive: true, contactQuality: 1, contactCharge: charge });
    compress(0);
    const initial = gain.gain.target;
    const initialPitch = motor.frequency.target;
    compress(0.5);
    const middle = gain.gain.target;
    compress(1);
    const final = gain.gain.target;
    assert.ok(middle > initial);
    assert.ok(final - middle > middle - initial, 'the final compression gets most of the swell');
    assert.ok(motor.frequency.target > initialPitch);
    assert.ok(final < 0.1, 'compression remains bounded before master volume');
    compress(99);
    assert.equal(gain.gain.target, final, 'charge progress clamps');
    sound.setActivity({ contactActive: true, contactQuality: 1 });
    assert.equal(gain.gain.target, initial, 'omitted charge resets under replacement semantics');
    sound.setActivity({ contactActive: true, contactQuality: 1, contactCharge: 1, contactCharged: true });
    assert.equal(gain.gain.target, 0.025, 'charge arrival immediately releases the pressure swell');
    assert.equal(h.sources.length, count);
  });
});
