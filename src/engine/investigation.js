/** Camera evidence, not a timed score. A steady readable view completes the observation. */
export function createInvestigation() {
  let progress = 0;
  return {
    sample({ quality, steady }, seconds) {
      const dt = Math.max(0, Math.min(.2, Number.isFinite(seconds) ? seconds : 0));
      progress = Math.max(0, Math.min(1, progress + (quality >= .75 && steady ? dt / 1.25 : -dt / 3)));
      return { progress, complete: progress >= 1 };
    },
    reset() { progress = 0; },
  };
}
