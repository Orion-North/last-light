export const briefingBeats = [
  { label: 'MER-B / MARS', title: 'You are Opportunity.', cue: 'The people who sent you cannot follow. Be their eyes.' },
  { label: 'YOUR MISSION', title: 'Find signs of ancient water.', cue: 'Drive to the pale rocks. Look closely at their layers.' },
  { label: 'SOMEONE IS WAITING', title: 'Send a little of Mars home.', cue: 'Choose a discovery. Send it to Earth. You are far away, but not alone.' },
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
