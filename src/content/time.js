/**
 * Historical endpoints: NASA sources N1, N2 and N8 in story.js / docs/SOURCES.md.
 * Ages are coarse completed years of rover operation, frozen after last contact.
 * Passage captions and changing light are imagined, compressed routine, not logs.
 */
const times = {
  'first-morning': { year: '2004', label: '2004 · FIRST MORNING · SOL 01', ageYears: 0 },
  'stone-ripples': { year: '2004', label: '2004 · EARLY MISSION', ageYears: 0 },
  blueberries: { year: '2004', label: '2004 · SOL 48', ageYears: 0 },
  marathon: { year: '2015', label: 'MARCH 24, 2015 · ELEVEN YEARS ON MARS · SOL 3968', ageYears: 11 },
  'ordinary-day': { year: '2018', label: '2018 · FOURTEEN YEARS ON MARS · PERSEVERANCE VALLEY', ageYears: 14 },
  dust: { year: '2018', label: 'EARLY JUNE 2018 · FOURTEEN YEARS ON MARS', ageYears: 14 },
  'smaller-world': { year: '2018', label: 'JUNE 2018 · THE LAST DAYS OF CONTACT', ageYears: 14 },
  'last-image': { year: '2018', label: 'JUNE 10, 2018 · SOL 5111 · LAST CONTACT', ageYears: 14 },
  'earth-listens': { year: '2018', label: 'EARTH · AFTER JUNE 10, 2018', ageYears: 14 },
  months: { year: '2018–2019', label: 'EARTH · JUNE 2018–FEBRUARY 2019 · EIGHT MONTHS OF RECOVERY', ageYears: 14 },
  'last-call': { year: '2019', label: 'EARTH · FEBRUARY 12, 2019 · FINAL RECOVERY COMMANDS', ageYears: 14 },
  'what-remains': { year: '2019', label: 'FEBRUARY 13, 2019 · MISSION COMPLETE', ageYears: 14 },
};

const passages = {
  'last-image:earth-listens': {
    role: 'earth', duration: 7, fromYear: '2018', toYear: '2018',
    headline: 'The other end of the signal.',
    beats: [
      { label: 'MARS · CONTACT LOST', title: 'Contact with Opportunity has been lost.', cue: 'June 10, 2018.' },
      { label: 'EARTH · THE RECOVERY EFFORT', title: 'You are now on Earth.', cue: 'Send a recovery command. Listen for Opportunity.' },
    ],
  },
  'blueberries:marathon': {
    duration: 7, fromYear: '2004', toYear: '2015',
    headline: 'Mornings became years.',
    beats: [
      { label: '2015 · ELEVEN YEARS LATER', title: 'Eleven years.', cue: 'Still another place to look.' },
    ],
  },
  'marathon:ordinary-day': {
    duration: 3, fromYear: '2015', toYear: '2018',
    headline: 'Three more years.',
    beats: [
      { label: '2018 · FOURTEEN YEARS ON MARS', title: 'Fourteen years.', cue: 'What shall I show them today?' },
    ],
  },
};

export function missionTime(sceneId) {
  return Object.hasOwn(times, sceneId) ? times[sceneId] : null;
}

export function timePassage(fromId, toId) {
  const key = `${fromId}:${toId}`;
  return Object.hasOwn(passages, key) ? passages[key] : null;
}
