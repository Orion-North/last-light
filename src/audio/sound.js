import { SECTIONS as sections, phrase } from './score.js';

/**
 * LAST LIGHT / "Something to show them"
 * Original adaptive chamber score, synthesized locally with Web Audio.
 * No soundtrack samples, copied melodies, live AI, or network requests.
 * Composition and implementation notes: docs/SOUNDTRACK.md.
 */
export function createSound() {
  let context = null;
  let master = null;
  let musicBus = null;
  let cueDuckUntil = 0;
  let windGain = null;
  let windFilter = null;
  let windSource = null;
  let motorSource = null;
  let gritSource = null;
  let motorGain = null;
  let gritGain = null;
  let motorFilter = null;
  let activity = { moving: false, speed: 0, roughness: 0, investigating: false, contactActive: false, contactQuality: 0, contactCharge: 0, contactCharged: false };
  let activityTime = -Infinity;
  let chargedTime = -Infinity;
  let muted = false;
  let paused = false;
  let destroyed = false;
  let starting = null;
  let environment = 'dawn';
  let sceneIndex = -1;
  let phase = 'observe';
  let section = 'discovery';
  let timer = null;
  let nextPhrase = 0;
  let phraseNumber = 0;
  let queue = [];
  const lastCueTimes = new Map();
  let endPlayed = false;
  const activeVoices = new Set();
  const pianoCache = new Map();
  const doc = typeof document === 'undefined' ? null : document;
  let hidden = Boolean(doc?.hidden);
  const midi = note => 440 * Math.pow(2, (note - 69) / 12);


  function canPlay() {
    return Boolean(context && context.state === 'running' && !muted && !paused && !hidden && !destroyed);
  }

  function smooth(param, value, seconds = 0.25) {
    if (!context || !param || context.state === 'closed') return;
    param.cancelScheduledValues(context.currentTime);
    param.setTargetAtTime(value, context.currentTime, seconds);
  }

  function updateActivity() {
    if (!context || !motorGain) return;
    const fresh = context.currentTime - activityTime < 0.8;
    const audible = canPlay() && section !== 'silence' && fresh;
    const contact = audible && activity.contactActive;
    const driving = audible && activity.moving && !activity.investigating && !contact;
    const speed = driving ? activity.speed : 0;
    // Pressure raises a soft triangle's energy and register; roughness resolves as
    // the two halves meet. Charged is a finite settle, never an indefinite alarm.
    const pressure = activity.contactQuality;
    // Most compression arrives at the end of the deliberate hold, rather than
    // plateauing as soon as the triggers reach full pressure.
    const compression = activity.contactCharge ** 3;
    const chargedTail = Math.max(0, 1 - (context.currentTime - chargedTime) / 0.7);
    const contactLevel = activity.contactCharged ? 0.025 * chargedTail : 0.020 + pressure * 0.046 + compression * 0.028;
    smooth(motorGain.gain, contact ? contactLevel : speed * 0.019, contact ? 0.055 : 0.09);
    smooth(gritGain.gain, contact ? (activity.contactCharged ? 0 : pressure * (1 - pressure) * 0.040) : speed * (0.008 + activity.roughness * 0.027), 0.08);
    smooth(motorSource.frequency, contact ? (activity.contactCharged ? 220 : 110 + pressure * 110 + compression * 80) : 42 + speed * 38, 0.10);
    smooth(motorFilter.frequency, contact ? 420 + pressure * 300 + compression * 280 : 170 + speed * 110, 0.15);
  }

  function updateVolume() {
    smooth(master?.gain, canPlay() ? 0.52 : 0, canPlay() ? 0.16 : 0.006);
    updateActivity();
  }

  function disconnectVoice(voice) {
    if (!activeVoices.delete(voice)) return;
    for (const node of voice.nodes) {
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
  }

  function stopVoices() {
    for (const voice of [...activeVoices]) {
      // Stopping future sources prevents queued notes from leaking after unmute.
      for (const source of voice.sources) {
        try { source.stop(); } catch { /* Already ended or canceled. */ }
      }
      disconnectVoice(voice);
    }
  }

  function stopScheduler() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    queue = [];
    stopVoices();
  }

  function hush() {
    stopScheduler();
    updateVolume();
  }

  function selectSection() {
    if (sceneIndex === 11) return 'remembrance';
    if ((sceneIndex === 7 || sceneIndex === 10) && phase === 'received') return 'silence';
    if (environment === 'earth') return 'waiting';
    if (environment === 'night') return 'fading';
    if (environment === 'storm') return 'storm';
    if (environment === 'sunset') return 'amber';
    if (sceneIndex === 1 || sceneIndex === 2) return 'geology';
    return 'discovery';
  }

  function applySection() {
    const next = selectSection();
    const changed = next !== section;
    section = next;
    if (!context) return;
    const config = sections[section];
    updateActivity();
    smooth(windGain?.gain, config.wind, section === 'silence' ? 0.06 : 1.4);
    smooth(windFilter?.frequency, config.cutoff, 1.5);
    if (changed) {
      stopScheduler();
      phraseNumber = 0;
      // Silence is explicit rather than an almost-inaudible drone.
      if (section !== 'silence') restartScheduler(section === 'remembrance' ? 1.8 : 0.7);
    }
  }

  // A small original felt-piano/harp hybrid: damped, slightly inharmonic partials.
  // Each note has its own cached waveform, with an unobtrusive felt-like attack.
  function pianoBuffer(note, timbre = 'pluck') {
    const key = `${timbre}:${note}`;
    if (pianoCache.has(key)) return pianoCache.get(key);
    const rate = Math.min(context.sampleRate, 24000);
    const length = Math.ceil(rate * 6.5);
    const buffer = context.createBuffer(1, length, rate);
    const samples = buffer.getChannelData(0);
    const frequency = midi(note);
    const harmonics = timbre === 'reed' ? [1, .08, .23, .025, .07] : [1, .32, .13, .055, .018];
    let noise = 43 + note;
    for (let i = 0; i < length; i += 1) {
      const t = i / rate;
      const attack = 1 - Math.exp(-t * 110);
      let value = 0;
      for (let h = 1; h <= harmonics.length; h += 1) {
        const partial = frequency * h * (1 + 0.00011 * h * h);
        const decay = Math.exp(-t * (0.66 + h * 0.23));
        value += Math.sin(2 * Math.PI * partial * t) * harmonics[h - 1] * decay;
      }
      noise = (noise * 1664525 + 1013904223) >>> 0;
      const felt = (noise / 4294967296 - 0.5) * 0.045 * Math.exp(-t * 130);
      if (timbre === 'glass') {
        value = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1.3)
          + .32 * Math.sin(2 * Math.PI * frequency * 2.756 * t) * Math.exp(-t * 2.7)
          + .12 * Math.sin(2 * Math.PI * frequency * 5.404 * t) * Math.exp(-t * 4);
      }
      const onset = timbre === 'reed' ? (1 - Math.exp(-t * 9)) : attack;
      samples[i] = Math.tanh((value * onset + (timbre === 'pluck' ? felt : 0)) * .8) * .7;
    }
    pianoCache.set(key, buffer);
    return buffer;
  }

  function registerVoice(sources, nodes) {
    const voice = { sources, nodes };
    activeVoices.add(voice);
    let remaining = sources.length;
    for (const source of sources) {
      source.onended = () => {
        remaining -= 1;
        if (!remaining) disconnectVoice(voice);
      };
    }
    return voice;
  }

  function pluck(note, when, volume, duration = 5.8, timbre = 'pluck') {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = pianoBuffer(note, timbre);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.setValueAtTime(volume, when + Math.max(0.02, duration - 0.18));
    gain.gain.linearRampToValueAtTime(0, when + duration);
    const pan = context.createStereoPanner?.();
    if (pan) {
      pan.pan.value = note < 50 ? 0 : -0.14 + ((note % 5) * 0.06);
      source.connect(gain).connect(pan).connect(musicBus);
    } else source.connect(gain).connect(musicBus);
    registerVoice([source], [source, gain, ...(pan ? [pan] : [])]);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  function stringNote(note, when, volume, duration) {
    const envelope = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 680;
    filter.Q.value = 0.4;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(volume, when + 1.4);
    envelope.gain.setValueAtTime(volume * 0.8, when + Math.max(1.5, duration - 1.8));
    envelope.gain.linearRampToValueAtTime(0, when + duration);
    const pan = context.createStereoPanner?.();
    if (pan) {
      pan.pan.value = note % 2 ? 0.32 : -0.32;
      filter.connect(envelope).connect(pan).connect(musicBus);
    } else filter.connect(envelope).connect(musicBus);
    const oscillators = [0].map(detune => {
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = midi(note) * (1 + detune);
      oscillator.connect(filter);
      return oscillator;
    });
    registerVoice(oscillators, [...oscillators, filter, envelope, ...(pan ? [pan] : [])]);
    for (const oscillator of oscillators) {
      oscillator.start(when);
      oscillator.stop(when + duration + 0.03);
    }
  }

  function composePhrase(start) {
    const composed = phrase(section, phraseNumber++);
    for (const event of composed.events) {
      queue.push({ ...event, when: start + event.at * sections[section].eighth });
    }
    nextPhrase = start + composed.seconds;
  }

  function tick() {
    timer = null;
    if (!canPlay() || section === 'silence') return;
    const now = context.currentTime;
    updateActivity();
    smooth(musicBus.gain, now < cueDuckUntil || activity.contactActive && now - activityTime < .8 ? .43 : 1, .16);
    // A throttled/background tab never catches up by firing a burst of old notes.
    if (nextPhrase < now - 0.5) {
      queue = [];
      nextPhrase = now + 0.5;
    }
    if (!queue.length && nextPhrase <= now + 0.4) composePhrase(nextPhrase);
    while (queue.length && queue[0].when <= now + 0.35) {
      const event = queue.shift();
      if (event.when < now - 0.08) continue;
      if (event.instrument !== 'string') pluck(event.note, Math.max(now, event.when), event.volume, event.duration, event.instrument);
      else stringNote(event.note, Math.max(now, event.when), event.volume, event.duration);
    }
    timer = setTimeout(tick, 80);
    // Node-based lifecycle tests should not be kept alive by the browser scheduler.
    timer?.unref?.();
  }

  function restartScheduler(delay = 0.5) {
    if (!canPlay() || section === 'silence') return;
    if (timer !== null) return;
    queue = [];
    nextPhrase = context.currentTime + delay;
    tick();
  }

  function buildGraph() {
    master = context.createGain();
    master.gain.value = 0;
    musicBus = context.createGain();
    musicBus.gain.value = 1;
    musicBus.connect(master);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.025;
    compressor.release.value = 0.35;
    master.connect(compressor);
    compressor.connect(context.destination);

    const rate = Math.min(context.sampleRate, 24000);
    const buffer = context.createBuffer(1, rate * 6, rate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    let seed = 5111;
    for (let i = 0; i < samples.length; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      last = (last + 0.015 * (seed / 4294967296 * 2 - 1)) / 1.015;
      // Fade both buffer edges so a loop has no click.
      const edge = Math.min(1, i / (rate * 0.1), (samples.length - 1 - i) / (rate * 0.1));
      samples[i] = last * 3.6 * edge;
    }
    windSource = context.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;
    windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.Q.value = 0.3;
    windGain = context.createGain();
    windGain.gain.value = 0;
    windSource.connect(windFilter).connect(windGain).connect(master);
    windSource.start();
    // Two persistent sources, independent of update frequency; no per-frame voices.
    motorSource = context.createOscillator();
    motorSource.type = 'triangle';
    motorFilter = context.createBiquadFilter();
    motorFilter.type = 'lowpass';
    motorGain = context.createGain();
    motorGain.gain.value = 0;
    motorSource.connect(motorFilter).connect(motorGain).connect(master);
    motorSource.start();
    gritSource = context.createBufferSource();
    gritSource.buffer = buffer;
    gritSource.loop = true;
    const gritFilter = context.createBiquadFilter();
    gritFilter.type = 'bandpass';
    gritFilter.frequency.value = 830;
    gritFilter.Q.value = 0.7;
    gritGain = context.createGain();
    gritGain.gain.value = 0;
    gritSource.connect(gritFilter).connect(gritGain).connect(master);
    gritSource.start();
    applySection();
  }

  async function start() {
    if (destroyed) return false;
    if (starting) return starting;
    starting = (async () => {
      try {
        if (!context) {
          const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (!AudioContext) return false;
          context = new AudioContext();
          buildGraph();
        }
        if (!paused && !hidden && context.state === 'suspended') await context.resume();
        if (destroyed) return false;
        updateVolume();
        restartScheduler();
        return context.state === 'running';
      } catch {
        return false; // Music never blocks the story.
      }
    })();
    try { return await starting; } finally { starting = null; }
  }

  function cue(kind) {
    if (!canPlay() || section === 'silence') return;
    // Earth-side archive actions are never a successful rover reply.
    if (kind === 'received' && sceneIndex >= 8) return;
    if (kind === 'end') {
      if (endPlayed) return;
      endPlayed = true;
      // setNarrative(11, ...) already brings the motif back; no stacked fanfare.
      if (section === 'remembrance') return;
    }
    const now = context.currentTime;
    if (now - (lastCueTimes.get(kind) ?? -Infinity) < 0.18) return;
    lastCueTimes.set(kind, now);
    if (['charged', 'transmit', 'received', 'observe'].includes(kind)) {
      cueDuckUntil = now + (kind === 'received' ? 1.8 : .85);
      smooth(musicBus.gain, .43, .035);
    }
    const third = sections[section].minor ? 65 : 66;
    const patterns = {
      observe: [[74, 0, 0.7, 0.027]],
      investigate: [[50, 0, 0.12, 0.018], [57, 0.11, 0.2, 0.014]],
      choose: [[third, 0, 1.0, 0.035], [69, 0.13, 1.2, 0.018]],
      // A close, grounded latch; release lifts away quickly. Only a real Earth
      // response receives the slower, lower answering interval.
      charged: [[57, 0, 0.12, 0.065], [62, 0.07, 0.24, 0.042]],
      transmit: [[62, 0, 0.13, 0.070], [74, 0.07, 0.20, 0.053], [81, 0.17, 0.32, 0.033]],
      received: [[50, 0, 0.38, 0.052], [57, 0.24, 0.85, 0.045], [62, 0.49, 1.1, 0.034]],
      end: [[62, 0, 4.5, 0.040], [69, 0.65, 4, 0.023], [74, 1.4, 4, 0.015]],
    };
    for (const [note, delay, duration, volume] of patterns[kind] || []) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const when = now + delay;
      oscillator.type = kind === 'investigate' ? 'triangle' : 'sine';
      oscillator.frequency.value = midi(note);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(volume, when + Math.min(0.05, duration / 4));
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      oscillator.connect(gain).connect(master);
      registerVoice([oscillator], [oscillator, gain]);
      oscillator.start(when);
      oscillator.stop(when + duration + 0.04);
    }
  }

  function onVisibility() {
    hidden = Boolean(doc?.hidden);
    if (hidden) hush();
    else { updateVolume(); restartScheduler(0.6); }
  }
  doc?.addEventListener('visibilitychange', onVisibility);

  return {
    start,
    setMuted(value) {
      muted = Boolean(value);
      if (muted) hush();
      else { updateVolume(); restartScheduler(); }
    },
    setScene(value) {
      environment = ['dawn', 'day', 'sunset', 'storm', 'night', 'earth'].includes(value) ? value : 'dawn';
      applySection();
    },
    setNarrative(index, value = 'observe') {
      const previousIndex = sceneIndex;
      sceneIndex = Number.isInteger(index) ? index : -1;
      phase = value;
      if (sceneIndex === 0 && previousIndex !== 0) {
        endPlayed = false;
        phraseNumber = 0;
      }
      applySection();
    },
    cue,
    setActivity(value = {}) {
      const unit = number => Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
      const charged = Boolean(value.contactActive && value.contactCharged);
      if (charged && !activity.contactCharged) chargedTime = context?.currentTime ?? -Infinity;
      if (!charged) chargedTime = -Infinity;
      activity = {
        moving: Boolean(value.moving), speed: unit(value.speed), roughness: unit(value.roughness),
        investigating: Boolean(value.investigating), contactActive: Boolean(value.contactActive),
        contactQuality: unit(value.contactQuality), contactCharge: unit(value.contactCharge), contactCharged: charged,
      };
      activityTime = context?.currentTime ?? -Infinity;
      updateActivity();
    },
    pause() { paused = true; hush(); },
    async resume() {
      paused = false;
      if (!context || destroyed) return false;
      return start();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      hush();
      doc?.removeEventListener('visibilitychange', onVisibility);
      for (const source of [windSource, motorSource, gritSource]) {
        try { source?.stop(); source?.disconnect(); } catch { /* Already stopped. */ }
      }
      pianoCache.clear();
      if (context && context.state !== 'closed') context.close().catch(() => {});
    },
  };
}
