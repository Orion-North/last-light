export const briefingBeats = [
  { label: 'MER-B / MARS', title: 'You are Opportunity.', cue: 'The people who sent you cannot follow. Be their eyes.' },
  { label: 'YOUR MISSION', title: 'Look for traces of water.', cue: 'Drive to the pale rocks. Study the layers they hold.' },
  { label: 'SOMEONE IS WAITING', title: 'Send a little of Mars home.', cue: 'Choose what to remember. Send it to Earth. Someone is listening.' },
];

/** Presentation time only: pausing cannot advance the story or skip a shot. */
export function createBriefing() {
  let elapsed = 0;
  return {
    step(delta, paused = false) {
      if (!paused && Number.isFinite(delta)) elapsed = Math.min(12, elapsed + Math.max(0, Math.min(.1, delta)));
      return { progress: elapsed / 12, beat: Math.min(2, Math.floor(elapsed / 4)), complete: elapsed >= 12 };
    },
  };
}
