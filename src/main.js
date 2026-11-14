import { scenes, sources, credits } from './content/story.js';
import { createState, transition } from './engine/game.js';
import { createSound } from './audio/sound.js';
import { createLandscape } from './ui/landscape.js';
import { restoreSession, serializeSession } from './session.js';
import { createController } from './input/controller.js';
import { createInteractionWait } from './engine/interaction-wait.js';
import { discoveredScenes, transmissionProfile, missionConditions, endingMemories } from './ui/experience.js';

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const canvas = $('#atmosphere');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paragraphs = (text) => String(text).split('\n\n').map(p => `<p>${escape(p)}</p>`).join('');
const arrow = '<span aria-hidden="true">↗</span>';
const storageKey = 'last-light-journey-v1';
let state = createState();
let saved = null;
let settings = { haptics: true, sound: false, motion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: matchMedia('(any-pointer: coarse)').matches };
try {
  saved = restoreSession(localStorage.getItem(storageKey), scenes);
  const storedSettings = JSON.parse(localStorage.getItem('last-light-settings'));
  if (storedSettings && typeof storedSettings.motion === 'boolean') settings.motion = storedSettings.motion;
  if (storedSettings && typeof storedSettings.haptics === 'boolean') settings.haptics = storedSettings.haptics;
  if (storedSettings && typeof storedSettings.touch === 'boolean') settings.touch = storedSettings.touch;
} catch { /* Private browsing can still play. */ }
let screen = 'title';
let view;
let controller;
let padInput = { throttle: 0, steer: 0 };
let scanning = false;
let scanTimer = 0;
let lastDistance = 0;
let worldReady = false;
let graphicsError = false;
let soundPreferenceSet = false;
let lastScene = null;
let reached = false;
let exploring = false;
let transmitting = false;
let restoreSendFocus = false;
let inputDevice = settings.touch ? 'touch' : 'keyboard';
const transmissionWait = createInteractionWait();
const sound = createSound();
sound.setMuted(true);
const goals = {
  1: { x: 7, z: -7, label: 'Last Chance outcrop' },
  2: { x: -5, z: -10, label: 'Berry Bowl' },
  3: { x: -11, z: 3, label: 'The next horizon' },
  4: { x: 6, z: 10, label: 'Perseverance Valley' },
  5: { x: 13, z: -2, label: 'A clearer view of the sky' },
  6: { x: 3, z: -4, label: 'The last sunlit ridge' },
};

function announce(text) { $('#announcement').textContent = text; }
function save() {
  saved = state;
  try { localStorage.setItem(storageKey, serializeSession(state)); } catch { /* Optional. */ }
}
function focusContent(selector = 'h1') {
  requestAnimationFrame(() => app.querySelector(selector)?.focus({ preventScroll: true }));
}
function setExploring(value) {
  exploring = value;
  document.body.classList.toggle('exploring', value);
  $('#explore-toggle').textContent = value ? 'Show HUD' : 'Hide HUD';
  $('#explore-toggle').setAttribute('aria-expanded', String(!value));
  const panel = app.querySelector('.interaction-dock');
  if (panel) panel.inert = value;
}
function setWorld(environment, mode) {
  document.body.dataset.environment = environment;
  document.body.dataset.screen = mode;
  view?.setScene(environment, { power: scenes[state.sceneIndex]?.power ?? 100, signal: scenes[state.sceneIndex]?.signal ?? 100 });
  view?.setMode?.(mode);
  sound.setScene(environment);
  sound.setNarrative?.(mode === 'title' ? -1 : state.sceneIndex, state.phase);
  $('#world-controls').hidden = mode !== 'game';
  if(mode !== 'game') {$('#waypoint-hud').hidden=true;view?.setDrive?.({forward:0,turn:0});view?.setLook?.({x:0,y:0});}
}

