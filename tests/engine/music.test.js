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
    createConvolver() { return node('convolver'); }
    createOscillator() { const source = node('oscillator'); sources.push(source); return source; }
    createBufferSource() { const source = node('buffer'); sources.push(source); return source; }
    createBuffer(channels, length, sampleRate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { sampleRate, numberOfChannels: channels, getChannelData: channel => data[channel] };
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
    notes: () => sources.filter(source => source.started !== undefined && Number.isFinite(source.stopped)),
    assertCanceled() {
      assert.equal(timers.size, 0, 'no scheduler runs while sound is inactive');
      assert.ok(this.notes().every(source => source.stopped <= now), 'active and future notes are canceled');
    },
    assertAmbienceSilent() {
      for (const source of sources.filter(source => source.loop && !Number.isFinite(source.stopped))) {
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
    assert.ok(musicalBuffers.filter(source => source.loop).length >= 6, 'opening layers sustained harmony and bass under the melody');
    assert.ok(musicalBuffers.every(source => source.buffer.numberOfChannels === 2), 'ensemble instruments are stereo');
    assert.ok(musicalBuffers.some(source => source.started < 1), 'music enters in the first second');
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
    assert.equal(sent.length, 4);
    assert.equal(reply.length, 4, 'a distinct cue is not suppressed by another cue type');
    assert.ok(Math.max(...reply) < Math.max(...sent), 'Earth reply is a warmer lower-register answer');
    assert.deepEqual(pitches('received'), [], 'duplicate feedback is bounded');
  });
});

test('long exploration thins the ensemble while preserving harmonic support and breathing room', async () => {
  const { phrase } = await import('../../src/audio/score.js');
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(1);
    const openingLoops = h.notes().filter(s => s.loop && s.started < 1).length;
    assert.ok(openingLoops >= 4);
    const first = phrase('discovery');
    // Opening begins at .35s; finish the first phrase before its composed gap.
    const lastOnset = Math.max(...first.events.map(e => e.at)) * .48 + .35;
    h.advance(lastOnset + .5 - h.contexts[0].currentTime);
    const resting = h.notes().length;
    h.advance(3);
    assert.equal(h.notes().length, resting, 'phrase-end breath schedules no filler');
    const secondStart = .35 + first.seconds;
    h.advance(secondStart + 1 - h.contexts[0].currentTime);
    const returning = h.notes().filter(s => s.started >= secondStart - .1);
    assert.ok(returning.some(s => s.loop), 'thin return keeps harmonic support');
    assert.ok(returning.filter(s => s.loop).length < openingLoops, 'return uses fewer sustained voices');
    assert.ok(returning.some(s => !s.loop), 'home melody returns above the support');
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
    assert.equal(transients.length, 6);
    assert.ok(transients.every(source => source.stopped - source.started < 0.7));
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

test('authored chapters change musical material, not only gain or tempo', async () => {
  const { phrase, HOME } = await import('../../src/audio/score.js');
  const melody = name => phrase(name).events.filter(e => e.volume >= .06).map(e => e.note);
  assert.notDeepEqual(melody('geology'), melody('discovery'));
  assert.notDeepEqual(melody('amber'), melody('discovery'));
  assert.notDeepEqual(melody('storm'), melody('discovery'));
  assert.ok(phrase('geology').events.some(e => e.instrument === 'glass'));
  assert.ok(phrase('waiting').events.some(e => e.instrument === 'reed'));
  assert.ok(phrase('remembrance').events.some(e => e.instrument === 'glass'), 'science identity survives in ending');
  assert.deepEqual(phrase('silence').events, []);
  const waiting = phrase('waiting').events.filter(e => e.instrument === 'reed');
  assert.ok(waiting.every((e, i) => !i || e.note < waiting[i - 1].note), 'Earth recollection descends instead of answering the call');
  for (const name of ['discovery', 'geology', 'amber', 'storm', 'fading', 'waiting', 'remembrance']) {
    for (let n = 0; n < 4; n++) {
      const p = phrase(name, n);
      assert.ok(p.events.length <= 60, 'bounded cinematic orchestration');
      assert.ok(p.events.every(e => e.volume > 0 && e.duration > 0 && e.note >= 31 && e.note <= 88));
      assert.ok(p.seconds > Math.max(...p.events.map(e => e.at)) * .48);
    }
  }
  assert.deepEqual(phrase('discovery', 1).events.filter(e => e.instrument === 'pluck').map(e => [e.note, e.at]), HOME, 'thinner accompanied return preserves the exact identity');
});

test('chapter changes discard future material and Earth cannot produce a received cue', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(4);
    const former = h.notes().slice();
    sound.setNarrative(1, 'observe');
    assert.ok(former.every(s => s.stopped <= h.contexts[0].currentTime));
    h.advance(4);
    assert.ok(h.notes().length > former.length, 'geology begins after the transition breath');
    sound.setScene('earth');
    sound.setNarrative(8, 'observe');
    const before = h.sources.length;
    sound.cue('received');
    assert.equal(h.sources.length, before, 'Earth waiting does not synthesize a rover answer');
    const wind = h.sources.find(s => s.loop);
    assert.equal(wind.connections[0].connections[0].gain.target, 0, 'Earth has no Martian wind');
    h.advance(3);
    const count = h.notes().length;
    sound.setNarrative(10, 'received');
    h.advance(40);
    assert.equal(h.notes().length, count);
    h.assertCanceled();
  });
});

