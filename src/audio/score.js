/** Original cinematic score. Positions are eighth notes; durations are seconds.
 * Layers have separate jobs: organ harmony, moving strings, low roots, pulse and
 * a recognizable foreground identity. No borrowed melody or sampled recording. */
export const SECTIONS = {
  discovery: { eighth: .48, piano: .19, strings: .05, wind: .035, cutoff: 330, gap: 5 },
  geology: { eighth: .48, piano: .16, strings: .04, wind: .025, cutoff: 300, gap: 6 },
  amber: { eighth: .53, piano: .17, strings: .045, wind: .04, cutoff: 350, gap: 6 },
  storm: { eighth: .59, piano: .13, strings: .028, wind: .32, cutoff: 1050, gap: 10, minor: true },
  fading: { eighth: .67, piano: .10, strings: 0, wind: .60, cutoff: 1250, gap: 15, minor: true },
  waiting: { eighth: .57, piano: .12, strings: .022, wind: 0, cutoff: 170, gap: 10 },
  remembrance: { eighth: .55, piano: .18, strings: .05, wind: .012, cutoff: 230, gap: 12 },
  silence: { eighth: .6, piano: 0, strings: 0, wind: 0, cutoff: 180, gap: 30 },
};
export const HOME = [[62, 0], [69, 3], [64, 5], [66, 8], [62, 12]];
const ANSWER = [[69, 24], [66, 27], [64, 30], [59, 34], [62, 38]];
const STRATA = [[74, 1], [76, 4], [81, 7], [78, 13], [76, 17], [74, 21]];
const ROUTINE = [[57, 0], [62, 3], [66, 6], [64, 9], [57, 15], [62, 18], [69, 24], [66, 29], [64, 34], [62, 39]];
// Four voiced changes, not block transpositions: common tones remain while inner
// voices move by step. The bass makes the same upper notes change their meaning.
// Each entry is [root, organ triad, string dyad]. D(add9)–Bm7–Gmaj9–Asus.
const HARMONY = {
  discovery: [[38,[57,62,66],[69,76]], [35,[57,62,66],[69,74]], [43,[59,62,66],[69,74]], [45,[57,62,64],[69,76]]],
  geology: [[38,[57,64,69],[74,78]], [43,[59,62,69],[74,78]], [40,[59,64,67],[74,79]], [45,[57,62,69],[76,81]]],
  amber: [[35,[54,61,66],[69,74]], [43,[55,62,66],[69,74]], [38,[57,62,66],[69,76]], [45,[57,61,64],[67,76]]],
  storm: [[38,[57,62,65],[69,76]], [34,[58,62,65],[69,74]], [33,[57,61,64],[68,74]]],
  waiting: [[35,[54,61,64],[66,69]], [43,[55,59,62],[66,69]], [40,[55,59,64],[67,71]], [45,[57,59,64],[67,71]]],
  remembrance: [[43,[55,62,66],[69,74]], [38,[57,62,66],[69,76]], [35,[57,62,66],[71,78]], [38,[57,62,64],[69,78]]],
};

