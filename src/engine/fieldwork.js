/** Relative camera angles in radians. These authored observations are not telemetry. */
export const surveyProfiles = {
  marathon: { title: 'Survey the journey', steps: [
    { yaw: -.35, pitch: .12, hint: 'Look left across the ground: the journey behind you.' },
    { yaw: .35, pitch: -.08, hint: 'Look right toward the horizon: another question ahead.' },
  ] },
  'ordinary-day': { title: 'Notice an ordinary day', steps: [
    { yaw: -.3, pitch: .12, hint: 'Look left toward the valley floor.' },
    { yaw: 0, pitch: .22, hint: 'Look down at the ground beside your wheels.' },
    { yaw: .3, pitch: -.06, hint: 'Look right toward the valley rim.' },
  ] },
  dust: { title: 'Observe the changing sky', steps: [
    { yaw: 0, pitch: -.3, hold: 1.4, hint: 'Lift the mast toward the dusty sky. Hold to measure the fading light.' },
  ] },
  'smaller-world': { title: 'Return to familiar ground', steps: [
    { yaw: -.25, pitch: .14, hint: 'Look left at the nearby ground, still within reach.' },
    { yaw: .25, pitch: 0, hint: 'Look right into the dim valley. Your earlier work is already home.' },
  ] },
  'last-image': { title: 'One final sky observation', steps: [
    { yaw: 0, pitch: -.26, hold: 1.2, hint: 'Look higher into the dusty sky. Hold the view for the final frame.' },
  ] },
};

const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

/** Origin is the camera azimuth/polar at arrival; positive pitch means looking down. */
export function createSurvey(profile, origin = { yaw: 0, pitch: 0 }) {
  if (!profile?.steps?.length) throw new TypeError('A survey needs observation steps.');
  let step = 0, held = 0;
  let lastCapture = null;
  return {
    sample({ yaw, pitch, steady = true }, dt) {
      if (step < profile.steps.length) {
        const target = profile.steps[step];
        const moved = !lastCapture || Math.hypot(wrap(yaw-lastCapture.yaw),pitch-lastCapture.pitch) >= .12;
        const aligned = moved && Number.isFinite(yaw) && Number.isFinite(pitch) && steady &&
          Math.abs(wrap(yaw - origin.yaw - target.yaw)) <= (target.tolerance ?? .16) &&
          Math.abs(pitch - origin.pitch - target.pitch) <= (target.tolerance ?? .16);
        held = aligned ? held + (Number.isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0) : 0;
        if (held + 1e-9 >= (target.hold ?? .6)) { step++; held = 0; lastCapture={yaw,pitch}; }
      }
      const complete = step === profile.steps.length;
      const target = profile.steps[step];
      return { progress: complete ? 1 : (step + held / (target.hold ?? .6)) / profile.steps.length,
        complete, hint: complete ? 'Observation recorded.' : target.hint,
        step, total: profile.steps.length };
    },
  };
}