function renderTitle() {
  cancelTransmission();
  restoreSendFocus = false;
  screen = 'title';
  setExploring(false);
  setWorld('sunset', 'title');
  app.innerHTML = `<section class="title-screen">
    <p class="eyebrow">MARS EXPLORATION ROVER · MER-B</p>
    <h1 class="title" tabindex="-1">Last<br><em>Light.</em></h1>
    <p class="title-kicker">You were built for ninety days.<br>You stayed for fourteen years.</p>
    <p class="title-description">A small rover. An impossible distance.<br>A world worth sending home.</p>
    <div class="title-actions"><button class="primary-button" data-action="begin">${saved ? (saved.complete ? 'Return to your memories' : 'Continue your journey') : 'Begin the journey'} ${arrow}</button>
    ${saved ? '<button class="secondary-button" data-action="restart">Start anew</button>' : '<button class="secondary-button" data-action="about">The story behind the story</button>'}</div>
    <p class="session-note">A SHORT, SELF-PACED 3D EXPERIENCE · HEADPHONES ENCOURAGED<br>SOUND STARTS WITH YOUR JOURNEY · MUTE ANYTIME<br>History is fixed. What you carry home is yours.</p>
    <div class="title-bottom"><div class="coordinates">MERIDIANI PLANUM<strong>02° SOUTH / 354° EAST</strong></div><div class="mission-mark">AN IMAGINED INNER LIFE<strong>A VERY REAL EXPLORER</strong></div></div>
  </section>`;
}

function telemetry(scene) {
  return `<aside class="flight-status" aria-label="Dramatized mission conditions">${missionConditions(scene).map(text=>`<span>${text}</span>`).join('')}<span aria-label="${state.memories.length} memories">◇ ${state.memories.length}</span></aside>`;
}

function contactMark(mode, waiting = false) {
  const answered = mode === 'reply' && !waiting;
  return `<div class="contact-mark ${waiting ? 'waiting' : ''} ${mode}" aria-hidden="true"><span>●</span><i></i><span>${answered ? '●' : '○'}</span></div>`;
}

function updateInputHint() {
  const moving = screen === 'game' && state.phase === 'observe' && !reached;
  const hints = {
    touch: moving ? 'Hold arrows to drive · Drag to look' : 'Tap to interact · Drag to look',
    keyboard: moving ? 'WASD / arrows drive · Drag to look' : 'Tab to select · Enter to interact · J journal',
    dualsense: moving ? 'L drive · R look · × interact' : 'D-pad select · × interact · □ journal',
    gamepad: moving ? 'Left stick drive · Right stick look' : 'D-pad select · Bottom button interact',
  };
  $('#input-hint').textContent = hints[inputDevice];
}

