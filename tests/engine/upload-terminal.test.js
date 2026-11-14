import test from 'node:test';
import assert from 'node:assert/strict';
import { renderUploadTerminal } from '../../src/ui/upload-terminal.js';

const render = (mode, stage, extra = {}) => renderUploadTerminal({
  title: '<memory>', mode, stage, prompt: 'Use & hold', response: '<reply>', ...extra,
});

test('upload gesture progress appears only while preparing an upload', () => {
  for (const mode of ['reply', 'partial']) {
    assert.match(render(mode, 'ready'), /GESTURE.*id="upload-progress"/);
    for (const stage of ['sending', 'received']) assert.doesNotMatch(render(mode, stage), /<progress|100%/);
  }
  assert.match(render('partial', 'received'), /PARTIAL IMAGE RECEIVED/);
  assert.doesNotMatch(render('partial', 'received'), /TRANSMISSION COMPLETE/);
});

test('recovery and archive states use their own language and never imply a full receipt', () => {
  const silence = ['READY TO CALL', 'CALLING', 'NO REPLY'];
  const archive = ['READY TO KEEP', 'KEEPING MEMORY', 'MEMORY KEPT'];
  for (const [mode, statuses] of [['silence', silence], ['archive', archive]]) {
    for (const [index, stage] of ['ready', 'sending', 'received'].entries()) {
      const html = render(mode, stage);
      assert.ok(html.includes(statuses[index]));
      assert.doesNotMatch(html, /<progress|UPLINK|SENDING MEMORY|TRANSMISSION COMPLETE|SWIPE UP/);
    }
  }
  assert.match(render('silence', 'received'), /CHANNEL QUIET/);
  assert.match(render('archive', 'received'), /ARCHIVED/);
});

test('content is escaped and stage buttons are available', () => {
  const ready = render('reply', 'ready');
  assert.match(ready, /&lt;memory&gt;/);
  assert.match(ready, /Use &amp; hold/);
  assert.match(ready, /data-action="transmit"/);
  const received = render('reply', 'received');
  assert.match(received, /&lt;reply&gt;/);
  assert.match(received, /data-action="next"/);
});
