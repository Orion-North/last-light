import { createInstrumentBank } from '../../src/audio/instruments.js';
import { createScoreSpace } from '../../src/audio/space.js';
import { phrase, SECTIONS } from '../../src/audio/score.js';
const status = document.querySelector('#status'), results = document.querySelector('#results');
let oldUrl;
async function render(section, variation = 0, dry = false, bypass = false, family = null) {
  const score = phrase(section, variation), rate = 44100;
  const context = new OfflineAudioContext(2, Math.ceil((score.seconds + 1) * rate), rate);
  const master = context.createGain(); master.gain.value = .52;
  const compressor = context.createDynamicsCompressor();
  Object.entries({threshold:-18,knee:18,ratio:3,attack:.025,release:.35}).forEach(([k,v]) => compressor[k].value = v);
  if (bypass) master.connect(context.destination);
  else master.connect(compressor).connect(context.destination);
  const space = dry ? {input:master,destroy(){}} : createScoreSpace(context, master), bank = createInstrumentBank(context);
  const began = performance.now();
  for (const event of score.events.filter(e => !family || e.instrument === family)) bank.play(event, .5 + event.at * SECTIONS[section].eighth, space.input);
  const synthesisMs = performance.now() - began;
  const audio = await context.startRendering();
  let peak=0, peakAt=0, squares=0, difference=0, nonfinite=0;
  const left=audio.getChannelData(0), right=audio.getChannelData(1);
  for (let i=0;i<audio.length;i++) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) nonfinite++;
    if (Math.max(Math.abs(left[i]),Math.abs(right[i]))>peak) {peak=Math.max(Math.abs(left[i]),Math.abs(right[i]));peakAt=i/rate;}
    squares+=left[i]**2+right[i]**2; difference+=(left[i]-right[i])**2;
  }
  const rms=Math.sqrt(squares/(2*audio.length));
  const report={section,variation,dry,bypass,family,seconds:+audio.duration.toFixed(2),events:score.events.length,peak:+peak.toFixed(5),peakAt:+peakAt.toFixed(5),rms:+rms.toFixed(5),stereoDifference:+Math.sqrt(difference/audio.length).toFixed(5),synthesisMs:+synthesisMs.toFixed(1),nonfinite};
  report.pass = !nonfinite && peak<.98 && rms>=.001 && difference>0;
  space.destroy(); bank.clear();
  return {audio, report};
}
function wav(audio) {
  const data=new ArrayBuffer(44+audio.length*4), view=new DataView(data);
  const text=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,data.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,audio.sampleRate,true);view.setUint32(28,audio.sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,audio.length*4,true);
  const channels=[audio.getChannelData(0),audio.getChannelData(1)];
  for(let i=0;i<audio.length;i++) for(let c=0;c<2;c++) view.setInt16(44+i*4+c*2,Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),true);
  return new Blob([data],{type:'audio/wav'});
}
document.querySelector('#render').onclick=async()=>{
  status.textContent='Rendering…';
  try {
    const section=document.querySelector('#section').value;
    const {audio,report}=await render(section);
    if(!report.pass) throw new Error(JSON.stringify(report));
    if(oldUrl) URL.revokeObjectURL(oldUrl);
    oldUrl=URL.createObjectURL(wav(audio));
    document.querySelector('#player').src=oldUrl;
    const link=document.querySelector('#download');link.href=oldUrl;link.download=`last-light-v18-${section}.wav`;link.textContent='Download WAV';link.hidden=false;
    results.textContent=JSON.stringify(report,null,2);status.textContent='Audition ready';
  } catch(e) {status.textContent=`FAIL: ${e.message}`;}
};
document.querySelector('#verify').onclick=async()=>{
  const reports=[]; results.textContent='';
  try {
    for(const section of Object.keys(SECTIONS).filter(s=>s!=='silence')) for(const variation of [0,1]) {
      status.textContent=`Verifying ${section} / ${variation}`;
      const {report}=await render(section,variation);reports.push(report);
      if(!report.pass) throw new Error(JSON.stringify(report));
      results.textContent=reports.map(r=>JSON.stringify(r)).join('\n');
    }
    status.textContent=`PASS: ${reports.length} stereo renders; finite, nonzero, no clipping`;
  } catch(e) {status.textContent=`FAIL: ${e.message}`;}
};

document.querySelector('#diagnose').onclick=async()=>{
  status.textContent='Diagnosing…'; const reports=[];
  for(const family of ['pluck','organ','strings','bass','pulse']) {
    const {report}=await render('amber',0,true,true,family);reports.push(report);
    results.textContent=reports.map(r=>JSON.stringify(r)).join('\n');
  }
  status.textContent='Diagnosis ready';
};
