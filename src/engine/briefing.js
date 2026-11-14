export const briefingBeats = [
  { label: 'MARS · 2004', title: 'You are Opportunity.', cue: 'Ninety Martian days planned. People on Earth waiting to see through you.' },
  { label: 'YOUR MISSION', title: 'Was there water here?', cue: 'Use your cameras, brush away dust, then compare rock and grains.' },
  { label: 'EXPLORE · INVESTIGATE · SEND', title: 'Bring a little of Mars home.', cue: 'Send your discoveries. Listen for the answer coming back.' },
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
