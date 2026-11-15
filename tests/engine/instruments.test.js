import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeInstrument, createInstrumentBank } from '../../src/audio/instruments.js';
const families = ['organ', 'strings', 'string', 'pad', 'bass', 'pulse', 'pluck', 'glass', 'reed'];

test('instrument families render finite, bounded, distinct stereo audio within memory budget', () => {
  const signatures = new Set();
  for (const family of families) {
    const audio = synthesizeInstrument(family, 57, 48000);
    assert.equal(audio.sampleRate, 24000);
    assert.equal(audio.channels.length, 2);
    assert.ok(audio.channels[0].length <= 60000);
    let energy = 0, difference = 0;
    audio.channels[0].forEach((sample, i) => {
      assert.ok(Number.isFinite(sample) && Math.abs(sample) <= .821);
      assert.ok(Number.isFinite(audio.channels[1][i]) && Math.abs(audio.channels[1][i]) <= .821);
      energy += sample * sample;
      difference += (sample - audio.channels[1][i]) ** 2;
    });
    assert.ok(energy / audio.channels[0].length > .005, `${family} has useful energy`);
    assert.ok(difference / energy > .001, `${family} has independent stereo content`);
    signatures.add(audio.channels[0][2345].toFixed(5));
    if (!audio.loop) assert.ok(audio.channels[0].at(-1) === 0);
  }
  assert.ok(signatures.size >= 8, 'string alias aside, families have distinct spectra');
});

test('sustained ensembles wrap with a normal sample step at the loop boundary', () => {
  for (const family of ['organ', 'strings', 'pad', 'bass']) {
    for (const note of [31, 62, 88]) {
      const audio = synthesizeInstrument(family, note);
      assert.equal(audio.loop, true);
      for (const channel of audio.channels) {
        let maxStep = 0;
        for (let i = 1; i < channel.length; i++) maxStep = Math.max(maxStep, Math.abs(channel[i] - channel[i - 1]));
        assert.ok(Math.abs(channel[0] - channel.at(-1)) <= maxStep * 1.01 + .00001, `${family}/${note} seamless wrap`);
      }
    }
  }
});

test('bank reuses buffers, caps LRU memory, and schedules a single finite source per voice', () => {
  let buffers = 0;
  const parameter = () => ({ events: [], setValueAtTime(...v) { this.events.push(v); }, linearRampToValueAtTime(...v) { this.events.push(v); } });
  const context = {
    sampleRate: 48000, currentTime: 2,
    createBuffer(channels, length, rate) { buffers++; return { channels, length, rate, data: Array.from({length: channels}, () => new Float32Array(length)), getChannelData(i) { return this.data[i]; } }; },
    createBufferSource() { return { connect() {}, start(t) { this.started = t; }, stop(t) { this.stopped = t; } }; },
    createGain() { return { gain: parameter(), connect() {} }; },
  };
  const bank = createInstrumentBank(context);
  const event = { instrument: 'organ', note: 55, duration: 6, volume: .04 };
  const first = bank.play(event, 0, {});
  const second = bank.play(event, 3, {});
  assert.equal(buffers, 1);
  assert.equal(first.sources[0].buffer, second.sources[0].buffer);
  assert.equal(first.sources.length, 1);
  assert.equal(first.nodes.length, 2);
  assert.equal(first.sources[0].started, 2);
  assert.equal(first.sources[0].stopped, 8.015);
  assert.equal(first.nodes[1].gain.value, 0, 'unscheduled baseline cannot leak a unity-gain onset frame');
  assert.equal(first.nodes[1].gain.events.at(-1)[0], 0);
  for (let note = 24; note < 75; note++) bank.play({ ...event, instrument: 'pulse', note }, 2, {});
  assert.equal(bank.stats().buffers, 48);
  bank.clear();
  assert.equal(bank.stats().buffers, 0);
});

test('preparation yields one unique buffer per task and replacement or clear cancels warming', () => {
  const originalSet = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
  const tasks = new Map(); let id = 0, sources = 0;
  globalThis.setTimeout = callback => { tasks.set(++id, callback); return id; };
  globalThis.clearTimeout = timer => tasks.delete(timer);
  const runTask = () => { const [key, callback] = tasks.entries().next().value; tasks.delete(key); callback(); };
  try {
    const bank = createInstrumentBank({ sampleRate: 8000, createBuffer(n, length) {
      const data = Array.from({length:n}, () => new Float32Array(length));
      return { getChannelData: i => data[i] };
    }, createBufferSource() { sources++; } });
    const events = [60,60,62,64].map(note => ({ instrument:'pad', note }));
    bank.prepare(events);
    assert.equal(bank.stats().generated, 0, 'prepare itself never blocks on synthesis');
    assert.equal(tasks.size, 1);
    runTask();
    assert.equal(bank.stats().generated, 1);
    assert.equal(tasks.size, 1);
    runTask();
    assert.equal(bank.stats().generated, 2, 'duplicate pitch warms only once');
    bank.prepare([{instrument:'bass', note:38}]);
    assert.equal(tasks.size, 1, 'replacement cancels the previous queue');
    runTask();
    assert.equal(bank.stats().generated, 3);
    assert.equal(tasks.size, 0);
    bank.prepare(events);
    bank.clear();
    assert.equal(tasks.size, 0, 'clear cancels the timer');
    assert.equal(bank.stats().buffers, 0);
    assert.equal(sources, 0, 'warming never creates voices');
    bank.prepare(Array.from({length:73}, (_,i) => ({instrument:'organ', note:24+i})));
    while (tasks.size) { assert.equal(tasks.size, 1); runTask(); }
    assert.equal(bank.stats().buffers, 48);
    assert.equal(bank.stats().generated, 51, 'one preparation caps work at cache capacity');
  } finally { globalThis.setTimeout = originalSet; globalThis.clearTimeout = originalClear; }
});
