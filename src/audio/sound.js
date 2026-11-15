import { createInstrumentBank } from './instruments.js';
import { createScoreSpace } from './space.js';
import { SECTIONS as sections, phrase, SIGNAL_QUESTION, SIGNAL_ANSWER, ANSWER_WINDOW } from './score.js';

/**
 * LAST LIGHT / "Something to show them"
 * Original adaptive cinematic score, synthesized locally with Web Audio.
 * No soundtrack samples, copied melodies, live AI, or network requests.
 * Composition and implementation notes: docs/SOUNDTRACK.md.
 */
export function createSound() {
  let context = null;
  let master = null;
  let musicBus = null;
  let cueDuckUntil = 0;
  let transmission = null;
  let signalHoldUntil = 0;
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
  let instruments = null;
  let scoreSpace = null;
  let textBuffer = null;
  let lastTextTime = -Infinity;
  let textPulses = 0;
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
    const tool = audible && activity.toolActive && !contact;
    const toolEnergy = tool ? activity.toolPressure * activity.toolMotion : 0;
    const driving = audible && !tool && activity.moving && !activity.investigating && !contact;
    const speed = driving ? activity.speed : 0;
    // Pressure raises a soft triangle's energy and register; roughness resolves as
    // the two halves meet. Charged is a finite settle, never an indefinite alarm.
    const pressure = activity.contactQuality;
    // Most compression arrives at the end of the deliberate hold, rather than
    // plateauing as soon as the triggers reach full pressure.
    const compression = activity.contactCharge ** 3;
    const chargedTail = Math.max(0, 1 - (context.currentTime - chargedTime) / 0.7);
    const contactLevel = activity.contactCharged ? 0.025 * chargedTail : 0.020 + pressure * 0.046 + compression * 0.028;
    smooth(motorGain.gain, contact ? contactLevel : tool ? toolEnergy * .028 : speed * 0.019, contact ? 0.055 : 0.09);
    smooth(gritGain.gain, tool ? toolEnergy * .006 : contact ? (activity.contactCharged ? 0 : pressure * (1 - pressure) * 0.040) : speed * (0.008 + activity.roughness * 0.027), 0.08);
    smooth(motorSource.frequency, contact ? (activity.contactCharged ? 220 : 110 + pressure * 110 + compression * 80) : tool ? 135 + activity.toolPressure * 65 : 42 + speed * 38, 0.10);
    smooth(motorFilter.frequency, contact ? 420 + pressure * 300 + compression * 280 : tool ? 330 + activity.toolMotion * 210 : 170 + speed * 110, 0.15);
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

  function stopVoices(group = null) {
    for (const voice of [...activeVoices]) {
      if (group !== null && voice.group !== group) continue;
      // Stopping future sources prevents queued notes from leaking after unmute.
      for (const source of voice.sources) {
        try { source.stop(); } catch { /* Already ended or canceled. */ }
      }
      disconnectVoice(voice);
    }
  }

  function stopScheduler(stopForeground = true) {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    queue = [];
    instruments?.prepare([]);
    stopVoices(stopForeground ? null : 'accompaniment');
  }

  function hush() {
    transmission = null;
    signalHoldUntil = 0;
    stopScheduler();
    scoreSpace?.clear();
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
      // Continue may change the score while Earth is still answering. Only
      // authored silence (or an explicit lifecycle stop) cuts foreground voices.
      stopScheduler(section === 'silence');
      if (section === 'silence') scoreSpace?.clear();
      phraseNumber = 0;
      // Silence is explicit rather than an almost-inaudible drone.
      if (section !== 'silence') restartScheduler(section === 'remembrance' ? 1.8 : 0.7);
    }
  }

  function registerVoice(sources, nodes, group = 'foreground') {
    const voice = { sources, nodes, group };
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
    smooth(musicBus.gain, now < signalHoldUntil ? 0 : now < cueDuckUntil || activity.contactActive && now - activityTime < .8 ? .43 : 1, .16);
    // A throttled/background tab never catches up by firing a burst of old notes.
    if (nextPhrase < now - 0.5) {
      queue = [];
      nextPhrase = now + 0.5;
    }
    if (now < signalHoldUntil) {
      queue = [];
      nextPhrase = signalHoldUntil + .5;
      timer = setTimeout(tick, 80);
      timer?.unref?.();
      return;
    }
    if (!queue.length && nextPhrase <= now + 0.4) composePhrase(nextPhrase);
    while (queue.length && queue[0].when <= now + 0.35) {
      const event = queue.shift();
      if (event.when < now - 0.08) continue;
      const voice = instruments.play(event, Math.max(now, event.when), scoreSpace.input);
      registerVoice(voice.sources, voice.nodes, 'accompaniment');
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
    instruments.prepare(phrase(section, phraseNumber).events);
    tick();
  }

  function buildGraph() {
    master = context.createGain();
    master.gain.value = 0;
    musicBus = context.createGain();
    musicBus.gain.value = 1;
    musicBus.connect(master);
    instruments = createInstrumentBank(context);
    scoreSpace = createScoreSpace(context, musicBus);
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
    if (kind === 'transmit' || kind === 'call') return beginTransmission(kind === 'call' ? 'call' : 'normal');
    if (kind === 'received') return finishTransmission('normal');
    if (!canPlay() || section === 'silence') return;
    if (kind === 'end') {
      if (endPlayed) return;
      endPlayed = true;
      // setNarrative(11, ...) already brings the motif back; no stacked fanfare.
      if (section === 'remembrance') return;
    }
    const now = context.currentTime;
    if (now - (lastCueTimes.get(kind) ?? -Infinity) < 0.18) return;
    lastCueTimes.set(kind, now);
    if (['charged', 'observe'].includes(kind)) {
      cueDuckUntil = now + .85;
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
      end: [[62, 0, 4.5, 0.040], [69, 0.65, 4, 0.023], [74, 1.4, 4, 0.015]],
    };
    for (const [note, delay, duration, volume] of patterns[kind] || []) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
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

  function playSignal(pattern) {
    const now = context.currentTime;
    for (const [note, delay, duration, volume] of pattern) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
      const when = now + delay;
      oscillator.type = 'sine';
      oscillator.frequency.value = midi(note);
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(volume, when + .035);
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      oscillator.connect(gain).connect(master);
      registerVoice([oscillator], [oscillator, gain]);
      oscillator.start(when);
      oscillator.stop(when + duration + .04);
    }
  }

  function beginTransmission(mode = 'normal') {
    if (!canPlay() || transmission) return;
    // Clear sustained accompaniment so its tail cannot fill the missing reply.
    stopVoices();
    scoreSpace?.clear();
    transmission = mode;
    signalHoldUntil = Infinity;
    smooth(musicBus.gain, 0, .025);
    const question = mode === 'partial' ? SIGNAL_QUESTION.slice(0, 3) : SIGNAL_QUESTION;
    playSignal(question);
  }

  function textPulse({ speaker = 'rover', first = false } = {}) {
    // These are local reading articulations, never radio receipts. Leave the
    // learned signal and its missing answer completely exposed, including silence.
    if (!canPlay() || section === 'silence' || transmission !== null || context.currentTime < signalHoldUntil) return;
    const now = context.currentTime;
    if (now - lastTextTime < .095) return;
    if (first) textPulses = 0;
    if (textPulses >= 16) return;
    lastTextTime = now;
    textPulses += 1;
    if (!textBuffer) {
      const rate = Math.min(context.sampleRate, 24000);
      textBuffer = context.createBuffer(1, Math.ceil(rate * .065), rate);
      const samples = textBuffer.getChannelData(0);
      let seed = 1515;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        samples[i] = seed / 4294967296 * 2 - 1;
      }
    }
    // A dry, rounded key rather than a pitched beep: Earth is softer/warmer,
    // archive records are duller still. No melody, echo, panning or answering pair.
    const colour = { rover: [1150, .030, .025], earth: [760, .038, .022], record: [440, .044, .020] }[speaker]
      || [1150, .030, .025];
    const [cutoff, tail, level] = colour;
    const duration = tail + (first ? .012 : 0);
    const source = context.createBufferSource();
    source.buffer = textBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = .35;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level * (first ? 1 : .7), now + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    gain.gain.setValueAtTime(0, now + duration + .002);
    source.connect(filter).connect(gain).connect(master);
    registerVoice([source], [source, filter, gain]);
    source.start(now);
    source.stop(now + duration + .003);
  }

  function cancelTransmission() {
    if (transmission === null && (!context || signalHoldUntil <= context.currentTime)) return;
    transmission = null;
    signalHoldUntil = 0;
    stopScheduler();
    smooth(musicBus?.gain, 1, .12);
    restartScheduler(.6);
  }

  function finishTransmission(mode = 'normal') {
    if (!canPlay() || transmission === null) return;
    const sent = transmission;
    transmission = null;
    signalHoldUntil = context.currentTime + ANSWER_WINDOW;
    queue = [];
    nextPhrase = signalHoldUntil + .5;
    smooth(musicBus.gain, 0, .025);
    if (mode === 'normal' && sent === 'normal' && sceneIndex < 8 && sceneIndex !== 7 && section !== 'silence') {
      playSignal(SIGNAL_ANSWER);
    }
    restartScheduler();
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
    textPulse,
    beginTransmission,
    finishTransmission,
    cancelTransmission,
    setActivity(value = {}) {
      const unit = number => Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
      const charged = Boolean(value.contactActive && value.contactCharged);
      if (charged && !activity.contactCharged) chargedTime = context?.currentTime ?? -Infinity;
      if (!charged) chargedTime = -Infinity;
      activity = {
        moving: Boolean(value.moving), speed: unit(value.speed), roughness: unit(value.roughness),
        investigating: Boolean(value.investigating), contactActive: Boolean(value.contactActive),
        toolActive: Boolean(value.toolActive), toolPressure: unit(value.toolPressure), toolMotion: unit(value.toolMotion),
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
      instruments?.clear();
      scoreSpace?.destroy();
      textBuffer = null;
      if (context && context.state !== 'closed') context.close().catch(() => {});
    },
  };
}