test('foreground cues duck score and recover without ducking the cue bus', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(3);
    const note = h.notes().find(s => s.kind === 'buffer');
    const input = note.connections[0].connections[0];
    const bus = input.connections.find(n => n.kind === 'gain' && n.gain.value === .88).connections[0];
    assert.equal(bus.gain.target, 1);
    const before = h.sources.length;
    sound.cue('transmit');
    assert.equal(bus.gain.target, 0);
    assert.notEqual(h.sources[before].connections[0].connections[0], bus, 'cue bypasses music duck');
    sound.finishTransmission('normal');
    h.advance(3);
    assert.equal(bus.gain.target, 1);
  });
});


test('learned question repeats on Earth but its expected answer stays empty', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const signal = action => {
      const before = h.sources.length;
      action();
      return h.sources.slice(before).filter(s => s.kind === 'oscillator').map(s => s.frequency.value);
    };
    const question = signal(() => sound.beginTransmission());
    assert.equal(question.length, 4);
    const answer = signal(() => sound.finishTransmission());
    assert.equal(answer.length, 4);
    assert.ok(answer.every((n, i) => !i || n < answer[i - 1]), 'answer settles down to home');
    h.advance(3);
    assert.deepEqual(signal(() => sound.beginTransmission()), question, 'early sends teach an identical melody');
    sound.finishTransmission();
    sound.setScene('earth');
    sound.setNarrative(10, 'received');
    assert.deepEqual(signal(() => sound.beginTransmission('call')), question, 'silence does not erase the human call');
    assert.deepEqual(signal(() => sound.finishTransmission('call')), []);
    const before = h.notes().length;
    h.advance(2.2);
    assert.equal(h.notes().length, before, 'the answer interval contains no replacement beep or score');
    h.assertAmbienceSilent();
    assert.deepEqual(signal(() => sound.finishTransmission('normal')), [], 'retry/result alone never invents a reply');
  });
});

test('partial question breaks before resolution and lifecycle cancellation cannot answer', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const before = h.sources.length;
    sound.beginTransmission('partial');
    assert.equal(h.sources.length - before, 3);
    const partial = h.notes().slice(-3);
    sound.finishTransmission('partial');
    assert.deepEqual(h.notes().slice(-3), partial);
    h.advance(3);
    sound.beginTransmission();
    sound.pause();
    h.assertCanceled();
    await sound.resume();
    const resumed = h.sources.length;
    sound.finishTransmission();
    assert.equal(h.sources.length, resumed, 'canceled transmission has no late receipt');
  });
});

