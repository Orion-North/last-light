export const briefingBeats = [
  { label: 'MARS · 2004', title: 'I am Opportunity.', cue: 'They built me for ninety days. Earth waits for my first view.' },
  { label: 'THE FIRST MORNING', title: 'I came to find ancient water.', cue: 'My cameras, brush, and instruments can help me compare the rocks.' },
  { label: 'THE FIRST MORNING', title: 'I can send my discoveries home.', cue: 'Somewhere, people will see them. I will listen for their answer.' },
];

/** Presentation time only: pausing cannot advance the story or skip a shot. */
export function createBriefing({ duration = 12, beats = 3 } = {}) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isInteger(beats) || beats < 1) {
    throw new RangeError('A presentation needs a positive duration and beat count.');
  }
  let elapsed = 0;
  return {
    step(delta, paused = false) {
      if (!paused && Number.isFinite(delta)) elapsed = Math.min(duration, elapsed + Math.max(0, Math.min(.1, delta)));
      return { progress: elapsed / duration, beat: Math.min(beats - 1, Math.floor(elapsed / duration * beats)), complete: elapsed >= duration };
    },
  };
}