function renderGame({ focus = false } = {}) {
  if (state.complete) return renderEnding();
  screen = 'game';
  const scene = scenes[state.sceneIndex];
  if (lastScene !== scene.id) {
    reached = !goals[state.sceneIndex] || state.phase !== 'observe';
    lastScene = scene.id;
    setWorld(scene.environment, 'game');
    view?.setObservationTarget?.(goals[state.sceneIndex] || null);
    view?.setWaypoint?.(goals[state.sceneIndex] && !reached ? goals[state.sceneIndex] : null);
    if (state.phase !== 'observe') view?.inspect?.();
    setExploring(false);
  } else document.body.dataset.screen = 'game';
  sound.setNarrative?.(state.sceneIndex,state.phase);
  const choice = scene.choices.find(c=>c.id===state.selected);
  const goal = goals[state.sceneIndex];
  const contact = transmissionProfile(scene);
  $('#waypoint-hud').hidden=!goal || reached || state.phase!=='observe';
  $('#waypoint-hud').textContent=goal ? `◇ ${goal.label}` : '';
  let content = '';
  if (state.phase === 'observe') {
    content = `<p class="inner-voice">${escape(scene.subtitle || scene.thought)}</p>`;
    if (goal && !reached) content += `<div class="objective-line"><span id="objective-distance">${graphicsError ? '3D unavailable on this device' : 'Follow the amber beacon'}</span><button class="quiet-button" data-action="${graphicsError?'text-only':'assist'}" ${!worldReady&&!graphicsError?'disabled':''}>${graphicsError?'Continue story':'Autodrive'}</button></div>`;
    else content += `<button class="primary-button" data-action="observe" ${scanning?'disabled':''}>${scanning?'Looking closely…':escape(scene.objective || scene.actionLabel)} <span aria-hidden="true">◇</span></button>`;
    if (state.sceneIndex <= 1) content += '<p class="pace-note">Take your time. Exploring does not use up power.</p>';
  } else if (state.phase === 'choose') {
    content = `<p class="discovery-line">${escape(scene.discovery)}</p><div class="choices compact-choices">${scene.choices.map(c=>`<button class="choice" data-action="choose" data-choice="${escape(c.id)}"><span class="choice-label">${escape(c.shortLabel || c.label)}</span><span class="choice-detail">Choose a memory ◇</span></button>`).join('')}</div>`;
  } else if (state.phase === 'transmit') {
    content = `<p class="inner-voice">${escape(choice.shortReply || choice.reply)}</p>${transmitting ? `${contactMark(contact.mode,true)}<p class="contact-status" role="status">${contact.waiting}</p>` : `<button class="primary-button" data-action="transmit">${contact.action} ${arrow}</button>`}`;
  } else {
    content = `${contactMark(contact.mode)}<p class="transmission-label">${contact.result}</p><p class="transmission-text" tabindex="-1">${escape(scene.response || scene.transmission)}</p><button class="quiet-button continue-button" data-action="next">${scenes[state.sceneIndex+1]?.end ? 'Carry these memories' : scene.signal ? 'Keep going' : 'When you’re ready'} ${arrow}</button>`;
  }
  app.innerHTML = `<section class="play-screen"><header class="play-heading"><p class="eyebrow">${escape(scene.sol)}</p><h1 tabindex="-1">${escape(state.phase==='observe' ? scene.approachTitle || scene.title : scene.title)}</h1></header>${telemetry(scene)}<article class="interaction-dock" aria-label="Current interaction" aria-busy="${scanning || transmitting}">${content}<div class="dock-footer"><span>${scene.act===1?'WONDER':scene.act===2?'THE STORM':'REMEMBRANCE'}</span><button class="quiet-button" data-action="journal">Journal</button></div></article></section>`;
  setExploring(exploring);
  $('#world-controls').hidden = false;
  document.querySelectorAll('[data-drive]').forEach(b=>b.disabled = scene.signal === 0 || scanning || transmitting);
  updateInputHint();
  controller?.setTerrain({moving:false,blocked:false,power:scene.power/100});
  if (focus) focusContent(state.phase==='received' ? '.transmission-text' : state.phase==='transmit' ? '[data-action="transmit"]' : 'h1');
}

function openJournal() {
  const scene = scenes[state.sceneIndex];
  const discoveries = discoveredScenes(state, scenes);
  $('#journal-content').innerHTML = `<p class="hint">Inner thoughts and Earth replies are fiction. Travel, conditions, and communication timing are dramatized. Exploring does not spend power.</p>${state.phase==='observe' ? `<p class="journal-locked">${escape(scene.approachTitle || scene.title)}<br>Look closely to add this discovery.</p>` : ''}<h3>Discoveries · ${discoveries.length}</h3>${discoveries.map(item=>{
    const source=sources.find(s=>s.id===item.observation.sourceId);
    return `<details class="discovery-entry" ${item.id===scene.id?'open':''}><summary>${escape(item.observation.title)}</summary><p>${escape(item.discovery)}</p>${paragraphs(item.observation.text)}<p>${escape(item.observation.fact || '')}</p>${source?`<a href="${escape(source.url)}" target="_blank" rel="noreferrer">NASA source ↗</a>`:''}</details>`;
  }).join('') || '<p>Your observations will appear here after you make them.</p>'}<h3>Your memories · ${state.memories.length}</h3><div class="archive-grid">${state.memories.map(m=>`<article class="memory-card"><h4>${escape(m.title)}</h4><p>${escape(m.text)}</p></article>`).join('') || '<p>Something worth remembering is waiting out there.</p>'}</div>`;
  openModal('#journal-modal');
}

