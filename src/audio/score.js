/** Original score: authored eighth-note positions, MIDI pitches and orchestration.
 * Kept pure so musical structure can be audited independently of Web Audio. */
export const SECTIONS = {
  discovery: { eighth: .48, piano: .23, strings: .05, wind: .035, cutoff: 330, gap: 7 },
  geology: { eighth: .48, piano: .20, strings: .035, wind: .025, cutoff: 300, gap: 8 },
  amber: { eighth: .53, piano: .20, strings: .042, wind: .04, cutoff: 350, gap: 8 },
  storm: { eighth: .59, piano: .145, strings: .028, wind: .095, cutoff: 740, gap: 11, minor: true },
  fading: { eighth: .67, piano: .105, strings: 0, wind: .045, cutoff: 220, gap: 15, minor: true },
  waiting: { eighth: .57, piano: .14, strings: .022, wind: 0, cutoff: 170, gap: 12 },
  remembrance: { eighth: .55, piano: .22, strings: .053, wind: .012, cutoff: 230, gap: 14 },
  silence: { eighth: .6, piano: 0, strings: 0, wind: 0, cutoff: 180, gap: 30 },
};
export const HOME = [[62, 0], [69, 3], [64, 5], [66, 8], [62, 12]];
const ANSWER = [[69, 24], [66, 27], [64, 30], [59, 34], [62, 38]];
// The geology cell climbs through an open fourth, inspecting rather than calling.
const STRATA = [[74, 1], [76, 4], [81, 7], [78, 13], [76, 17], [74, 21]];
// Ordinary days turn the call into a small rocking figure in the middle register.
const ROUTINE = [[57, 0], [62, 3], [66, 6], [64, 9], [57, 15], [62, 18], [69, 24], [66, 29], [64, 34], [62, 39]];

export function phrase(section, number = 0) {
  const c = SECTIONS[section];
  if (!c || section === 'silence') return { events: [], seconds: 30 };
  const v = number % 4;
  const events = [];
  const add = (instrument, note, at, level, duration = 5.8) => events.push({ instrument, note, at, volume: level, duration });
  const returns = [[...HOME, ...ANSWER], HOME, [...HOME, [71, 24], [69, 28], [64, 33], [66, 38]], [[69, 5], [66, 9], [64, 14], [59, 20], [62, 28]]];
  let line = returns[v];
  let instrument = 'pluck';
  if (section === 'geology') { line = v === 1 ? STRATA.slice(0, 3) : STRATA; instrument = 'glass'; }
  if (section === 'amber') line = v === 1 ? ROUTINE.slice(0, 4) : ROUTINE;
  if (section === 'storm') line = v % 2 ? [[62, 0], [69, 5], [64, 13]] : [[62, 0], [69, 4], [64, 9], [65, 17], [61, 28]];
  if (section === 'fading') line = [[62, 0], [64, 11]];
  // Earth never answers the upward fifth: a falling human-register recollection.
  if (section === 'waiting') { line = [[57, 2], [54, 8], [52, 17], [50, 28]]; instrument = 'reed'; }
  if (section === 'remembrance') line = v === 0 ? [...HOME, [71, 23], [69, 27], [66, 31], [64, 36], [74, 42]] : returns[v];
  line.forEach(([note, at], i) => add(instrument, note, at, c.piano * (v === 1 ? .83 : 1) * [1, .76, .84, .73, .90][i % 5], instrument === 'glass' ? 4.2 : 6.1));
  // Second statement is deliberately unaccompanied, with a long rest afterward.
  if (v !== 1 && section !== 'fading') {
    const harmonies = section === 'storm' ? [[38, 53, 57], [34, 52, 57], [33, 50, 56]]
      : section === 'waiting' ? [[47, 54, 61], [43, 50, 57]]
      : section === 'geology' ? [[38, 57, 64], [43, 59, 66], [45, 62, 69]]
      : [[38, 54, 57], [35, 54, 62], [31, 57, 64]];
    const count = section === 'storm' || section === 'waiting' ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const [bass, inner, upper] = harmonies[(i + (v === 3 ? 1 : 0)) % harmonies.length];
      add('pluck', bass, i * 15 + .16, c.piano * .42, 6.2);
      if (section !== 'storm') add(section === 'geology' ? 'glass' : 'pluck', upper, i * 15 + 3.2, c.piano * .23, 4.8);
      if (i === 0 && v % 2 === 0) add('string', inner + 12, .6, c.strings * .42, 5.6);
    }
    if (section === 'geology' && v % 2 === 0) {
      [[66, 26], [64, 32], [62, 39]].forEach(([n, at]) => add('pluck', n, at, c.piano * .44, 5));
    }
    if (section === 'remembrance' && v === 0) {
      // Geology's identity survives inside the returning home theme.
      [[86, 25], [88, 29], [81, 35]].forEach(([n, at]) => add('glass', n, at, c.piano * .22, 4.2));
      add('string', 59, 36, c.strings * .35, 10);
    }
  }
  events.sort((a, b) => a.at - b.at);
  return { events, seconds: 48 * c.eighth + c.gap + [0, 6, 3, 10][v] };
}
