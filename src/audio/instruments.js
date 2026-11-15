// Original, deterministic stereo instruments. Sustains use periodic ensembles,
// so a voice needs one buffer source rather than a bank of live oscillators.
const TAU = Math.PI * 2;
const SUSTAIN = new Set(['organ', 'strings', 'string', 'pad', 'bass']);
const FAMILIES = new Set([...SUSTAIN, 'pulse', 'pluck', 'glass', 'reed']);
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;

export function synthesizeInstrument(timbre, note, sampleRate = 24000) {
  timbre = FAMILIES.has(timbre) ? timbre : 'pluck';
  sampleRate = Math.round(clamp(finite(sampleRate, 24000), 8000, 24000));
  note = clamp(finite(note, 60), 24, 96);
  const frequency = 440 * 2 ** ((note - 69) / 12);
  const loop = SUSTAIN.has(timbre);
  // Fit complete fundamental cycles; all ensemble offsets and modulation then
  // occupy integer bins. The loop boundary has no phase discontinuity.
  const seconds = loop ? Math.round(frequency * 2.35) / frequency : 2.4;
  const length = Math.round(seconds * sampleRate);
  const channels = [new Float32Array(length), new Float32Array(length)];
  const fundamentalBin = Math.round(frequency * length / sampleRate);
  const harmonics = timbre === 'organ' ? [1, .48, .32, .12, .1, .065, .04, .035]
    : timbre === 'bass' ? [1, .36, .14, .07]
      : timbre === 'pad' ? [1, .25, .14, .07, .03]
        : timbre === 'glass' ? [1, .5, .23]
          : timbre === 'reed' ? [1, .12, .4, .06, .2, .03, .08]
            : timbre === 'pluck' ? [1, .48, .23, .13, .06]
              : timbre === 'pulse' ? [1, .38, .2, .1, .05]
                : [1, .65, .43, .31, .2, .14, .1, .065];
  const ensemble = ['strings', 'string', 'pad', 'organ'].includes(timbre) ? 3 : 1;
  for (let channel = 0; channel < 2; channel++) {
    for (let player = 0; player < ensemble; player++) {
      harmonics.forEach((amplitude, index) => {
        const harmonic = index + 1;
        const ratio = timbre === 'glass' ? [1, 2.756, 5.404][index] : harmonic;
        const offset = player === 0 ? 0 : (player === 1 ? -1 : 1);
        const bin = loop ? fundamentalBin * harmonic + offset : frequency * ratio * length / sampleRate;
        if (bin * sampleRate / length >= sampleRate * .44) return;
        const phase = .37 * index + .83 * player + channel * (.11 + player * .29);
        // A carrier and two quiet sidebands provide periodic spectral breathing.
        for (let sideband = -1; sideband <= 1; sideband++) {
          const weight = sideband === 0 ? 1 : (loop ? .065 : 0);
          if (!weight) continue;
          const step = TAU * (bin + sideband * (index % 2 + 1)) / length;
          const cosine = Math.cos(step), sine = Math.sin(step);
          let x = Math.cos(phase), y = Math.sin(phase);
          const level = amplitude * weight / ensemble;
          const decay = loop ? 1 : Math.exp(-(timbre === 'glass' ? 1.4 + index * .8 : timbre === 'reed' ? 1.1 + index * .3 : 2.8 + index * 1.3) / sampleRate);
          let envelope = 1;
          for (let i = 0; i < length; i++) {
            channels[channel][i] += y * level * envelope;
            const next = x * cosine - y * sine;
            y = y * cosine + x * sine;
            x = next;
            envelope *= decay;
          }
        }
      });
    }
  }
  let peak = 0;
  for (const channel of channels) {
    for (let i = 0; i < length; i++) {
      if (!loop) channel[i] *= Math.min(1, i / (sampleRate * (timbre === 'reed' ? .08 : .006))) * Math.min(1, (length - 1 - i) / (sampleRate * .12));
      peak = Math.max(peak, Math.abs(channel[i]));
    }
  }
  const scale = .82 / Math.max(.82, peak);
  for (const channel of channels) for (let i = 0; i < length; i++) channel[i] *= scale;
  return { channels, sampleRate, loop, loopStart: 0, loopEnd: length / sampleRate };
}