function renderEnding() {
  screen = 'ending';
  setExploring(false);
  setWorld('dawn', 'ending');
  view?.setWaypoint?.(null);
  controller?.setTerrain({moving:false,blocked:false,power:0});
  const scene = scenes.at(-1);
  app.innerHTML = `<section class="ending-screen brief-ending"><p class="eyebrow">OPPORTUNITY · 2004–2018</p><h1 class="ending-title" tabindex="-1">You were here.</h1><p class="inner-voice">${escape(scene.subtitle)}</p><div class="mission-numbers"><div><strong>90</strong><span>SOLS PLANNED</span></div><div><strong>5,111</strong><span>SOLS TO LAST CONTACT</span></div><div><strong>${state.memories.length}</strong><span>MEMORIES WITH YOU</span></div></div><ul class="memory-echoes" aria-label="Moments you chose">${endingMemories(state.memories).map(m=>`<li>${escape(m.title)}</li>`).join('')}</ul><p class="ending-fact">Opportunity revealed evidence of ancient water on Mars. NASA declared the mission complete on February 13, 2019.</p><div class="ending-actions"><button class="primary-button" data-action="journal">Open your memories ◇</button><button class="secondary-button" data-action="download">Keep them ↓</button><button class="quiet-button" data-action="restart">Begin again</button></div></section>`;
  focusContent();
}

function scan() {
  if (scanning || state.paused || !reached || state.phase !== 'observe') return;
  if (scenes[state.sceneIndex].signal === 0 || settings.motion || graphicsError) return act({type:'OBSERVE'});
  scanning = true;
  drive();
  view?.inspect?.();
  controller?.feedback('observe');
  document.body.classList.add('scanning');
  renderGame();
  scanTimer = setTimeout(()=>{
    scanning=false; document.body.classList.remove('scanning');
    act({type:'OBSERVE'});
  },1000);
}

function sendMemory() {
  if (transmitting || state.paused || state.phase !== 'transmit' || screen !== 'game') return;
  const contact = transmissionProfile(scenes[state.sceneIndex]);
  if (!contact.delay) return act({type:'TRANSMIT'});
  transmitting = true;
  drive();
  if (contact.mode !== 'silence') { sound.cue('transmit'); controller?.feedback('transmit'); }
  renderGame();
  announce(contact.waiting);
  transmissionWait.start(contact.delay,()=>{
    transmitting = false;
    act({type:'TRANSMIT'});
  });
}

function cancelTransmission() {
  transmissionWait.cancel();
  const wasTransmitting = transmitting;
  transmitting = false;
  if (wasTransmitting && screen === 'game') {
    restoreSendFocus = true;
    renderGame();
    announce('Transmission paused. Send again when you are ready.');
  }
}
function cancelScan() {
  clearTimeout(scanTimer);
  const wasScanning=scanning;
  scanning=false;document.body.classList.remove('scanning');
  if(wasScanning && screen==='game') renderGame();
}

function act(action) {
  if (action.type === 'OBSERVE' && !reached) return;
  const old = state;
  state = transition(state, action, scenes);
  if (old === state) return;
  const cue = { OBSERVE:'observe', CHOOSE:'choose' }[action.type];
  if (cue) { sound.cue(cue); controller?.feedback(cue); }
  if (action.type === 'OBSERVE') { view?.inspect?.(); view?.setWaypoint?.(null); }
  if (state.complete) sound.cue('end');
  save();
  renderGame({focus:true});
  if (action.type === 'TRANSMIT') {
    const contact = transmissionProfile(scenes[state.sceneIndex]);
    if (contact.mode === 'reply') sound.cue('received');
    announce(contact.result);
  }
  if (action.type === 'NEXT') window.scrollTo({top:0,behavior:'instant'});
}

function pause() {
  cancelScan();
  cancelTransmission();
  pressed.clear();padInput={throttle:0,steer:0};
  controller?.setPaused(true);
  state = transition(state,{type:'PAUSE'},scenes);
  view?.setPaused(true); view?.setDrive?.({forward:0,turn:0}); sound.pause();
}
function resume() {
  if (document.hidden || document.querySelector('dialog[open]')) return;
  state = transition(state,{type:'RESUME'},scenes);
  view?.setPaused(false); controller?.setPaused(false); if (settings.sound) sound.resume();
  if (restoreSendFocus && screen === 'game' && state.phase === 'transmit') focusContent('[data-action="transmit"]');
  restoreSendFocus = false;
}
function openModal(id) { pause(); $(id).showModal(); }
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close', resume);
  dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
});

