import test from 'node:test';
import assert from 'node:assert/strict';
import { renderUploadTerminal } from '../../src/ui/upload-terminal.js';
const render = (mode, stage, extra = {}) => renderUploadTerminal({
  title: '<memory>', mode, stage, prompt: 'Use & hold', response: '<reply>', ...extra,
});

test('each ready action exposes pressure feedback and one accessible alternative', () => {
  for (const mode of ['reply', 'partial', 'silence', 'archive']) {
    const ready = render(mode, 'ready', { input: 'controller' });
    assert.match(ready, new RegExp(`id="upload-progress".*aria-label="${mode === 'silence' ? 'Call' : mode === 'archive' ? 'Archive' : 'Send'} commitment"`));
    assert.match(ready, /id="squeeze-hint"[^>]*>Release both triggers/);
    assert.match(ready, /--squeeze-left:0;--squeeze-right:0/);
    assert.match(ready, /data-squeeze="release"/);
    assert.match(ready, /upload-terminal__half--left/);
    assert.match(ready, /upload-terminal__half--right/);
    assert.equal((ready.match(/data-action="transmit"/g) || []).length, 1);
    assert.doesNotMatch(ready, /SWIPE|right stick|touchpad|↑/i);
    for (const stage of ['sending', 'received']) assert.doesNotMatch(render(mode, stage), /<progress/);
  }
});

test('input instructions distinguish controller commitment from button fallback', () => {
  assert.match(render('reply', 'ready'), /data-input="pointer"/);
  assert.match(render('reply', 'ready'), /Send this memory home with the button below/);
  assert.match(render('reply', 'ready'), />Upload memory /);
  assert.match(render('silence', 'ready'), />Call Opportunity /);
  assert.match(render('archive', 'ready'), />Keep memory /);
});

test('receipts preserve partial, unanswered and archive meanings', () => {
  for (const [mode, status, footer] of [
    ['reply', 'REPLY RECEIVED', 'TRANSMISSION ENDED'],
    ['partial', 'PARTIAL IMAGE RECEIVED', 'TRANSMISSION ENDED'],
    ['silence', 'NO REPLY', 'CHANNEL QUIET'],
    ['archive', 'MEMORY KEPT', 'ARCHIVED'],
  ]) {
    const html = render(mode, 'received');
    assert.ok(html.includes(status));
    assert.ok(html.includes(footer));
    assert.match(html, /data-action="next"/);
    assert.doesNotMatch(html, /TRANSMISSION COMPLETE|SQUEEZE.*REPLY/);
  }
  assert.match(render('silence', 'ready'), /<span>OPPORTUNITY<\/span>/);
  assert.match(render('archive', 'received'), /<span>MISSION ARCHIVE<\/span>/);
});

test('memory and response text are escaped, with stable integration containers', () => {
  const ready = render('reply', 'ready');
  assert.equal((ready.match(/&lt;memory&gt;/g) || []).length, 1);
  assert.match(render('reply', 'sending'), /Use &amp; hold/);
  assert.doesNotMatch(ready, /Use &amp; hold/);
  assert.match(ready, /class="upload-terminal__body"/);
  assert.match(render('reply', 'received'), /&lt;reply&gt;/);
  assert.doesNotMatch(render('reply', 'sending'), /data-action=/);
});
