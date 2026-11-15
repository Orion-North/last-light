import test from 'node:test';
import assert from 'node:assert/strict';
import { renderUploadTerminal } from '../../src/ui/upload-terminal.js';
const render = (mode, stage, extra = {}) => renderUploadTerminal({
  title: '<memory>', mode, stage, prompt: 'Use & hold', response: '<reply>', ...extra,
});

test('controller ready states require triggers and retain a received Continue', () => {
  for (const mode of ['reply', 'partial', 'silence', 'archive']) {
    const ready = render(mode, 'ready', { input: 'controller' });
    assert.match(ready, new RegExp(`id="upload-progress".*aria-label="${mode === 'silence' ? 'Call' : mode === 'archive' ? 'Archive' : 'Send'} commitment"`));
    const verb = mode === 'silence' ? 'call' : mode === 'archive' ? 'keep' : 'send';
    assert.match(ready, new RegExp(`id="squeeze-hint"[^>]*>Squeeze both triggers. Release to ${verb}`));
    assert.match(ready, /--squeeze-left:0;--squeeze-right:0/);
    assert.match(ready, /data-squeeze="release"/);
    assert.match(ready, /upload-terminal__half--left/);
    assert.match(ready, /upload-terminal__half--right/);
    assert.equal((ready.match(/data-action="transmit"/g) || []).length, 0);
    assert.doesNotMatch(ready, /SWIPE|right stick|touchpad|↑/i);
    for (const stage of ['sending', 'received']) assert.doesNotMatch(render(mode, stage), /<progress/);
  }
});

test('input instructions distinguish controller commitment from button fallback', () => {
  assert.match(render('reply', 'ready'), /data-input="pointer"/);
  assert.match(render('reply', 'ready'), /data-action="transmit"/);
  assert.doesNotMatch(render('reply','ready',{input:'controller'}),/squeeze-sequence|Hold to charge/);
  assert.doesNotMatch(render('reply','ready',{input:'controller'}),/data-action="transmit"/);
  assert.match(render('reply', 'ready'), /Send this memory home with the button below/);
  assert.match(render('reply', 'ready'), />Upload memory /);
  assert.match(render('silence', 'ready'), />Call Opportunity /);
  assert.match(render('archive', 'ready'), />Keep memory /);
});

test('receipts preserve partial, unanswered and archive meanings', () => {
  for (const [mode, status] of [
    ['reply', 'REPLY RECEIVED'],
    ['partial', 'PARTIAL IMAGE RECEIVED'],
    ['silence', 'NO REPLY'],
    ['archive', 'MEMORY KEPT'],
  ]) {
    const html = render(mode, 'received');
    assert.ok(html.includes(status));
    assert.doesNotMatch(html, /SAVED IN YOUR ARCHIVE|CHANNEL QUIET · MEMORY KEPT|>ARCHIVED</);
    assert.match(html, /data-action="next"/);
    assert.doesNotMatch(html, /TRANSMISSION COMPLETE|SQUEEZE.*REPLY/);
  }
  assert.match(render('silence', 'ready'), /A call travels from Earth to the silent rover on Mars/);
  assert.match(render('archive', 'received'), /<small>MISSION ARCHIVE<\/small>/);
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
  assert.match(mars,/A signal travels from Opportunity on Mars to Earth/);
  assert.match(render('silence','ready'),/A call travels from Earth to the silent rover on Mars/);
  assert.doesNotMatch(render('archive','ready'),/>→<\/i>/);
  assert.doesNotMatch(render('reply','received',{meaning:'ready only'}),/ready only/);
});

test('spatial link keeps endpoints and mode meaning without duplicate labels', () => {
  const send=render('reply','sending');
  assert.match(send,/signal-world--mars/);
  assert.match(send,/planet--earth/);
  assert.match(send,/A signal travels from Opportunity on Mars to Earth/);
  assert.doesNotMatch(send,/DISTANCE & TRAVEL TIME COMPRESSED|CROSSING THE DISTANCE|MEMORY IN TRANSIT|SENDING MEMORY/);
  assert.match(render('silence','received'),/NO ANSWER/);
  assert.match(render('partial','received'),/PARTIAL IMAGE RECEIVED/);
  assert.match(render('archive','received'),/Discoveries preserved on Earth/);
});