export function phrase(section, number = 0, exhaustion = 0) {
  const c = SECTIONS[section];
  if (!c || section === 'silence') return { events: [], seconds: 30 };
  const v = ((number % 4) + 4) % 4;
  const events = [];
  const add = (instrument, note, at, volume, duration) => events.push({instrument, note, at, volume, duration});
  const thin = v === 1;
  const returns = [[...HOME, ...ANSWER], HOME, [...HOME,[71,24],[69,28],[64,33],[66,38]], [[69,5],[66,9],[64,14],[59,20],[62,28]]];
  let line = returns[v], instrument = 'pluck';
  if (section === 'geology') { line = thin ? STRATA.slice(0,4) : STRATA; instrument = 'glass'; }
  if (section === 'amber') line = thin ? ROUTINE.slice(0,6) : ROUTINE;
  if (section === 'storm') line = v % 2 ? [[62,0],[69,5],[64,13]] : [[62,0],[69,4],[64,9],[65,17],[61,28]];
  if (section === 'fading') line = [[62,0],[64,11]];
  // This human-register descent cannot be mistaken for a returned radio answer.
  if (section === 'waiting') { line = [[57,2],[54,8],[52,17],[50,28]]; instrument = 'reed'; }
  if (section === 'remembrance' && v === 0) line = [...HOME,[71,23],[69,27],[66,31],[64,36],[74,42]];
  line.forEach(([note,at],i) => add(instrument,note,at,c.piano * (thin ? .84 : 1) * [1,.76,.84,.73,.90][i%5],instrument === 'glass' ? 3.6 : 4.8));

  if (section === 'fading') {
    // The storm's final chord has almost disappeared; no ticking pulse survives.
    add('pad',57,0,.018,5.5);
    add('pad',64,0,.014,4.2);
    add('bass',38,0,.035,4);
  } else {
    const harmony = HARMONY[section];
    const storm = section === 'storm';
    const count = storm ? (thin ? 2 : 3) : 4;
    for (let i=0;i<count;i++) {
      // Later returns start in the relative minor or subdominant, changing the
      // phrase's arc without erasing its home-call identity.
      const index = storm ? i : (i + (v === 2 ? 1 : v === 3 ? 2 : 0)) % harmony.length;
      const [root,chord,high] = harmony[index];
      const at = i*12;
      const decay = storm ? [1,.69,.38][i] : 1;
      const duration = storm ? [6.5,5,3.5][i] : 12*c.eighth + .35;
      add('bass',root,at,.065*decay*(thin ? .75 : 1),duration*.9);
      // Thin returns keep a moving harmonic floor, with open fifths and air.
      const voicing = thin ? [chord[0],chord[2]] : chord;
      voicing.forEach((note,j) => add(thin ? 'pad' : 'organ',note,at,.032*decay*(j === 1 ? .88 : 1),duration));
      if (!thin) high.forEach((note,j) => add('strings',note,at+.35+j*.18,.023*decay,duration-.65));
      else add('strings',high[i%2],at+.5,.018*decay,duration-1);
      // An uneven recurring figure suggests travel without a metronomic alarm.
      // Earth has no pulse; the storm loses both notes and energy as it unfolds.
      if (section !== 'waiting') {
        const offsets = thin ? [2,8] : storm ? (i === 0 ? [2,5,8,10] : i === 1 ? [3,8] : []) : [1.5,4.5,7.5,10];
        offsets.forEach((offset,j) => add('pulse',chord[(j+i)%chord.length]+12,at+offset,.033*decay*(j%2 ? .74 : 1),.85));
      }
    }
    if (section === 'geology' && !thin) [[66,26],[64,32],[62,39]].forEach(([n,at]) => add('pluck',n,at,.065,3.7));
    if (section === 'remembrance' && !thin) [[86,25],[88,29],[81,35]].forEach(([n,at]) => add('glass',n,at,.041,3.5));
  }
  // Later storm returns struggle to restart: the pulse and upper ensemble
  // disappear, and even the familiar reaching line cannot finish its sentence.
  const wear = section === 'storm' ? Math.max(0, Math.min(1, Number.isFinite(exhaustion) ? exhaustion : 0)) : 0;
  if (wear > 0) {
    for (let i=events.length-1;i>=0;i--) {
      const event=events[i];
      if (wear >= .5 && (event.instrument === 'pulse' || event.instrument === 'strings'
        || event.at >= 12 || ['organ','pad'].includes(event.instrument) && event.note > 62)) {
        events.splice(i,1); continue;
      }
      event.at *= 1 + wear*.75;
      event.volume *= 1 - wear*.48;
      event.duration *= 1 - wear*.30;
      if (event.instrument === 'organ') event.instrument='pad';
    }
  }
  if (section === 'fading') {
    for (const event of events) {
      event.at *= 1.8;
      event.volume *= .52;
      event.duration *= .7;
    }
  }
  events.sort((a,b) => a.at-b.at);
  return { events, seconds: 48*c.eighth+c.gap+[0,3,1,5][v]+wear*20+(section === 'fading' ? 12 : 0) };
}

// Foreground dialogue, in seconds: D–A–E–F♯ asks; A–F♯–E–D answers.
// These short, identical statements teach the receipt independently of the score.
export const SIGNAL_QUESTION = [[74, 0, .30, .065], [81, .24, .30, .050], [76, .48, .30, .056], [78, .84, .52, .050]];
export const SIGNAL_ANSWER = [[69, 0, .32, .056], [66, .24, .32, .048], [64, .48, .34, .046], [62, .84, .65, .052]];
export const ANSWER_WINDOW = 2.2;