test('tool brushing is pressure and motion bounded on the persistent graph', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    const motor = h.sources.find(s => s.kind === 'oscillator' && s.stopped === undefined);
    const gain = motor.connections[0].connections[0];
    const count = h.sources.length;
    for (let i = 0; i < 100; i++) sound.setActivity({toolActive: true, toolPressure: .8, toolMotion: .7});
    assert.equal(h.sources.length, count);
    assert.ok(gain.gain.target > 0 && gain.gain.target < .03);
    sound.setActivity({toolActive: true, toolPressure: 1, toolMotion: 0});
    assert.equal(gain.gain.target, 0, 'stationary brush cannot flood the mix');
    sound.setActivity({toolActive: true, toolPressure: 1, toolMotion: 1});
    h.advance(1);
    assert.equal(gain.gain.target, 0, 'stale tool input goes quiet');
  });
});


test('explicit transaction cancellation releases indefinite hold without producing a reply', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(3);
    sound.beginTransmission();
    const question = h.notes().slice(-4);
    sound.cancelTransmission();
    assert.ok(question.every(s => s.stopped <= h.contexts[0].currentTime));
    const count = h.sources.length;
    sound.finishTransmission();
    sound.cancelTransmission();
    assert.equal(h.sources.length, count, 'cancellation is idempotent and cannot answer');
    h.advance(3);
    assert.ok(h.sources.length > count, 'normal score returns instead of remaining in an infinite hold');
    const playing = h.notes().at(-1);
    const stop = playing.stopped;
    sound.cancelTransmission();
    assert.equal(playing.stopped, stop, 'idle cancellation does not interrupt unrelated score');
    sound.setScene('earth');
    sound.setNarrative(10, 'received');
    sound.beginTransmission('call');
    sound.cancelTransmission();
    h.assertCanceled();
    h.assertAmbienceSilent();
    const silent = h.sources.length;
    h.advance(5);
    assert.equal(h.sources.length, silent, 'cancellation respects authored silence');
  });
});

test('emotional terminal gestures remain quiet, finite and outside the radio register', async () => {
  await withMusic(async (sound,h) => {
    sound.textPulse({first:true});
    assert.equal(h.contexts.length,0,'text never activates audio');
    await sound.start();
    const shapes=[];
    for (const emotion of ['neutral','curious','hopeful','strained','reassuring','exhausted']) {
      h.advance(.25);
      const before=h.sources.length;
      sound.textPulse({first:true,character:'I',emotion});
      const [air,tone]=h.sources.slice(before);
      assert.equal(h.sources.length,before+2);
      assert.equal(air.kind,'buffer');assert.equal(tone.type,'triangle');
      assert.equal(air.started,tone.started,'no delayed answering note');
      assert.ok(tone.frequency.target<250,'vocal murmur remains below learned radio pitches');
      assert.ok(tone.stopped-tone.started<=.22);
      assert.ok(air.buffer.getChannelData(0).some(sample=>sample!==0));
      shapes.push({pitch:tone.frequency.target,duration:tone.stopped-tone.started,cutoff:air.connections[0].frequency.value});
      sound.textPulse({first:true});
      assert.equal(h.sources.length,before+2,'duplicate starts are throttled');
      h.advance(.23);
      assert.equal(air.connections.length,0);assert.equal(tone.connections.length,0);
    }
    assert.equal(new Set(shapes.map(s=>s.pitch)).size,6,'authored emotions have distinct inflections');
    assert.ok(shapes[5].duration<shapes[1].duration && shapes[5].cutoff<shapes[1].cutoff,'exhaustion conserves energy rather than adding alarm');
  });
});

test('terminal articulation respects lifecycle gates and never fills missing replies', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    for (const gate of [
      { stop: () => sound.setMuted(true), resume: () => sound.setMuted(false) },
      { stop: () => sound.pause(), resume: () => sound.resume() },
      { stop: () => h.setHidden(true), resume: () => h.setHidden(false) },
      { stop: () => { h.contexts[0].state = 'suspended'; }, resume: () => sound.start() },
    ]) {
      h.advance(.25);
      sound.textPulse({ first: true });
      const pulse = h.sources.at(-1);
      gate.stop();
      const before = h.sources.length;
      sound.textPulse({ first: true });
      assert.equal(h.sources.length, before);
      if (h.contexts[0].state === 'running') assert.ok(pulse.stopped <= h.contexts[0].currentTime);
      await gate.resume();
    }
    h.advance(.13);
    sound.beginTransmission();
    let before = h.sources.length;
    sound.textPulse({ first: true });
    assert.equal(h.sources.length, before, 'outbound motif has no text percussion');
    sound.finishTransmission();
    before = h.sources.length;
    sound.textPulse({ first: true });
    assert.equal(h.sources.length, before, 'answer window remains clear');
    sound.setNarrative(10, 'received');
    h.advance(3);
    before = h.sources.length;
    sound.textPulse({ speaker: 'earth', first: true });
    assert.equal(h.sources.length, before, 'explicit silence cannot acquire a surrogate reply');
    sound.destroy();
    sound.textPulse({ first: true });
    assert.equal(h.sources.length, before);
  });
});


