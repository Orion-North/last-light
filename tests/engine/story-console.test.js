import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWriter, renderStoryConsole } from '../../src/ui/story-console.js';
import { storyLine } from '../../src/content/terminal-story.js';
import { scenes } from '../../src/content/story.js';

function fixture() {
  let queued = null, paused = false, reduced = false, clock = 0;
  const pulses = [];
  const writer = createStoryWriter({requestFrame:fn=>(queued=fn,1),cancelFrame:()=>{queued=null;},
    paused:()=>paused,reducedMotion:()=>reduced,pulse:cue=>pulses.push({...cue,at:clock})});
  const target = () => ({textContent:'',isConnected:true,closest:()=>({classList:{toggle(){}}})});
  const mount = (element,text='A thought that takes a little time to reach the screen.',key='first',emotion='neutral') => writer.mount({querySelector:()=>element},{speaker:'rover',text,emotion},key);
  const step = now => { clock=now;const fn=queued;queued=null;fn?.(now); };
  return {writer,pulses,target,mount,step,setPaused:value=>{paused=value;},setReduced:value=>{reduced=value;},hasFrame:()=>!!queued};
}

test('thought reveal pauses, survives a same-line rerender and never queues after stop', () => {
  const f=fixture(),first=f.target();f.mount(first);f.step(0);f.step(80);f.step(160);
  const partial=first.textContent;assert.ok(partial.length>0 && partial.length<53);
  f.setPaused(true);f.step(240);f.step(320);assert.equal(first.textContent,partial);
  const replacement=f.target();f.mount(replacement);assert.equal(replacement.textContent,partial);
  f.setPaused(false);f.step(400);f.step(480);assert.ok(replacement.textContent.length>partial.length);
  f.writer.stop();const count=f.pulses.length;f.step(560);assert.equal(f.hasFrame(),false);assert.equal(f.pulses.length,count);
});

test('contact loss clears a pending thought without playing a new voice', () => {
  const f=fixture(),first=f.target();f.mount(first);f.step(0);f.step(80);
  const count=f.pulses.length;f.writer.mount({querySelector:()=>null},{text:''},'silence');
  f.step(160);assert.equal(f.hasFrame(),false);assert.equal(f.pulses.length,count);
});

test('complete line is accessible immediately, without a rendered speaker label', () => {
  const html=renderStoryConsole({line:{speaker:'rover',channel:'OPPORTUNITY · imagined',text:'I see <light>.'},time:'2004'});
  assert.match(html, /class="sr-only">I see &lt;light&gt;\./);
  assert.doesNotMatch(html,/OPPORTUNITY|EARTH|MISSION RECORD/);
});

test('the inner voice ends with contact loss, including restored Earth-side saves', () => {
  for(const scene of scenes) for(const phase of ['observe','choose','transmit','received']) {
    const line=storyLine({scene,phase});
    assert.ok(line.text.length<=140,scene.id);
    if(scene.act===3 || scene.end || scene.receiptMode==='partial' && phase==='received') assert.equal(line.text,'',scene.id);
    assert.equal(storyLine({scene,phase,investigating:true}).text,'');
  }
});

test('punctuation holds the next character and pulses carry the revealed voice',()=>{
 const f=fixture(),t=f.target();f.mount(t,'Hi. A','punctuation');
 f.step(0);f.step(80);f.step(160);assert.equal(t.textContent,'Hi.');
 f.step(240);f.step(320);assert.equal(t.textContent,'Hi.');
 f.step(400);assert.equal(t.textContent,'Hi. A');
 assert.equal(f.pulses[0].speaker,'rover');assert.equal(f.pulses[0].first,true);
 assert.ok(f.pulses.every(c=>typeof c.character==='string' && Number.isInteger(c.index)));
 const count=f.pulses.length;f.step(480);assert.equal(f.pulses.length,count);
});

test('reduced motion completes immediately without scheduling or voice pulses',()=>{
 const f=fixture(),t=f.target();f.setReduced(true);f.mount(t,'A quiet thought.');
 assert.equal(t.textContent,'A quiet thought.');assert.equal(f.hasFrame(),false);assert.equal(f.pulses.length,0);
 const replacement=f.target();f.mount(replacement,'A quiet thought.');
 assert.equal(replacement.textContent,t.textContent);assert.equal(f.pulses.length,0);
});

test('enabling reduced motion during a thought finishes silently',()=>{
 const f=fixture(),t=f.target();f.mount(t);f.step(0);f.step(80);
 const count=f.pulses.length;f.setReduced(true);f.step(160);
 assert.equal(t.textContent,'A thought that takes a little time to reach the screen.');
 assert.equal(f.hasFrame(),false);assert.equal(f.pulses.length,count);
});

test('one onset and one spaced clause accent carry emotion without letter chatter',()=>{
 const f=fixture(),t=f.target();
 const text='The storm is blocking sunlight from my panels. There is less to work with today. I can wait.';
 f.mount(t,text,'storm','strained');
 for(let now=0;now<=6000;now+=80){
  f.step(now);
  if(now===320)f.mount(f.target(),text,'storm','strained');
 }
 assert.equal(f.pulses.length,2);
 assert.deepEqual(f.pulses.map(p=>p.first),[true,false]);
 assert.ok(f.pulses[1].at-f.pulses[0].at>=1200);
 assert.ok(f.pulses.every(p=>p.emotion==='strained'));
 assert.deepEqual(f.pulses.map(p=>p.accent),['start','clause']);
 assert.equal(f.pulses[1].punctuation,false);
 assert.equal(text[f.pulses[1].index],f.pulses[1].character);
});

test('paused reveal never catches up tones and same-line completed rerenders stay silent',()=>{
 const f=fixture(),t=f.target();
 const text='I can keep still and save a little warmth for morning. They will be there for the next picture.';
 f.mount(t,text,'waiting','reassuring');f.step(0);f.step(80);
 assert.equal(f.pulses.length,1);
 f.setPaused(true);f.step(5000);f.step(10000);
 assert.equal(f.pulses.length,1);
 f.setPaused(false);f.step(15000);
 assert.equal(f.pulses.length,1);
 for(let now=15080;now<=21000;now+=80)f.step(now);
 assert.ok(f.pulses.length<=2);
 const count=f.pulses.length;
 f.mount(f.target(),text,'waiting','reassuring');f.step(22000);
 assert.equal(f.pulses.length,count);
});
