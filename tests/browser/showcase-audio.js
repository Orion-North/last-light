/** Edited showcase soundtrack, assembled from the game's original production
 * score and instruments. This is not an exact recording of live gameplay. */
import { createInstrumentBank } from '../../src/audio/instruments.js';
import { createScoreSpace } from '../../src/audio/space.js';
import { phrase, SECTIONS, SIGNAL_QUESTION, SIGNAL_ANSWER } from '../../src/audio/score.js';

export const DEFAULT_SEGMENTS = [
  { start: 0, end: 8, section: 'discovery', variation: 0 },
  { start: 8, end: 14, section: 'discovery', variation: 2 },
  { start: 14, end: 24, section: 'geology', variation: 0 },
  { start: 24, end: 34, section: 'geology', variation: 2 },
  { start: 34, end: 48, section: 'amber', variation: 0 },
  { start: 48, end: 56, section: 'storm', variation: 0 },
  { start: 56, end: 66, section: 'fading', variation: 0 },
  { start: 66, end: 74, section: 'waiting', variation: 1 },
  { start: 74, end: 80, section: 'remembrance', variation: 0, gain: 1.15 },
];
// A null answer deliberately schedules no reply. The hold mutes the complete
// score return (including reverb) so an absent receipt stays audibly absent.
export const DEFAULT_SIGNALS = [
  { at: 40.333, answerAt: 42.750, holdUntil: 48 },
  { at: 60.250, answerAt: null, holdUntil: 66 },
  { at: 70.250, answerAt: null, holdUntil: 74 },
];

function signal(context, output, pattern, at) {
  for (const [note, delay, duration, volume] of pattern) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const when = at + delay;
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    gain.gain.value = 0; gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    oscillator.connect(gain).connect(output);
    oscillator.start(when); oscillator.stop(when + duration + .04);
  }
}

