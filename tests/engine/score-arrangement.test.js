import test from 'node:test';
import assert from 'node:assert/strict';
import { phrase, SECTIONS, HOME, SIGNAL_QUESTION, SIGNAL_ANSWER, ANSWER_WINDOW } from '../../src/audio/score.js';
const sustained = new Set(['organ','strings','pad','bass']);

test('cinematic chapters have connected simultaneous harmony, bass and patterned motion', () => {
  for (const section of ['discovery','geology','amber','remembrance']) {
    const p = phrase(section);
    const chords = p.events.filter(e => e.instrument === 'organ');
    assert.equal(chords.length,12,`${section}: four actual three-note harmonies`);
    for (const at of [0,12,24,36]) assert.equal(chords.filter(e => e.at === at).length,3);
    assert.ok(chords[0].duration >= 12*SECTIONS[section].eighth,'bed connects through harmonic change');
    assert.ok(p.events.some(e => e.instrument === 'bass' && e.at === 0));
    assert.ok(p.events.filter(e => e.instrument === 'pulse').length >= 12);
    assert.ok(p.events.some(e => e.instrument === 'strings'));
    assert.ok(new Set(p.events.filter(e => e.instrument === 'bass').map(e => e.note)).size >= 3,'bass creates harmonic movement');
    const thin = phrase(section,1);
    assert.ok(thin.events.length < p.events.length);
    assert.ok(thin.events.some(e => e.instrument === 'pad'),'thin return retains harmony');
  }
});

test('all variations respect musical time, bounded orchestration and a real phrase-end breath', () => {
  for (const section of Object.keys(SECTIONS).filter(s => s !== 'silence')) {
    for (let n=0;n<4;n++) {
      const p = phrase(section,n), eighth = SECTIONS[section].eighth;
      assert.ok(p.events.length <= 60,`${section}/${n}: ${p.events.length} events`);
      assert.ok(p.events.every(e => Number.isFinite(e.at) && e.at>=0 && e.duration>0 && e.volume>0 && e.volume<=.2 && e.note>=31 && e.note<=88));
      const ends = p.events.map(e => e.at*eighth+e.duration);
      assert.ok(Math.max(...ends) < p.seconds-2,'scheduled tails leave silence before another phrase');
      for (const t of p.events.map(e => e.at*eighth)) {
        const active = p.events.filter(e => sustained.has(e.instrument) && e.at*eighth<=t && e.at*eighth+e.duration>t);
        assert.ok(active.length<=16,`${section}/${n}: ${active.length} sustained voices`);
      }
    }
  }
});

test('storm orchestration dissolves instead of maintaining an epic pulse', () => {
  const storm = phrase('storm').events;
  const pulses = storm.filter(e => e.instrument === 'pulse');
  assert.ok(pulses.some(e => e.at<12));
  assert.ok(pulses.every(e => e.at<24),'final storm chord has lost the pulse');
  const bass = storm.filter(e => e.instrument === 'bass');
  assert.ok(bass[2].volume < bass[1].volume && bass[1].volume < bass[0].volume);
  assert.ok(bass[2].duration < bass[0].duration);
  assert.equal(phrase('fading').events.length,5);
  assert.ok(!phrase('waiting').events.some(e => e.instrument === 'pulse'));
  assert.deepEqual(phrase('silence').events,[]);
});

test('home identity and foreground question/answer contract survive the richer score', () => {
  assert.deepEqual(phrase('discovery',1).events.filter(e => e.instrument==='pluck').map(e => [e.note,e.at]),HOME);
  assert.deepEqual(SIGNAL_QUESTION,[[74,0,.30,.065],[81,.24,.30,.050],[76,.48,.30,.056],[78,.84,.52,.050]]);
  assert.deepEqual(SIGNAL_ANSWER,[[69,0,.32,.056],[66,.24,.32,.048],[64,.48,.34,.046],[62,.84,.65,.052]]);
  assert.equal(ANSWER_WINDOW,2.2);
});
