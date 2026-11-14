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
    const verb = mode === 'silence' ? 'call' : mode === 'archive' ? 'keep' : 'send';
    assert.match(ready, new RegExp(`id="squeeze-hint"[^>]*>Squeeze, then release to ${verb}`));
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
    ['reply', 'REPLY RECEIVED', 'SAVED IN YOUR ARCHIVE'],
    ['partial', 'PARTIAL IMAGE RECEIVED', 'SAVED IN YOUR ARCHIVE'],
    ['silence', 'NO REPLY', 'CHANNEL QUIET'],
    ['archive', 'MEMORY KEPT', 'ARCHIVED'],
  ]) {
    const html = render(mode, 'received');
    assert.ok(html.includes(status));
    assert.ok(html.includes(footer));
    assert.match(html, /data-action="next"/);
    assert.doesNotMatch(html, /TRANSMISSION COMPLETE|SQUEEZE.*REPLY/);
  }
  assert.match(render('silence', 'ready'), /<span>OPPORTUNITY · MARS<\/span>/);
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

test('instrument exposes charge and quiet mode-aware receipt marks', () => {
  const html = render('reply', 'ready', { input: 'controller' });
  assert.match(html, /--charge-progress:0/);
  assert.match(html, /upload-terminal__seam/);
  assert.match(html, /signal-packet/);
  assert.doesNotMatch(html, /SELECTED MEMORY|MEMORY BUFFER/);
  assert.match(html, /signal-echo/);
  assert.match(html, /aria-hidden="true"/);
});

test('one memory title belongs inside the pressure apparatus and one live instruction remains', () => {
  const html = render('reply', 'ready', { input: 'controller' });
  assert.match(html, /upload-terminal__apparatus[\s\S]*upload-terminal__memory[\s\S]*<h2>&lt;memory&gt;<\/h2>/);
  assert.equal((html.match(/<h2>/g) || []).length, 1);
  assert.equal((html.match(/id="squeeze-hint"/g) || []).length, 1);
  assert.doesNotMatch(html, /upload-terminal__phase|upload-terminal__header/);
});


test('selected meaning follows the choice and the route reverses on Earth',()=>{
  const mars=render('reply','ready',{meaning:'The ground <beneath> my wheels.'});
  assert.match(mars,/The ground &lt;beneath&gt; my wheels/);
  assert.match(mars,/OPPORTUNITY · MARS<\/span><i[^>]*>→<\/i><span>EARTH/);
  assert.match(render('silence','ready'),/EARTH<\/span><i[^>]*>→<\/i><span>OPPORTUNITY · MARS/);
  assert.doesNotMatch(render('archive','ready'),/>→<\/i>/);
  assert.doesNotMatch(render('reply','received',{meaning:'ready only'}),/ready only/);
});

test('spatial link explains both endpoints, compressed time, and archive difference', () => {
  const send=render('reply','sending');
  assert.match(send,/signal-world--mars/);
  assert.match(send,/planet--earth/);
  assert.match(send,/A signal travels from Opportunity on Mars to Earth/);
  assert.match(send,/DISTANCE &amp;|DISTANCE & TRAVEL TIME COMPRESSED/);
  assert.match(render('silence','received'),/NO RETURN SIGNAL/);
  assert.match(render('partial','received'),/INCOMPLETE FRAME/);
  assert.match(render('archive','received'),/THE DISCOVERIES REMAIN/);
});