async function toggleSound(enabled) {
  settings.sound = enabled;
  sound.setMuted(!enabled);
  if (enabled) {
    // Request the audio context while still inside the tap gesture on Safari.
    const resuming = sound.resume();
    const starting = sound.start();
    await resuming;
    const started = await starting;
    if (document.querySelector('dialog[open]')) sound.pause();
    if (!started) {
      settings.sound = false;
      sound.setMuted(true);
      announce('Audio is unavailable. The complete story is playable without sound.');
    }
  }
  $('#sound-toggle').setAttribute('aria-pressed', String(settings.sound));
  $('#sound-toggle').setAttribute('aria-label', settings.sound?'Mute sound':'Enable sound');
  $('#sound-toggle .button-label').textContent = settings.sound ? 'SOUND ON' : 'SOUND OFF';
  $('#sound-setting').checked = settings.sound;
}
function applyMotion() {
  document.body.classList.toggle('reduced-motion',settings.motion);
  document.body.classList.toggle('touch-controls',settings.touch);
  $('#motion-setting').checked = settings.motion;
  $('#touch-setting').checked = settings.touch;
  view?.setReducedMotion(settings.motion);
  try { localStorage.setItem('last-light-settings',JSON.stringify({motion:settings.motion,haptics:settings.haptics,touch:settings.touch})); } catch { /* Optional. */ }
}