export async function renderShowcaseAudio({ duration = 80, segments = DEFAULT_SEGMENTS, signals = DEFAULT_SIGNALS, sampleRate = 44100 } = {}) {
  if (!(duration > 0 && duration <= 600)) throw new Error('Duration must be between 0 and 600 seconds');
  for (const s of segments) if (!SECTIONS[s.section] || !(s.start >= 0 && s.end > s.start && s.end <= duration)) throw new Error('Invalid music segment');
  const holds = signals.map(s => ({start: s.at, end: s.holdUntil ?? ((s.answerAt ?? s.at) + 2.7)})).sort((a,b)=>a.start-b.start);
  for (let i=0;i<holds.length;i++) if (!(holds[i].start >= 0 && holds[i].end > holds[i].start && holds[i].end <= duration) || (i && holds[i].start < holds[i-1].end)) throw new Error('Invalid or overlapping signal holds');
  const context = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const master = context.createGain(); master.gain.value = .52;
  const compressor = context.createDynamicsCompressor();
  Object.entries({threshold:-18,knee:18,ratio:3,attack:.025,release:.35}).forEach(([k,v])=>compressor[k].value=v);
  master.connect(compressor).connect(context.destination);
  const music = context.createGain(); music.connect(master); music.gain.value = 1;
  for (const hold of holds) {
    music.gain.setValueAtTime(1, Math.max(0,hold.start-.025));
    music.gain.linearRampToValueAtTime(0, hold.start);
    music.gain.setValueAtTime(0, hold.end);
    music.gain.linearRampToValueAtTime(1, Math.min(duration,hold.end+.25));
  }
  const bank = createInstrumentBank(context), rooms = [];
  let events = 0;
  for (const segment of segments) {
    const bus = context.createGain(); bus.gain.value = 0; bus.connect(music);
    const level = segment.gain ?? 1, span = segment.end-segment.start;
    bus.gain.setValueAtTime(0, segment.start);
    bus.gain.linearRampToValueAtTime(level, segment.start+Math.min(.5,span/4));
    bus.gain.setValueAtTime(level, segment.end-Math.min(.8,span/4));
    bus.gain.linearRampToValueAtTime(0, segment.end);
    const room = createScoreSpace(context,bus); rooms.push(room);
    for (const event of phrase(segment.section,segment.variation ?? 0).events) {
      const when = segment.start + event.at * SECTIONS[segment.section].eighth;
      if (when >= segment.end-.12) continue;
      bank.play({...event,duration:Math.min(event.duration,segment.end-when)},when,room.input); events++;
    }
  }
  for (const entry of signals) {
    signal(context,master,entry.partial ? SIGNAL_QUESTION.slice(0,3) : SIGNAL_QUESTION,entry.at);
    if (Number.isFinite(entry.answerAt)) signal(context,master,SIGNAL_ANSWER,entry.answerAt);
  }
  const audio = await context.startRendering();
  let peak=0,squares=0,difference=0,nonfinite=0,peakAt=0;
  const left=audio.getChannelData(0),right=audio.getChannelData(1);
  for(let i=0;i<audio.length;i++) {
    if(!Number.isFinite(left[i])||!Number.isFinite(right[i])) nonfinite++;
    const p=Math.max(Math.abs(left[i]),Math.abs(right[i])); if(p>peak){peak=p;peakAt=i/sampleRate;}
    squares+=left[i]**2+right[i]**2;difference+=(left[i]-right[i])**2;
  }
  const unansweredWindows=signals.filter(s=>s.answerAt == null).map(s=>{
    const start=s.at+1.7,end=s.holdUntil ?? s.at+2.7;let energy=0,windowPeak=0,count=0;
    for(let i=Math.ceil(start*sampleRate);i<Math.floor(end*sampleRate);i++){energy+=left[i]**2+right[i]**2;windowPeak=Math.max(windowPeak,Math.abs(left[i]),Math.abs(right[i]));count++;}
    return {start,end,peak:windowPeak,rms:count ? Math.sqrt(energy/(count*2)) : 0};
  });
  const report={kind:'edited production-score soundtrack; not live audio capture',seconds:audio.duration,events,peak,peakAt,rms:Math.sqrt(squares/(audio.length*2)),stereoDifference:Math.sqrt(difference/audio.length),nonfinite,unansweredWindows,segments,signals};
  report.pass=!nonfinite && peak<.98 && report.rms>.001 && report.stereoDifference>0;
  rooms.forEach(room=>room.destroy()); bank.clear();
  return {audio,report,wav:encodeWav(audio)};
}

export function encodeWav(audio) {
  const data=new ArrayBuffer(44+audio.length*4),view=new DataView(data);
  const text=(at,s)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,data.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,audio.sampleRate,true);view.setUint32(28,audio.sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,audio.length*4,true);
  const channels=[audio.getChannelData(0),audio.getChannelData(1)];
  for(let i=0;i<audio.length;i++)for(let c=0;c<2;c++)view.setInt16(44+i*4+c*2,Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),true);
  return new Blob([data],{type:'audio/wav'});
}

window.renderShowcaseAudio=renderShowcaseAudio;
let oldUrl;
document.querySelector('#render')?.addEventListener('click',async()=>{
  const status=document.querySelector('#status'),button=document.querySelector('#render');
  button.disabled=true;status.textContent='Rendering original soundtrack…';
  try {
    const result=await renderShowcaseAudio();
    document.querySelector('#results').textContent=JSON.stringify(result.report,null,2);
    if(!result.report.pass)throw new Error('Audio metrics failed');
    if(oldUrl)URL.revokeObjectURL(oldUrl);oldUrl=URL.createObjectURL(result.wav);
    document.querySelector('#player').src=oldUrl;
    const link=document.querySelector('#download');link.href=oldUrl;link.download='last-light-showcase-edited-score.wav';link.hidden=false;
    status.textContent='Ready: 80-second stereo WAV';
  } catch(error){status.textContent=`FAIL: ${error.message}`;} finally{button.disabled=false;}
});