export function createInstrumentBank(context) {
  const cache = new Map();
  let generated = 0;
  let warmTimer = null;
  let warmGeneration = 0;
  function cancelWarm() {
    warmGeneration++;
    if (warmTimer !== null) clearTimeout(warmTimer);
    warmTimer = null;
  }
  function get(timbre, note) {
    const key = `${timbre}:${note}`;
    if (cache.has(key)) {
      const value = cache.get(key);
      cache.delete(key); cache.set(key, value);
      return value;
    }
    const audio = synthesizeInstrument(timbre, note, context.sampleRate);
    const buffer = context.createBuffer(2, audio.channels[0].length, audio.sampleRate);
    audio.channels.forEach((channel, index) => buffer.getChannelData(index).set(channel));
    const value = { buffer, ...audio, channels: undefined };
    cache.set(key, value); generated++;
    if (cache.size > 48) cache.delete(cache.keys().next().value);
    return value;
  }
  return {
    play(event, when, output) {
      const timbre = FAMILIES.has(event.instrument) ? event.instrument : 'pluck';
      const audio = get(timbre, clamp(finite(event.note, 60), 24, 96));
      const source = context.createBufferSource();
      const gain = context.createGain();
      // Sources and automation can straddle a fractional output frame. Silence
      // the unscheduled baseline too, rather than exposing GainNode's unity
      // default for the first frame of a later chord.
      gain.gain.value = 0;
      const nodes = [source, gain];
      source.buffer = audio.buffer;
      source.loop = audio.loop;
      source.loopStart = audio.loopStart; source.loopEnd = audio.loopEnd;
      const start = Math.max(context.currentTime, finite(when, context.currentTime));
      const duration = clamp(finite(event.duration, 1), .08, 24);
      const attack = Math.min(duration * .25, ({ organ: .14, strings: .38, string: .38, pad: .55, bass: .025, reed: .08 })[timbre] || .008);
      const release = Math.min(duration * .4, audio.loop ? .8 : .25);
      const volume = clamp(finite(event.volume, .1), 0, .3);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + attack);
      gain.gain.setValueAtTime(volume, start + duration - release);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      source.connect(gain);
      if (context.createStereoPanner && Number.isFinite(event.pan)) {
        const pan = context.createStereoPanner();
        pan.pan.value = clamp(event.pan, -.7, .7);
        gain.connect(pan); pan.connect(output); nodes.push(pan);
      } else gain.connect(output);
      source.start(start); source.stop(start + duration + .015);
      return { sources: [source], nodes };
    },
    // Yield between distinct buffers so first use can warm during a scene's
    // breath without synthesizing a whole chord in the scheduler callback.
    prepare(events) {
      cancelWarm();
      const generation = warmGeneration;
      const unique = new Map();
      for (const event of events) {
        const timbre = FAMILIES.has(event.instrument) ? event.instrument : 'pluck';
        const note = clamp(finite(event.note, 60), 24, 96);
        const key = `${timbre}:${note}`;
        if (!cache.has(key)) unique.set(key, [timbre, note]);
      }
      // A preparation can never thrash more than the entire bounded cache.
      const pending = [...unique.values()].slice(0, 48);
      function step() {
        warmTimer = null;
        if (generation !== warmGeneration || !pending.length) return;
        get(...pending.shift());
        if (pending.length) warmTimer = setTimeout(step, 0);
      }
      if (pending.length) warmTimer = setTimeout(step, 0);
    },
    clear() { cancelWarm(); cache.clear(); },
    stats() { return { buffers: cache.size, generated, maxBuffers: 48, maxSampleRate: 24000 }; },
  };
}