test('ready and receipt show the memory once without explanatory filler', () => {
  for (const stage of ['ready','sending','received']) {
    const html=render('reply',stage,{input:'controller'});
    assert.doesNotMatch(html,/upload-terminal__destination|upload-terminal__label|signal-outcome|signal-scale|squeeze-sequence/);
    assert.equal((html.match(/&lt;memory&gt;/g)||[]).length,1);
  }
  const sending=render('reply','sending');
  assert.equal((sending.match(/role="status"/g)||[]).length,1);
  assert.equal((sending.match(/Use &amp; hold/g)||[]).length,1);
});

test('integrated thoughts keep controller sending and silence receipts without duplicate story', () => {
  const story='<section class="story-console">My thought</section>';
  const ready=render('reply','ready',{story,input:'controller',meaning:'Duplicate meaning'});
  assert.equal((ready.match(/My thought/g)||[]).length,1);
  assert.doesNotMatch(ready,/Duplicate meaning|data-action="transmit"|upload-terminal__memory/);
  assert.match(ready,/id="squeeze-hint"/);
  const silence=render('silence','received',{story,voice:false,response:'No signal from Opportunity.'});
  assert.match(silence,/NO REPLY/);assert.match(silence,/No signal from Opportunity\./);
  assert.match(silence,/data-action="next"/);
  assert.doesNotMatch(render('silence','received',{story,voice:false,response:'Earth’s call, imagined: This is home.'}), /imagined: This is home/);
  assert.match(render('archive','ready',{story,voice:false}), /&lt;memory&gt;/);
});

test('silent rover departures and receipts never fall back to response prose', () => {
  const story='<section class="story-console" aria-label="Mission time"></section>';
  for (const [mode,status] of [['reply','REPLY RECEIVED'],['partial','PARTIAL IMAGE RECEIVED']]) {
    const extra={story,voice:false,response:'Earth says: We see you.',prompt:'New departure prose'};
    const sending=render(mode,'sending',extra);
    assert.doesNotMatch(sending,/Earth says|New departure prose|story-operational/);
    assert.match(sending,/signal-packet/);
    assert.doesNotMatch(sending,/data-action=/);
    const received=render(mode,'received',extra);
    assert.ok(received.includes(status));
    assert.doesNotMatch(received,/Earth says|New departure prose|story-operational/);
    assert.match(received,/data-action="next"/);
    assert.equal(received.includes('NO ANSWER'),mode==='partial');
  }
});

test('silent Earth operations retain recovery and archive information', () => {
  const story='<section class="story-console"></section>';
  const extra={story,voice:false};
  const call=render('silence','sending',{...extra,prompt:'CALLING · LISTENING'});
  assert.match(call,/role="status">CALLING · LISTENING/);
  const quiet=render('silence','received',{...extra,response:'No signal is received.'});
  assert.match(quiet,/NO REPLY/);
  assert.match(quiet,/story-operational">No signal is received\./);
  const archive=render('archive','received',{...extra,response:'Added to the archive.'});
  assert.match(archive,/MEMORY KEPT/);
  assert.match(archive,/story-operational">Added to the archive\./);
  assert.match(render('archive','ready',extra),/story-operational">&lt;memory&gt;/);
  assert.doesNotMatch(render('archive','sending',extra),/Use &amp; hold/);
});

test('compared readings remain available during preparation, departure and receipt',()=>{
  const findings=[{label:'Grain-rich surface',reading:'Higher relative iron-bearing signal'},{label:'Exposed bedrock',reading:'Lower relative iron-bearing signal'}];
  for(const stage of ['ready','sending','received']){
    const html=renderUploadTerminal({title:'Comparison',mode:'reply',stage,findings,story:'<div></div>',voice:false,input:'controller'});
    assert.match(html,/Compared observations/);assert.match(html,/Higher relative iron-bearing signal/);assert.match(html,/Lower relative iron-bearing signal/);
  }
});

test('recovery chronology advances with story scenes and never adds a reply',()=>{
  for(const [index,sceneId] of ['earth-listens','months','last-call'].entries()){
    const html=renderUploadTerminal({title:'Recovery',mode:sceneId==='months'?'archive':'silence',stage:'received',sceneId,story:'<div></div>',voice:false});
    assert.equal((html.match(/data-reached="true"/g)||[]).length,index+1);
    assert.match(html,/JUN 2018/);assert.match(html,/FEB 2019/);assert.doesNotMatch(html,/REPLY RECEIVED/);
  }
});
