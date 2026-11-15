// A shared, bounded stereo room for the score. Foreground radio and tools bypass
// it; the complete dry/wet return sits upstream of the narrative silence gate.
export function createScoreSpace(context, output) {
  const input = context.createGain();
  const dry = context.createGain();
  dry.gain.value = .88;
  input.connect(dry).connect(output);
  let convolver = null;
  let filter = null;
  let wet = null;
  let impulse = null;
  let disposed = false;
  if (context.createConvolver) {
    // AudioBuffer sample rate must match the convolution context's rate.
    const rate = context.sampleRate;
    impulse = context.createBuffer(2, Math.ceil(rate * 2.6), rate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      let seed = 1809 + channel * 719, previous = 0;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        previous = .65 * previous + .35 * (seed / 4294967296 * 2 - 1);
        const t = i / rate;
        samples[i] = t < .027 ? 0 : previous * Math.exp(-t * 2.7) * Math.min(1, (t - .027) * 45) * Math.min(1, (2.6 - t) * 20);
      }
    }
    filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 3200; filter.Q.value = .3;
    wet = context.createGain(); wet.gain.value = .22;
    input.connect(filter); wet.connect(output);
  }
  function clear() {
    if (!impulse || disposed) return;
    // Replacing the processor flushes its internal tail. Merely lowering wet
    // gain would let an old harmony reappear when the signal hold ends.
    filter.disconnect();
    convolver?.disconnect();
    convolver = context.createConvolver();
    convolver.buffer = impulse;
    filter.connect(convolver).connect(wet);
  }
  clear();
  return {
    input, clear,
    destroy() {
      disposed = true;
      for (const node of [input, dry, filter, convolver, wet]) node?.disconnect();
      impulse = null;
    },
  };
}
