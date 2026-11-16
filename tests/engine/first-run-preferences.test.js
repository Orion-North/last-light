import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialSoundPreference } from '../../src/engine/first-run-preferences.js';

test('new and legacy players receive the intended sound-enabled experience', () => {
  assert.equal(initialSoundPreference(null), true);
  assert.equal(initialSoundPreference(undefined), true);
  assert.equal(initialSoundPreference({ haptics: true, reducedMotion: true }), true);
});

test('an explicit mute survives the same JSON storage round trip as other settings', () => {
  const saved = JSON.stringify({ sound: false, haptics: true });
  assert.equal(initialSoundPreference(JSON.parse(saved)), false);
  assert.equal(initialSoundPreference(JSON.parse('{"sound":true}')), true);
});

test('invalid stored values cannot accidentally become an explicit mute', () => {
  for (const sound of [null, 0, 1, '', 'false', [], {}]) {
    assert.equal(initialSoundPreference({ sound }), true);
  }
});