test('transmission, pause and explicit silence replace reverb processors without stale tail paths', async () => {
  await withMusic(async (sound, h) => {
    await sound.start();
    h.advance(3);
    const current = () => h.nodes.filter(n => n.kind === 'convolver').at(-1);
    const assertFlushed = old => {
      assert.notEqual(current(), old, 'a fresh processor replaces the stored reverb tail');
      assert.equal(old.connections.length, 0, 'old processor cannot reach the output');
      assert.ok(!h.nodes.some(n => n.connections.includes(old)), 'no source/filter can feed the old processor');
      assert.ok(current().buffer.getChannelData(0).some(sample => sample !== 0), 'replacement retains the original room impulse');
    };
    let old = current();
    assert.ok(old.connections.length > 0, 'room is connected during ordinary music');
    sound.beginTransmission();
    assertFlushed(old);
    sound.cancelTransmission();
    h.advance(3);
    old = current();
    sound.pause();
    assertFlushed(old);
    h.assertCanceled();
    await sound.resume();
    h.advance(3);
    old = current();
    sound.setNarrative(7, 'received');
    assertFlushed(old);
    h.assertCanceled();
    h.assertAmbienceSilent();
    const silentCount = h.notes().length;
    h.advance(10);
    assert.equal(h.notes().length, silentCount, 'no new source re-excites the empty room during silence');
    sound.destroy();
    assert.equal(current().connections.length, 0, 'destroy removes the final reverb output');
  });
});

test('storm weather overtakes a darker score without swallowing the learned radio ritual', async () => {
  await withMusic(async (sound,h) => {
    await sound.start(); h.advance(3);
    const note=h.notes().find(s=>s.kind==='buffer');
    const input=note.connections[0].connections[0];
    const bus=input.connections.find(n=>n.kind==='gain' && n.gain.value===.88).connections[0];
    const tone=bus.connections[0];
    const wind=h.sources.find(s=>s.loop);
    const windLevel=wind.connections[0].connections[0].gain;
    sound.setScene('storm'); sound.setNarrative(5,'observe'); h.advance(1);
    const earlyWind=windLevel.target, earlyTone=tone.frequency.target;
    sound.setNarrative(6,'observe'); h.advance(1);
    assert.ok(windLevel.target>earlyWind*1.4,'later storm increases weather rather than the master');
    assert.ok(bus.gain.target<.6 && tone.frequency.target<earlyTone/2,'score recedes and loses brilliance');
    assert.equal(wind.buffer.numberOfChannels,2,'weather surrounds the stereo score');
    const stormWind=windLevel.target;
    const before=h.sources.length;
    sound.beginTransmission('normal');
    assert.equal(h.sources.slice(before).filter(s=>s.kind==='oscillator').length,4,'full familiar question survives');
    assert.ok(windLevel.target<stormWind*.3,'wind yields around the learned signal');
    sound.finishTransmission('normal'); h.advance(3);
    assert.ok(windLevel.target>stormWind*.7,'storm returns after the reply window');
    sound.setScene('night'); sound.setNarrative(7,'observe'); h.advance(1);
    assert.ok(bus.gain.target<.4 && windLevel.target>.4,'final light is wind-dominated');
    assert.ok(windLevel.target<=.6,'wind gain remains bounded');
    sound.setNarrative(7,'received');
    h.assertCanceled(); h.assertAmbienceSilent();
    sound.setScene('earth'); sound.setNarrative(8,'observe'); h.advance(1);
    assert.equal(windLevel.target,0,'Earth never inherits the storm');
  });
});
