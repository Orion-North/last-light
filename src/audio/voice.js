/** Small nonverbal inflections of the same imagined terminal voice.
 * These are not spoken dialogue, instrument telemetry or radio messages. */
const CONTOURS = {
  neutral:    { pitch: 202, turn: 1.015, end: .98, duration: .15, level: 1, colour: 1 },
  curious:    { pitch: 210, turn: 1.10, end: 1.065, duration: .18, level: 1, colour: 1.08 },
  hopeful:    { pitch: 208, turn: 1.08, end: 1.025, duration: .20, level: 1, colour: 1.04 },
  strained:   { pitch: 194, turn: 1.01, end: .97, duration: .16, level: .76, colour: .81 },
  reassuring:{ pitch: 204, turn: 1.055, end: 1, duration: .21, level: .88, colour: .98 },
  exhausted:  { pitch: 185, turn: 1, end: .985, duration: .12, level: .54, colour: .72 },
};

/** Bounded parameters, shared by real-time playback and the listening fixture. */
export function voiceContour({ emotion = 'neutral', speaker = 'rover', first = true } = {}) {
  const c=Object.hasOwn(CONTOURS,emotion) ? CONTOURS[emotion] : CONTOURS.neutral;
  const speakerPitch=speaker === 'earth' ? .87 : speaker === 'record' ? .75 : 1;
  const speakerColour=speaker === 'earth' ? .78 : speaker === 'record' ? .58 : 1;
  const level=c.level*(first ? 1 : .58);
  return {
    waveform: 'triangle', pitch: c.pitch*speakerPitch, turn: c.turn, end: c.end,
    duration: c.duration*(first ? 1 : .8),
    cutoff: 1120*c.colour*speakerColour,
    airLevel: .013*level, toneLevel: .0045*level,
  };
}
