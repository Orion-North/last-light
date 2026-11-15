export const briefingBeats = [
  { label: 'MARS · 2004', title: 'I am Opportunity.', cue: '' },
  { label: 'THE FIRST MORNING', title: 'I came to look for ancient water.', cue: '' },
  { label: 'THE FIRST MORNING', title: 'Earth is waiting for my first view.', cue: '' },
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
