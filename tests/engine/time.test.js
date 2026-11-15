import test from 'node:test';
import assert from 'node:assert/strict';
import { missionTime, timePassage } from '../../src/content/time.js';
import { scenes } from '../../src/content/story.js';

test('chronology jumps and the Earth handover have explicit passages', () => {
  const found = [];
  for (const from of scenes) for (const to of scenes) {
    const passage = timePassage(from.id, to.id);
    if (passage) found.push([from.id, to.id, passage]);
  }
  assert.deepEqual(found.map(([from, to]) => [from, to]), [
    ['blueberries', 'marathon'], ['marathon', 'ordinary-day'], ['last-image', 'earth-listens'],
  ]);
  assert.deepEqual(found.map(([, , p]) => [p.duration, p.fromYear, p.toYear, p.beats.length]), [
    [7, '2004', '2015', 1], [3, '2015', '2018', 1], [7, '2018', '2018', 2],
  ]);
  for (const [, , p] of found) {
    assert.ok(p.headline);
    for (const beat of p.beats) for (const field of ['label', 'title', 'cue']) assert.ok(beat[field]);
  }
  assert.equal(timePassage('last-image','earth-listens').role,'earth');
  assert.equal(timePassage('unknown', 'marathon'), null);
  assert.equal(timePassage('blueberries', 'unknown'), null);
  assert.equal(timePassage('__proto__', 'constructor'), null);
});

test('mission ages cover every scene, never decrease, and stop at last contact', () => {
  let previousAge = 0;
  for (const scene of scenes) {
    const time = missionTime(scene.id);
    assert.ok(time.year && time.label);
    assert.ok(Number.isFinite(time.ageYears) && time.ageYears >= previousAge);
    previousAge = time.ageYears;
    if (scene.signal === 0) assert.equal(time.ageYears, 14);
  }
  assert.equal(missionTime('first-morning').ageYears, 0);
  assert.equal(missionTime('marathon').ageYears, 11);
  assert.equal(missionTime('ordinary-day').ageYears, 14);
  assert.equal(missionTime('unknown'), null);
  assert.equal(missionTime('__proto__'), null);
});

test('date labels distinguish contact loss, recovery, last call and mission closure', () => {
  assert.match(missionTime('marathon').label, /MARCH 24, 2015.*SOL 3968/);
  assert.match(missionTime('last-image').label, /JUNE 10, 2018.*SOL 5111.*LAST CONTACT/);
  assert.match(missionTime('earth-listens').label, /EARTH.*AFTER JUNE 10, 2018/);
  assert.match(missionTime('months').label, /EARTH.*JUNE 2018–FEBRUARY 2019.*EIGHT MONTHS/);
  assert.match(missionTime('last-call').label, /EARTH.*FEBRUARY 12, 2019.*FINAL RECOVERY/);
  assert.match(missionTime('what-remains').label, /FEBRUARY 13, 2019.*MISSION COMPLETE/);
});