$('#credits-content').innerHTML = `<p>${escape(credits)}</p><h3>Built to remember</h3><p>Original story and procedural sound. The interactive terrain is an artistic reconstruction, not a surveyed map. Rover model: NASA/JPL-Caltech. Rendering: Three.js (MIT). Generated poster art is used only if 3D graphics are unavailable.</p><p>This independent project is not affiliated with or endorsed by NASA. Inspiration: the scale of Journey, the curiosity of Outer Wilds, and the grounded science fiction of The Invincible.</p><h3>Primary mission sources</h3><ul class="sources-list">${sources.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)} ↗</a>${s.credit ? `<small>${escape(s.credit)}</small>`:''}</li>`).join('')}<li><a href="https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/" target="_blank" rel="noreferrer">NASA/JPL-Caltech rover model ↗</a></li><li><a href="./vendor/three/LICENSE" target="_blank">Three.js MIT license ↗</a></li></ul>`;
$('#sound-toggle').addEventListener('click',()=>{soundPreferenceSet=true;toggleSound(!settings.sound);});
$('#sound-setting').addEventListener('change',event=>{soundPreferenceSet=true;toggleSound(event.target.checked);});
$('#motion-setting').addEventListener('change',event=>{settings.motion=event.target.checked;applyMotion();});
$('#touch-setting').addEventListener('change',event=>{
  settings.touch=event.target.checked;
  if (inputDevice==='touch' || inputDevice==='keyboard') inputDevice=settings.touch?'touch':'keyboard';
  applyMotion();updateInputHint();
});
$('#settings-toggle').addEventListener('click',()=>openModal('#settings-modal'));
$('#credits-button').addEventListener('click',()=>{$('#settings-modal').close();openModal('#credits-modal');});
$('#restart-button').addEventListener('click',()=>{$('#settings-modal').close();openModal('#restart-modal');});
$('#confirm-restart').addEventListener('click',()=>{
  $('#restart-modal').close(); cancelScan();cancelTransmission();lastDistance=0; state=createState(); lastScene=null; reached=false; save();
  view?.reset?.(); renderGame({focus:true}); window.scrollTo(0,0);
});
$('.brand').addEventListener('click',event=>{event.preventDefault();cancelScan();renderTitle();window.scrollTo(0,0);});
$('#explore-toggle').addEventListener('click',()=>setExploring(!exploring));
$('#camera-reset').addEventListener('click',()=>view?.focusRover?.());

app.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  switch(button.dataset.action) {
    case 'begin': if(!soundPreferenceSet)toggleSound(true); state=saved || createState(); state={...state,paused:false}; lastScene=null; renderGame({focus:true}); save(); break;
    case 'observe': scan(); break;
    case 'choose': act({type:'CHOOSE',choiceId:button.dataset.choice}); break;
    case 'transmit': sendMemory(); break;
    case 'next': act({type:'NEXT'}); break;
    case 'about': openModal('#credits-modal'); break;
    case 'journal': openJournal(); break;
    case 'restart': openModal('#restart-modal'); break;
    case 'text-only': reached=true;renderGame({focus:true});break;
    case 'assist':
      if(view?.travelToWaypoint?.()) {
        setExploring(true);
        announce('Driving toward the marked observation. The story will return when you arrive.');
      } else announce('The route is not ready yet. Wait for the rover to load or drive with the controls.');
      break;
    case 'download': {
      const text=['LAST LIGHT — The things I carried home','An imagined archive of NASA’s Opportunity mission.','',...state.memories.map(m=>`${m.title}\n${m.text}\n`),'',credits,'',...sources.map(s=>`${s.title}\n${s.url}`)].join('\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='last-light-my-memories.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
    }
  }
});

const pressed = new Set();
function drive() {
  if (screen !== 'game' || state.paused || scanning || transmitting || scenes[state.sceneIndex].signal === 0) return view?.setDrive?.({forward:0,turn:0});
  const forward=(pressed.has('w')||pressed.has('arrowup')?1:0)-(pressed.has('s')||pressed.has('arrowdown')?1:0);
  const turn=(pressed.has('a')||pressed.has('arrowleft')?1:0)-(pressed.has('d')||pressed.has('arrowright')?1:0);
  view?.setDrive?.({forward:Math.max(-1,Math.min(1,forward+padInput.throttle)),turn:Math.max(-1,Math.min(1,turn-padInput.steer))});
}
window.addEventListener('keydown',event=>{
  if (event.key==='Escape' && !document.querySelector('dialog[open]')) { event.preventDefault();openModal('#settings-modal');return; }
  if (event.key.toLowerCase()==='j' && !document.querySelector('dialog[open]') && screen!=='title') {event.preventDefault();openJournal();return;}
  if (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) || document.querySelector('dialog[open]')) return;
  const key=event.key.toLowerCase();
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key) && screen==='game') {event.preventDefault();pressed.add(key);drive();}
});
window.addEventListener('keyup',event=>{pressed.delete(event.key.toLowerCase());drive();});
window.addEventListener('blur',()=>{pressed.clear();drive();});
document.querySelectorAll('[data-drive]').forEach(button=>{
  const key={forward:'w',back:'s',left:'a',right:'d'}[button.dataset.drive];
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);pressed.add(key);drive();});
  for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,()=>{pressed.delete(key);drive();});
  button.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();pressed.add(key);drive();}});
  button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter'){pressed.delete(key);drive();}});
});
document.addEventListener('visibilitychange',()=>{pressed.clear();if(document.hidden)pause();else resume();});

canvas.addEventListener('world-status',event=>{
  const {state:status,message}=event.detail;
  worldReady=status==='ready';
  graphicsError=status==='error';
  $('#world-status').textContent=message;
  $('#world-status').dataset.state=status;
  if(status==='error') { $('.world').dataset.fallback='true'; announce(message); }
  if(screen==='game' && state.phase==='observe') renderGame();
});
canvas.addEventListener('waypoint-reached',()=>{
  if(screen!=='game'||!goals[state.sceneIndex]||reached) return;
  reached=true; setExploring(false); renderGame({focus:true});
  announce('Observation reached. Scan to discover it.');sound.cue('observe');controller?.feedback('arrival');
});
canvas.addEventListener('rover-move',event=>{
  const moving=event.detail.distance>lastDistance+.001; lastDistance=event.detail.distance;
  controller?.setTerrain({moving:moving||!!event.detail.blocked,blocked:!!event.detail.blocked,power:scenes[state.sceneIndex].power/100,speed:event.detail.speed,roughness:event.detail.roughness,slip:event.detail.slip});
  const el=$('#objective-distance');
  if(el && Number.isFinite(event.detail.remaining)) el.textContent=`${event.detail.remaining.toFixed(1)} m to the observation`;
  if(goals[state.sceneIndex] && !reached && Number.isFinite(event.detail.remaining)) $('#waypoint-hud').textContent=`◇ ${goals[state.sceneIndex].label} · ${event.detail.remaining.toFixed(1)} m`;
});
function menuTargets() {
  const root=document.querySelector('dialog[open]') || app;
  return [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),summary,a[href]')].filter(el=>!el.hidden && !el.closest('[hidden],[inert]') && el.getClientRects().length);
}
function controllerAction(action) {
  const dialog=document.querySelector('dialog[open]');
  if(action==='pause') { if(dialog) dialog.close(); else openModal('#settings-modal'); return; }
  if(action==='back') { if(dialog) dialog.close(); else if(exploring) setExploring(false); else openModal('#settings-modal'); return; }
  if(action==='journal') { if(dialog?.id==='journal-modal') dialog.close(); else if(!dialog && screen!=='title') openJournal(); return; }
  if(action==='camera' && !dialog) {view?.focusRover?.();return;}
  const targets=menuTargets();
  if(action.startsWith('nav')) {
    if(exploring) setExploring(false);
    const index=targets.indexOf(document.activeElement);
    const step=['navUp','navLeft'].includes(action)?-1:1;
    const next=index<0 ? (step>0?0:targets.length-1) : (index+step+targets.length)%targets.length;
    targets[next]?.focus({preventScroll:false}); return;
  }
  if(action==='primary') {
    if (!dialog && (transmitting || scanning)) return;
    if(exploring) {setExploring(false);return;}
    const focused=targets.includes(document.activeElement)?document.activeElement:null;
    const fallback=dialog ? targets[0] : app.querySelector('[data-action="observe"]:not([disabled]),[data-action="next"],[data-action="transmit"],[data-action="assist"],.choice,[data-action="begin"],[data-action="journal"]');
    (focused || fallback)?.click();
  }
}
controller=createController({
  onInput(input) {
    padInput={throttle:input.throttle,steer:input.steer};drive();
    view?.setLook?.({x:screen==='game'&&!state.paused?input.lookX:0,y:screen==='game'&&!state.paused?input.lookY:0});
  },
  onAction:controllerAction,
  onStatus(status) {
    document.body.classList.toggle('controller-connected',status.connected);
    $('#controller-status').textContent=status.connected ? `${/dualsense|054c|wireless controller/i.test(status.id)?'DualSense':'Controller'} connected · ${status.haptics?'vibration available':'vibration unavailable in this browser'}` : 'Connect a controller, then press any button.';
    inputDevice = status.connected ? (/dualsense|054c|wireless controller/i.test(status.id) ? 'dualsense' : 'gamepad') : settings.touch ? 'touch' : 'keyboard';
    updateInputHint();
    $('#adaptive-connect').disabled=!status.adaptiveSupported || status.adaptiveOpen;
    $('#adaptive-disconnect').hidden=!status.adaptiveOpen;
    $('#adaptive-status').textContent=status.message || (status.adaptiveConnected?'USB trigger effects enabled.':status.adaptiveSupported?'Optional: original DualSense via USB. Click or tap to connect.':'Adaptive triggers unavailable here. Standard controls still work.');
  },
});
controller.setHaptics(settings.haptics);
$('#haptics-setting').checked=settings.haptics;
$('#haptics-setting').addEventListener('change',event=>{settings.haptics=event.target.checked;controller.setHaptics(settings.haptics);applyMotion();});
$('#adaptive-connect').addEventListener('click',()=>controller.connectAdaptiveTriggers());
$('#adaptive-disconnect').addEventListener('click',()=>controller.disconnectAdaptiveTriggers());
window.addEventListener('blur',()=>{padInput={throttle:0,steer:0};pause();});
window.addEventListener('focus',resume);
window.addEventListener('pagehide',()=>{pause();controller.disconnectAdaptiveTriggers();});
try { view=createLandscape(canvas); } catch(error) {
  graphicsError=true;
  $('.world').dataset.fallback='true';
  $('#world-status').textContent='3D graphics could not start. Try a browser with WebGL 2 enabled.';
  $('#world-status').dataset.state='error';
  console.error(error);
}
applyMotion();
renderTitle();
