import { discoveryPhotos } from './content/discovery-photos.js';
import { renderDiscoveryCamera } from './ui/discovery-camera.js';
import { scenes, sources, credits, recordedChoice } from './content/story.js';
import { storyLine } from './content/terminal-story.js';
import { renderStoryConsole, createStoryWriter } from './ui/story-console.js';
import { createState, transition } from './engine/game.js';
import { createBriefing, briefingBeats } from './engine/briefing.js';
import { missionTime, timePassage } from './content/time.js';
import { createSound } from './audio/sound.js';
import { createLandscape } from './ui/landscape.js';
import { restoreSession, serializeSession, restoreCheckpoint, restoreAssistedScenes } from './session.js';
import { createController } from './input/controller.js';
import { currentObjective, inputMode } from './ui/objectives.js';
import { controllerScrollTarget } from './ui/scroll-target.js';
import { controllerMenuTargets } from './ui/controller-navigation.js';
import { renderGeologyPanel } from './ui/geology-panel.js';
import { renderUploadTerminal } from './ui/upload-terminal.js';
import { createSqueeze } from './engine/squeeze.js';
import { createGeologyTool } from './engine/geology-tool.js';
import { createSurvey, surveyProfiles } from './engine/fieldwork.js';
import { createInvestigation } from './engine/investigation.js';
import { createInteractionWait } from './engine/interaction-wait.js';
import { discoveredScenes, transmissionProfile, missionConditions, endingMemories } from './ui/experience.js';
import { controllerFamily, controllerGlyph, controllerButtonName, validPromptStyle } from './ui/controller-prompts.js';

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const canvas = $('#atmosphere');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paragraphs = (text) => String(text).split('\n\n').map(p => `<p>${escape(p)}</p>`).join('');
const arrow = '<span aria-hidden="true">↗</span>';
const storageKey = 'last-light-journey-v1';
const padPreviewMuted = new URLSearchParams(location.search).get('controller') === 'off';
let state = createState();
let saved = null;
let savedCheckpoint = null, pendingCheckpoint = null;
let assistedScenes = new Set();
let checkpointAt = 0;
let settings = { haptics: true, sound: false, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: matchMedia('(any-pointer: coarse)').matches, prompts: 'auto' };
try {
  saved = restoreSession(localStorage.getItem(storageKey), scenes);
  assistedScenes=new Set(restoreAssistedScenes(localStorage.getItem(storageKey),scenes));
  savedCheckpoint = restoreCheckpoint(localStorage.getItem(storageKey), scenes);
  const storedSettings = JSON.parse(localStorage.getItem('last-light-settings'));
  if (storedSettings && typeof storedSettings.haptics === 'boolean') settings.haptics = storedSettings.haptics;
  if (storedSettings && typeof storedSettings.reducedMotion === 'boolean') settings.reducedMotion = storedSettings.reducedMotion;
  if (storedSettings && typeof storedSettings.touch === 'boolean') settings.touch = storedSettings.touch;
  if (storedSettings && validPromptStyle(storedSettings.prompts)) settings.prompts = storedSettings.prompts;
} catch { /* Private browsing can still play. */ }
let screen = 'title';
let briefingFrame = 0;
let briefingActive = false;
let briefingPassage = false;
let purposeKnown = false;
let view;
let controller;
let padInput = { throttle: 0, steer: 0 };
let scanning = false;
let scanTimer = 0;
let investigating = false;
let survey = null;
let surveyStep = 0;
let geologyActive = false;
let toolState = null;
let toolPad = {x:0,y:0,pressure:0};
let toolButtonHeld = false;
let toolSampleCount = 0;
let investigationSampleAt = 0;
const investigation = createInvestigation();
let lastDistance = 0;
let movementBlocked = false;
let movementBlockReason = null;
let worldReady = false;
let graphicsError = false;
let soundPreferenceSet = false;
let lastScene = null;
let reached = false;
let exploring = false;
let transmitting = false;
let contacting = false;
const squeeze = createSqueeze();
let uploadInputAt = 0;

let restoreSendFocus = false;
const modalReturnFocus = new WeakMap();
let inputDevice = settings.touch ? 'touch' : 'keyboard';
let controllerConnected = false;
let controllerId = '';

let discoveryShot = null;
let discoveryReady = false, discoveryAligned = false, captureGeneration = 0;
let assistanceIntent = null;
const photoAssets = new Map();
let inputContext = '';
function currentDiscovery() {
  return screen==='game' && ['transmit','received'].includes(state.phase) ? discoveryPhotos[scenes[state.sceneIndex].id] : null;
}
function discoveryStage() {
  return state.phase==='received' ? 'received' : transmitting ? 'sending' : discoveryShot?.stage || 'aim';
}
function cameraAiming() { return !!currentDiscovery() && discoveryStage()==='aim' && !graphicsError; }
function clearDiscovery() {
  captureGeneration++;
  if(discoveryShot?.url)URL.revokeObjectURL(discoveryShot.url);
  discoveryShot=null;discoveryReady=false;discoveryAligned=false;
  view?.setDiscoveryCamera?.(null);
  document.body.dataset.discovery='false';
}
function preloadDiscovery(id) {
  const photo=discoveryPhotos[id];if(!photo || photoAssets.has(id))return;
  const asset={state:'loading',image:new Image()};photoAssets.set(id,asset);
  const done=stateValue=>{asset.state=stateValue;if(currentDiscovery() && scenes[state.sceneIndex].id===id && state.phase==='received')renderGame();};
  asset.image.onload=()=>done('ready');asset.image.onerror=()=>done('error');asset.image.src=photo.src;
}
async function captureDiscovery() {
  if(!cameraAiming() || !discoveryReady || state.paused)return;
  const token=++captureGeneration,id=scenes[state.sceneIndex].id;
  discoveryShot.stage='capturing';discoveryShot.error='';
  view?.setDiscoveryCameraFrozen?.(true);view?.setLook?.({x:0,y:0});pressed.clear();
  renderGame();sound.cue('observe');controller?.feedback('observe');
  let blob;
  try {
    const full=await view?.capturePhoto?.();
    const windowRect=app.querySelector('.discovery-camera__view')?.getBoundingClientRect(),canvasRect=canvas.getBoundingClientRect();
    blob=full;
    if(full && windowRect && canvasRect.width>0 && canvasRect.height>0) {
      const bitmap=await createImageBitmap(full);
      try {
        const x=Math.max(0,(windowRect.left-canvasRect.left)/canvasRect.width*bitmap.width);
        const y=Math.max(0,(windowRect.top-canvasRect.top)/canvasRect.height*bitmap.height);
        const width=Math.min(bitmap.width-x,windowRect.width/canvasRect.width*bitmap.width);
        const height=Math.min(bitmap.height-y,windowRect.height/canvasRect.height*bitmap.height);
        const crop=document.createElement('canvas');crop.width=Math.max(1,Math.round(width));crop.height=Math.max(1,Math.round(height));
        crop.getContext('2d').drawImage(bitmap,x,y,width,height,0,0,crop.width,crop.height);
        blob=await new Promise(resolve=>crop.toBlob(resolve,'image/png'));
      }finally{bitmap.close();}
    }
  } catch {blob=null;}
  if(token!==captureGeneration || scenes[state.sceneIndex].id!==id || screen!=='game')return;
  if(blob) {
    discoveryShot.url=URL.createObjectURL(blob);discoveryShot.stage='captured';
    announce('Frame captured. Send your discovery home, or retake the picture.');
  } else {
    discoveryShot.stage='aim';discoveryShot.error='Capture failed. Try again or use the mission image.';
    view?.setDiscoveryCameraFrozen?.(false);announce(discoveryShot.error);
  }
  renderGame({focus:!state.paused});
}
function retakeDiscovery() {
  if(!currentDiscovery() || discoveryStage()!=='captured' || state.paused)return;
  if(discoveryShot.url)URL.revokeObjectURL(discoveryShot.url);
  discoveryShot.url='';discoveryShot.stage='aim';discoveryShot.error='';
  stopContact();view?.setDiscoveryCameraFrozen?.(false);pressed.clear();renderGame({focus:true});
}
function useHistoricalObservation() {
  if(!currentDiscovery() || state.paused)return;
  if(!graphicsError && !discoveryShot?.error && !assistanceIntent)return;
  discoveryShot.stage='captured';discoveryShot.error='';
  view?.setDiscoveryCameraFrozen?.(true);renderGame({focus:true});
}

const transmissionWait = createInteractionWait();
const sound = createSound();
sound.setMuted(true);
const storyWriter = createStoryWriter({ paused:()=>state.paused || document.hidden || exploring, pulse:options=>sound.textPulse?.(options) });
const goals = {
  1: { x: 7, z: -7, label: 'Last Chance outcrop' },
  2: { x: -5, z: -10, label: 'Berry Bowl' },
  3: { x: -11, z: 3, label: 'The next horizon' },
  4: { x: 6, z: 10, label: 'Perseverance Valley' },
  5: { x: 13, z: -2, label: 'The storm observation point' },
  6: { x: 3, z: -4, label: 'The overlook' },
};

function announce(text) { $('#announcement').textContent = text; }
function save() {
  saved = state;
  const sceneId = scenes[state.sceneIndex].id, physical = view?.getCheckpoint?.();
  const sameScene = lastScene === sceneId;
  savedCheckpoint = physical?.position ? {sceneId, position:physical.position,
    reached:sameScene ? reached : !goals[state.sceneIndex] || state.phase!=='observe',
    tool:physical.tool?.sceneId===sceneId ? physical.tool : null,
    survey:sameScene && survey ? survey.checkpoint() : null} : null;
  checkpointAt = performance.now();
  try { localStorage.setItem(storageKey, serializeSession(state,savedCheckpoint,{assistedScenes:[...assistedScenes]})); } catch { /* Optional. */ }
}
function saveWork() {
  if (screen==='game' && performance.now()-checkpointAt>700) save();
}
function restoreWork() {
  if (!pendingCheckpoint || !view) return;
  const checkpoint=pendingCheckpoint;pendingCheckpoint=null;
  if (checkpoint.sceneId!==scenes[state.sceneIndex].id) return;
  view.restoreCheckpoint?.(checkpoint);
  reached = reached || checkpoint.reached;
  view.setWaypoint?.(goals[state.sceneIndex] && !reached ? goals[state.sceneIndex] : null);
  if (state.phase!=='observe' || !reached || graphicsError) return;
  if (checkpoint.tool) {
    geologyActive=true;investigating=true;scanning=true;toolSampleCount=checkpoint.tool.sampleIds?.length || 0;
    view.setToolMode?.(checkpoint.sceneId);
  } else if(checkpoint.survey && surveyProfiles[checkpoint.sceneId]) {
    survey=createSurvey(surveyProfiles[checkpoint.sceneId],undefined,checkpoint.survey);
    surveyStep=survey.checkpoint().step;investigating=true;scanning=true;
    investigationSampleAt=performance.now();view.setSurvey?.(true);
  }
}
function focusContent(selector = 'h1') {
  requestAnimationFrame(() => {
    const target=app.querySelector(selector);
    const reading=target?.closest('.story-shell');
    target?.focus({preventScroll:!(reading && reading.scrollHeight>reading.clientHeight+1)});
  });
}
function setExploring(value) {
  exploring = value;
  document.body.classList.toggle('exploring', value);
  $('#explore-toggle').innerHTML = `<span aria-hidden="true">◫</span><span class="sr-only">${value ? 'Show HUD' : 'Hide HUD'}</span>`;
  $('#explore-toggle').setAttribute('aria-expanded', String(!value));
  const panel = app.querySelector('.interaction-dock');
  if (panel) panel.inert = value;
}
function setWorld(environment, mode) {
  if(mode!=='game'){clearDiscovery();view?.setRemoteView?.(false);view?.setEvidence?.(null);}
  document.body.dataset.environment = environment;
  if(mode!=='game')document.body.dataset.upload='false';
  document.body.dataset.screen = mode;
  view?.setScene(environment, { power: scenes[state.sceneIndex]?.power ?? 100, signal: scenes[state.sceneIndex]?.signal ?? 100 });
  view?.setMode?.(mode);
  sound.setScene(environment);
  sound.setNarrative?.(mode === 'title' ? -1 : state.sceneIndex, state.phase);
  $('#world-controls').hidden = mode !== 'game';
  if(mode !== 'game') {$('#waypoint-hud').hidden=true;view?.setDrive?.({forward:0,turn:0});view?.setLook?.({x:0,y:0});}
}

function renderTitle() {
  clearDiscovery();
  storyWriter.stop();
  cancelScan();
  stopBriefing();
  cancelTransmission();
  stopContact();
  restoreSendFocus = false;
  screen = 'title';
  setExploring(false);
  setWorld('sunset', 'title');
  app.innerHTML = `<section class="title-screen">
    <h1 class="title" tabindex="-1">Last<br><em>Light.</em></h1>
    <p class="title-kicker">You were built for ninety days.<br>You stayed for fourteen years.</p>
    <p class="title-description">A world worth sending home.</p>
    <div class="title-actions"><button class="primary-button" data-action="begin">${saved ? (saved.complete ? 'Return to your memories' : 'Continue your journey') : 'Begin the journey'} ${arrow}</button>
    ${saved ? '<button class="secondary-button" data-action="restart">Start anew</button>' : '<button class="secondary-button" data-action="about">The story behind the story</button>'}</div>
    <p class="session-note">An imagined story about a real explorer.</p>
  </section>`;
  refreshControllerPrompts();
}

function stopBriefing() {
  storyWriter.stop();
  cancelAnimationFrame(briefingFrame);briefingFrame=0;briefingActive=false;
  view?.setIntro?.(false);
  if(briefingPassage)view?.setPaused(state.paused);
  briefingPassage=false;
}
function finishBriefing({ skipped = false } = {}) {
  if(!briefingActive || state.paused)return;
  const wasPassage=briefingPassage;
  if(!wasPassage)purposeKnown=!skipped;
  pressed.clear();padInput={throttle:0,steer:0};
  stopBriefing();lastScene=null;renderGame({focus:true});
  announce(wasPassage ? `${missionTime(scenes[state.sceneIndex].id)?.label}. ${scenes[state.sceneIndex].subtitle}` : 'First, look through your cameras. Choose a view to send to Earth.');
}
function startBriefing(passage = null) {
  stopBriefing();cancelScan();cancelTransmission({preserveReply:!!passage});stopContact();
  view?.setEvidence?.(null);
  pressed.clear();padInput={throttle:0,steer:0};
  screen=passage?'passage':'intro';briefingActive=true;briefingPassage=!!passage;setExploring(false);
  if(!passage) {purposeKnown=false;setWorld('dawn','game');}
  document.body.dataset.screen=screen;document.body.dataset.upload='false';
  $('#world-controls').hidden=true;$('#waypoint-hud').hidden=true;
  view?.stopDrive?.();view?.setLook?.({x:0,y:0});
  if(passage) {view?.focusRover?.(true);view?.setRemoteView?.(passage.role==='earth');view?.setPaused(true);} else {view?.setMissionAge?.(0);view?.setIntro?.(!settings.reducedMotion,{progress:0});}
  const beats=passage?.beats || briefingBeats,beat=beats[0];
  const handover=passage?.role==='earth';
  const fromAge=missionTime(scenes[state.sceneIndex-1]?.id)?.ageYears || 0;
  const toAge=missionTime(scenes[state.sceneIndex].id)?.ageYears || 0;
  app.innerHTML=`<section class="mission-briefing ${passage?'time-passage':''} ${handover?'signal-handover':''}" aria-label="${passage?'Passage of mission time':'Mission introduction'}">${handover?'<div class="handover-link" aria-hidden="true"><span>OPPORTUNITY<small>MARS</small></span><i></i><strong>YOU<small>EARTH</small></strong></div>':''}${passage&&!handover?'<div class="passage-light" aria-hidden="true"></div>':''}<div class="briefing-console story-shell"><div class="briefing-reading"></div><p class="pace-note">${passage?'The years pass.':'Your journey is beginning.'}</p></div></section>`;
  function showBeat(content,index) {
    const line={speaker:'rover',text:`${content.title} ${content.cue}`.trim()};
    app.querySelector('.briefing-reading').innerHTML=handover?`<div class="story-console__meta">${escape(content.label)}</div><p class="story-handover">${escape(content.title)}<small>${escape(content.cue)}</small></p>`:renderStoryConsole({line,time:content.label});
    if(!handover)storyWriter.mount(app.querySelector('.story-console'),line,`${screen}:${passage?.toYear || 'intro'}:${index}`);
    announce(`${content.title} ${content.cue}`);
  }
  showBeat(beat,0);
  refreshControllerPrompts();focusContent('.briefing-reading');
  const timeline=createBriefing({duration:passage?.duration || 12,beats:beats.length});let previous=performance.now(),lastBeat=0;
  function frame(now) {
    if(!briefingActive)return;
    const {progress,beat,complete}=timeline.step((now-previous)/1000,state.paused || document.hidden || (!worldReady && !graphicsError));previous=now;
    if(!state.paused && !document.hidden) {
      if(passage) {
        // Two quiet light/dark cycles suggest repeated days; the matched camera stays still.
        if(!handover && !settings.reducedMotion)app.querySelector('.passage-light').style.opacity=String(.55*Math.sin(progress*Math.PI*(passage.fromYear==='2004'?2:1))**2);
        view?.setMissionAge?.(fromAge+(toAge-fromAge)*progress);
      } else if(!settings.reducedMotion)view?.setIntro?.(true,{progress});
    }
    if(beat!==lastBeat) {
      lastBeat=beat;const content=beats[beat];
      showBeat(content,beat);
    }
    if(complete)finishBriefing();else briefingFrame=requestAnimationFrame(frame);
  }
  briefingFrame=requestAnimationFrame(frame);
}

function syncInputMode() {
  const mode = inputMode({screen, phase:state.phase, modal:!!document.querySelector('dialog[open]'), investigating:cameraAiming() || investigating && toolState?.stage!=='compare', contacting, travelling:!reached});
  controller?.setInputMode?.(mode);
  const context = `${screen}:${state.sceneIndex}:${state.phase}:${document.querySelector('dialog[open]')?.id || ''}:${investigating}:${currentDiscovery()?discoveryStage():''}`;
  if(context!==inputContext) {inputContext=context;controller?.rearmMenu?.();}
  if(mode !== 'drive') view?.stopDrive?.();
}

function updateInputHint() {
  const moving=screen==='game' && state.phase==='observe' && !reached;
  const family=controllerFamily(controllerId,settings.prompts);
  const pad=controllerConnected || settings.prompts!=='auto';
  const row=(action,label,key,usePad=pad)=>`<span class="controller-hint" aria-label="${usePad?controllerButtonName(action,family):key}: ${label.toLowerCase()}">${usePad?controllerGlyph(action,family):`<kbd>${key}</kbd>`}<span>${label}</span></span>`;
  let hints;
  if(transmitting) hints='';
  else if(contacting) hints=controllerConnected?'':row('primary',transmissionProfile(scenes[state.sceneIndex]).mode==='silence'?'Call':transmissionProfile(scenes[state.sceneIndex]).mode==='archive'?'Keep':'Send','Enter',false);
  else if(geologyActive) hints=toolState?.stage==='compare'?row('primary','Compare','Enter'):row('look',toolState?.stage==='trace'?'Follow layer':'Move tool','↑↓←→')+row('forward',toolState?.stage==='trace'?'Trace':toolState?.stage==='brush'?'Brush':'Measure','Space');
  else if(investigating) hints=row('look','Look','↑↓←→')+'<span class="control-rest">Hold still to record</span>';
  else if(moving) hints=row('move','Drive','WASD')+row('look','Look','Drag');
  else hints=screen==='game' && state.phase!=='choose'?'':row('move','Select','Tab')+row('primary','Confirm','Enter');
  if(screen==='game')hints+=row('journal','Memories','J');
  if(settings.touch&&!pad) hints=contacting?'<span class="controller-hint"><kbd>·</kbd>Tap Send</span>':investigating?'<span class="controller-hint"><kbd>↔</kbd>Drag to look</span><span class="control-rest">Hold still to record</span>':moving?'<span class="controller-hint"><kbd>↔</kbd>Drag to look</span>':'<span class="controller-hint"><kbd>·</kbd>Tap to choose</span>';
  if(controllerConnected && (!investigating || toolState?.stage==='compare') && controllerScrollTarget(app)) hints+=row('look','Read more','Scroll');
  if(currentDiscovery())hints=cameraAiming()?row('look','Aim','Arrow keys')+row('primary','Take picture','Enter'):discoveryStage()==='captured'?(controllerConnected?'<span class="control-rest">Squeeze both triggers and release, or select Send</span>':'<span class="control-rest">Send your discovery home</span>'):'';
  if(cameraAiming() && settings.touch && !controllerConnected)hints='<span class="control-rest">Drag to frame · Tap Take picture</span>';
  $('#input-hint').innerHTML=hints;
}

function refreshControllerPrompts() {
  const family = controllerFamily(controllerId,settings.prompts);
  const show = controllerConnected || settings.prompts !== 'auto';
  const decorate = (button, action) => {
    button.querySelector(':scope > .controller-glyph')?.remove();
    button.classList.toggle('with-controller-glyph',show);
    if (show) button.insertAdjacentHTML('afterbegin',controllerGlyph(action,family));
  };
  app.querySelectorAll('[data-action]').forEach(button=>{if(button.dataset.action!=='transmit')decorate(button,button.dataset.action==='journal'?'journal':'primary');});
  for(const [side,action] of [['left','reverse'],['right','forward']]){const icon=app.querySelector(`[data-trigger="${side}"]`);if(icon)icon.innerHTML=controllerGlyph(action,family);}
  decorate($('#settings-toggle'),'pause');
  $('#journal-toggle').hidden=controllerConnected;
  document.querySelectorAll('dialog [data-close]').forEach(button=>{
    if(button.classList.contains('close-button'))button.innerHTML=show?'':'<span aria-hidden="true">×</span>';
    decorate(button,'back');
  });
  const guide = [['move','Drive'],['forward','Forward'],['reverse','Reverse'],['look','Look'],['primary','Interact'],['select','Select'],['journal','Memories'],['back','Back'],['pause','Pause']];
  $('#controller-guide').innerHTML = guide.map(([action,label])=>`<span class="controller-hint" aria-label="${controllerButtonName(action,family)}: ${label.toLowerCase()}">${controllerGlyph(action,family)}<span>${label}</span></span>`).join('');
  const journalHints=$('#journal-controls');
  journalHints.hidden=!controllerConnected;
  journalHints.innerHTML=[['select','Select entry'],['primary','Open / close entry'],['look','Scroll'],['back','Close']].map(([action,label])=>`<span class="controller-hint" aria-label="${controllerButtonName(action,family)}: ${label.toLowerCase()}">${controllerGlyph(action,family)}<span>${label}</span></span>`).join('');
  updateInputHint();
  syncInputMode();
}

function renderGame({ focus = false } = {}) {
  if (state.complete) return renderEnding();
  screen = 'game';
  const scene = scenes[state.sceneIndex];
  // Older saves can stop at a curation menu that this revision no longer needs.
  if(state.phase==='choose') { const record=recordedChoice(scene,state);if(record){state=transition(state,{type:'CHOOSE',choiceId:record.id},scenes);save();} }
  preloadDiscovery(scene.id);
  const photo=discoveryPhotos[scene.id] && ['transmit','received'].includes(state.phase) ? discoveryPhotos[scene.id] : null;
  if(!photo && discoveryShot)clearDiscovery();
  if(photo && discoveryShot?.sceneId!==scene.id) {
    clearDiscovery();discoveryShot={sceneId:scene.id,stage:'aim',url:'',error:''};
  }
  document.body.dataset.phase=state.phase;
  document.body.dataset.tool=String(geologyActive);
  view?.setMissionAge?.(missionTime(scene.id)?.ageYears || 0);
  if (lastScene !== scene.id) {
    reached = !goals[state.sceneIndex] || state.phase !== 'observe';
    lastScene = scene.id;
    setWorld(scene.environment, 'game');
    view?.setObservationTarget?.(goals[state.sceneIndex] || null);
    view?.setWaypoint?.(goals[state.sceneIndex] && !reached ? goals[state.sceneIndex] : null);
    if (state.phase === 'choose') view?.inspect?.();
    else if(state.phase !== 'observe')view?.focusRover?.(true);
    else if(state.sceneIndex>0)view?.focusRover?.();
    setExploring(false);
  } else document.body.dataset.screen = 'game';
  restoreWork();
  document.body.dataset.tool=String(geologyActive);
  document.body.dataset.travelling=String(state.phase==='observe' && !!goals[state.sceneIndex] && !reached);
  sound.setNarrative?.(state.sceneIndex,state.phase);
  const choice = scene.choices.find(c=>c.id===state.selected);
  const recalled = scene.id==='smaller-world' ? state.memories.find(m=>m.sceneId==='first-morning') : null;
  const goal = goals[state.sceneIndex];
  const contact = transmissionProfile(scene);
  const thought = storyLine({scene,phase:state.phase,travelling:state.phase==='observe'&&!!goal&&!reached,purposeKnown,investigating,toolStage:toolState?.stage,transmitting,selected:choice,recalled});
  const consoleHTML = renderStoryConsole({line:thought,time:missionTime(scene.id)?.label || scene.sol});
  view?.setRemoteView?.(scene.signal===0);
  document.body.dataset.perspective=scene.signal===0?'earth':'rover';
  document.body.dataset.upload = ['transmit','received'].includes(state.phase) ? 'true' : 'false';
  if(state.phase==='transmit' && !transmitting && !state.paused && (!photo || discoveryShot?.stage==='captured')) {
    if(!contacting) {
      contacting=true;resetUpload();
      if(scene.signal>0 && state.sceneIndex!==0){view?.setContact?.(true,{mode:contact.mode});view?.setContact?.(false);}
      if(state.sceneIndex===0)view?.previewMemory?.(state.selected,scene.id);
      if(recalled)view?.previewMemory?.(recalled.choiceId,'first-morning');
      announce(uploadPrompt());
    }
  } else stopContact();
  const evidence=['stone-ripples','blueberries'].includes(scene.id) && ['choose','transmit','received'].includes(state.phase);
  view?.setEvidence?.(evidence?scene.id:null);
  document.body.dataset.evidence=String(evidence);
  document.body.dataset.discovery=String(!!photo);
  if(photo) {
    view?.setDiscoveryCamera?.(graphicsError?null:scene.id,{immediate:settings.reducedMotion});
    view?.setDiscoveryCameraFrozen?.(discoveryStage()!=='aim' || state.paused);
  }
  $('#waypoint-hud').hidden=!goal || reached || state.phase!=='observe';
  $('#waypoint-hud').textContent=goal ? goal.label : '';
  let content = '';
  if (photo) {
    content=renderDiscoveryCamera({photo,stage:graphicsError && discoveryStage()==='aim'?'unavailable':discoveryStage(),captureUrl:discoveryShot?.url || '',ready:discoveryReady,aligned:discoveryAligned,controller:controllerConnected,family:controllerFamily(controllerId,settings.prompts),imageState:photoAssets.get(scene.id)?.state || 'loading',reducedMotion:settings.reducedMotion,error:discoveryShot?.error || ''});
  } else if (geologyActive) {
    content=renderGeologyPanel(toolState || (scene.id==='stone-ripples'?{mode:'trace',stage:'trace'}:{}),controllerConnected);
  } else if (investigating) {
    const profile=surveyProfiles[scene.id];
    content = survey ? `<div class="survey-instrument" aria-label="${escape(profile.title)}"><div class="survey-ticks" aria-label="Observation views">${profile.steps.map((_,i)=>`<span data-survey-step="${i}">${String(i+1).padStart(2,'0')}</span>`).join('')}</div><p id="investigation-hint" class="discovery-line">${escape(profile.steps[surveyStep]?.hint || "Observation recorded.")}</p><progress id="investigation-progress" max="1" value="0" aria-label="Observation recorded"></progress><p class="pace-note">Bring the amber bearing to the center. Hold still to record.</p></div>` : `<p id="investigation-hint" class="discovery-line">Look around the feature, then hold the view still.</p><progress id="investigation-progress" max="1" value="0" aria-label="Observation recorded"></progress>`;
    // Deliberate assistance lives in Pause → Help with this activity.
  } else if (state.phase === 'observe') {
    content = scene.signal===0 ? `<p class="story-operational">${escape(scene.subtitle)}</p>` : '';
    if (goal && !reached) content += `<div class="objective-line"><strong>${escape(currentObjective({scene,phase:state.phase,goal,reached}))}</strong><span id="objective-distance">${graphicsError ? '3D unavailable on this device' : 'Follow the amber beacon'}</span>${graphicsError?'<button class="quiet-button" data-action="text-only">Continue story</button>':''}</div>`;
    else content += `<button class="primary-button" data-action="observe" ${scanning?'disabled':''}>${scanning?'Looking closely…':escape(scene.actionLabel || scene.objective)}</button>`;

  } else if (state.phase === 'choose') {
    content = `<div class="choices compact-choices">${scene.choices.map(c=>`<button class="choice" data-action="choose" data-choice="${escape(c.id)}"><span class="choice-label">${escape(c.shortLabel || c.label)}</span><span class="choice-detail">${escape(c.detail)}</span></button>`).join('')}</div>`;
  } else if (state.phase === 'transmit' || state.phase === 'received') {
    content = renderUploadTerminal({title:recalled?`Remember: ${recalled.title}`:choice?.memory?.title || scene.title,mode:contact.mode,
      stage:state.phase==='received'?'received':transmitting?'sending':'ready',
      prompt:state.phase==='received'?'':transmitting?contact.waiting:contacting?uploadPrompt():contact.mode==='archive'?'Keep this moment in the mission archive.':'Send a call. Listen for a reply.',
      response:scene.response || scene.transmission,meaning:recalled?'The first view you sent is still on Earth. The storm cannot take it back.':contact.mode==='partial'?'A sky full of dust. Send what light remains.':recordedChoice(scene,state)?scene.discovery:choice?.shortReply || '',input:controllerConnected?'controller':'pointer',sceneId:scene.id,findings:evidence?createGeologyTool(scene.id).snapshot().targets.toSorted((a,b)=>a.x-b.x):[],family:controllerFamily(controllerId,settings.prompts),story:consoleHTML,voice:!!thought.text});
  }

  const upload = ['transmit','received'].includes(state.phase);
  app.innerHTML = `<section class="play-screen">${survey?'<div class="survey-aim" aria-hidden="true"><span class="survey-center"></span><i id="survey-target"></i></div>':''}<h1 class="sr-only" tabindex="-1">${escape(scene.title)}</h1><article class="interaction-dock" aria-label="Current interaction" aria-busy="${scanning || transmitting}">${upload?content:`<div class="story-shell ${thought.text?'':'story-voice-absent'}">${consoleHTML}<div class="story-actions">${content}</div></div>`}</article></section>`;
  storyWriter.mount(app.querySelector('.story-console'),thought,`${scene.id}:${state.phase}:${thought.text}`);
  setExploring(exploring);
  $('#world-controls').hidden = !!photo;
  $('.drive-pad').hidden = state.phase!=='observe' || reached;
  document.querySelectorAll('[data-drive]').forEach(b=>b.disabled = scene.signal === 0 || state.phase!=='observe' || reached || scanning || transmitting);
  refreshControllerPrompts();
  controller?.setTerrain({moving:false,blocked:false,power:scene.power/100});
  if (focus) focusContent(photo?((graphicsError || discoveryShot?.error) && discoveryStage()==='aim'?'[data-action="use-discovery-photo"]':discoveryStage()==='aim'?'[data-action="capture-discovery"]':state.phase==='received'?'[data-action="next"]':'[data-action="transmit"]'):state.phase==='choose' ? '.choice' : state.phase==='received' ? '[data-action="next"]' : state.phase==='transmit' ? '[data-action="transmit"]' : '[data-action="observe"]');
}

$('#journal-toggle').addEventListener('click',openJournal);
function openJournal() {
  const scene = scenes[state.sceneIndex];
  const discoveries = discoveredScenes(state, scenes);
  $('#journal-content').innerHTML = `<p class="hint">Inner thoughts and Earth replies are fiction. Travel, conditions, and communication timing are dramatized. Exploring does not spend power. Tool readings are simplified comparisons, not instrument telemetry.</p><p class="hint">${missionConditions(scene).join(' · ')} · ${state.memories.length} memories</p>${state.phase==='observe' ? `<p class="journal-locked">${escape(scene.approachTitle || scene.title)}<br>Look closely to add this discovery.</p>` : ''}<h3>Discoveries · ${discoveries.length}</h3>${discoveries.map(item=>{
    const source=sources.find(s=>s.id===item.observation.sourceId);
    return `<details class="discovery-entry" ${item.id===scene.id?'open':''}><summary>${escape(item.observation.title)}${assistedScenes.has(item.id)?' · Assisted':''}</summary><p>${escape(item.discovery)}</p>${paragraphs(item.observation.text)}<p>${escape(item.observation.fact || '')}</p>${source?`<a href="${escape(source.url)}" target="_blank" rel="noreferrer">NASA source ↗</a>`:''}</details>`;
  }).join('') || '<p>Your observations will appear here after you make them.</p>'}<h3>Your memories · ${state.memories.length}</h3><div class="archive-grid">${state.memories.map(m=>`<article class="memory-card"><h4>${escape(m.title)}</h4><p>${escape(m.text)}</p></article>`).join('') || '<p>Something worth remembering is waiting out there.</p>'}</div>`;
  openModal('#journal-modal');
}

function renderEnding() {
  storyWriter.stop();
  screen = 'ending';
  setExploring(false);
  setWorld('dawn', 'ending');
  view?.setWaypoint?.(null);
  controller?.setTerrain({moving:false,blocked:false,power:0});
  const scene = scenes.at(-1);
  app.innerHTML = `<section class="ending-screen brief-ending"><p class="eyebrow">OPPORTUNITY · 2004–2018</p><h1 class="ending-title" tabindex="-1">You were here.</h1><p class="inner-voice">${escape(scene.subtitle)}</p><div class="mission-numbers"><div><strong>90</strong><span>SOLS PLANNED</span></div><div><strong>5,111</strong><span>SOLS TO LAST CONTACT</span></div><div><strong>${state.memories.length}</strong><span>MEMORIES WITH YOU</span></div></div><ul class="memory-echoes" aria-label="Moments you observed and chose">${endingMemories(state.memories).map(m=>`<li>${escape(m.title)}${m.sceneId==='months'?`<p class="archive-choice-echo">${escape(m.text)}</p>`:''}</li>`).join('')}</ul><p class="ending-fact">Opportunity revealed evidence of ancient water on Mars. NASA declared the mission complete on February 13, 2019.</p><div class="ending-actions"><button class="primary-button" data-action="journal">Open your memories</button><button class="quiet-button" data-action="restart">Begin again</button></div></section>`;
  refreshControllerPrompts();
  focusContent();
}

function scan() {
  if (scanning || state.paused || !reached || state.phase !== 'observe') return;
  if (scenes[state.sceneIndex].signal === 0 || graphicsError) return act({type:'OBSERVE'});
  view?.stopDrive?.();
  const profile=surveyProfiles[scenes[state.sceneIndex].id];
  if(profile) {
    survey=createSurvey(profile);surveyStep=0;investigating=true;scanning=true;investigationSampleAt=performance.now();
    view?.setSurvey?.(true);sound.setActivity?.({investigating:true});sound.cue('investigate');renderGame();announce(profile.steps[0].hint);return;
  }
  if ([1,2].includes(state.sceneIndex)) {
    geologyActive=true;investigating=true;scanning=true;toolState=null;toolSampleCount=0;toolPad={x:0,y:0,pressure:0};toolButtonHeld=false;
    if(!view?.setToolMode?.(scenes[state.sceneIndex].id)){geologyActive=false;investigating=false;scanning=false;return;}
    sound.cue('investigate');renderGame();announce(scenes[state.sceneIndex].id==='stone-ripples'?'Hold R2 and follow the two dotted rock layers.':'Move the tool with the right stick. Hold R2 and sweep away the dust.');return;
  }
  scanning = true;
  drive();
  if(state.sceneIndex===0)view?.revealFirstView?.();else view?.inspect?.();
  controller?.feedback('observe');
  document.body.classList.add('scanning');
  renderGame();
  scanTimer = setTimeout(()=>{
    scanning=false; document.body.classList.remove('scanning');
    act({type:'OBSERVE'});
  },1000);
}

function uploadPrompt() {
  const mode=transmissionProfile(scenes[state.sceneIndex]).mode;
  const action=mode==='silence'?'call':mode==='archive'?'keep this memory':'send';
  return controllerConnected ? `Squeeze to charge. Release both triggers to ${action}.` : 'Continue when you are ready.';
}
function updateUploadProgress(result) {
  if(!contacting || state.paused)return;
  const terminal=app.querySelector('.upload-terminal,.discovery-camera');
  const progress=$('#upload-progress');if(progress)progress.value=result.progress;
  if(terminal) {
    terminal.style.setProperty('--upload-progress',result.progress);
    terminal.style.setProperty('--charge-progress',result.charge || 0);
    terminal.style.setProperty('--squeeze-left',result.left || 0);
    terminal.style.setProperty('--squeeze-right',result.right || 0);
    terminal.dataset.squeeze=result.stage;
  }
  const hint=$('#squeeze-hint');
  const {mode,effort}=transmissionProfile(scenes[state.sceneIndex]);
  const releaseAction=mode==='silence'?'call':mode==='archive'?'keep this memory':'send';
  const hints={release:'Release both triggers',ready:'Squeeze both triggers',pressing:'Keep squeezing…',charged:`Release both triggers to ${releaseAction}`,latched:'Released'};
  if(hint && controllerConnected)hint.textContent=result.stage!=='release' && result.stage!=='charged' && Math.max(result.left||0,result.right||0)>.03 && Math.min(result.left||0,result.right||0)<=.03 ? 'Squeeze the other trigger too' : hints[result.stage] || hints.release;
  controller?.setUplink?.({active:result.stage!=='release' && !result.commit && (Math.max(result.left||0,result.right||0)>.03 || result.stage==='charged'),leftTrigger:result.left||0,rightTrigger:result.right||0,progress:result.progress,charge:result.charge || 0,charged:result.stage==='charged',effort});
  if(result.cue)controller?.feedback(result.cue);
  const audible=['reply','partial'].includes(mode);
  sound.setActivity?.({contactActive:audible && (result.pressure>0 || result.stage==='charged'),contactQuality:result.pressure || 0,contactCharge:result.charge || 0,contactCharged:result.stage==='charged'});
  if(audible && result.cue==='charged')sound.cue('charged');
  if(result.commit)sendMemory('triggers');
}
function resetUpload() {
  squeeze.reset();uploadInputAt=performance.now();
  controller?.setUplink?.({active:false,progress:0});
  sound.setActivity?.({contactActive:false});
  updateUploadProgress({left:0,right:0,pressure:0,progress:0,stage:'release',commit:false});
}
function stopContact() {
  if(!contacting)return;
  contacting=false;resetUpload();view?.setContact?.(false);view?.setContactInput?.({x:0,y:0});
}

function sendMemory(source='button') {
  if(currentDiscovery() && discoveryShot?.stage!=='captured')return;
  if (transmitting || state.paused || state.phase !== 'transmit' || screen !== 'game') return;
  stopContact();
  const contact = transmissionProfile(scenes[state.sceneIndex]);
  if (!contact.delay) return act({type:'TRANSMIT'});
  transmitting = true;
  view?.stopDrive?.();
  drive();
  renderGame();
  // Mode changes stop old feedback; start the departure pulse after that cleanup.
  sound.beginTransmission?.(contact.mode==='silence'?'call':contact.mode==='partial'?'partial':'normal');
  if(contact.mode!=='silence')controller?.feedback('transmit');
  announce(contact.waiting);
  transmissionWait.start(contact.delay,()=>{
    transmitting = false;
    act({type:'TRANSMIT'});
  });
}

function cancelTransmission({preserveReply=false} = {}) {
  if(!preserveReply || transmitting)sound.cancelTransmission?.();
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
  controller?.setToolFeedback?.();
  view?.setToolMode?.(null);geologyActive=false;toolState=null;toolButtonHeld=false;toolPad={x:0,y:0,pressure:0};
  document.body.dataset.tool='false';
  view?.setSurvey?.(false);survey=null;surveyStep=0;
  view?.setInvestigation?.(false);investigating=false;investigation.reset();sound.setActivity?.({moving:false,investigating:false});
  clearTimeout(scanTimer);
  const wasScanning=scanning;
  scanning=false;document.body.classList.remove('scanning');
  if(wasScanning && screen==='game') renderGame();
}

function act(action) {
  if(action.type==='NEXT' && !state.paused)clearDiscovery();
  if (action.type === 'OBSERVE' && !reached) return;
  const old = state;
  state = transition(state, action, scenes);
  if (old === state) return;
  const cue = { OBSERVE:'observe', CHOOSE:'choose' }[action.type];
  if (cue) { sound.cue(cue); controller?.feedback(cue); }
  if (action.type === 'OBSERVE') {
    if([1,2].includes(state.sceneIndex))view?.inspect?.();
    view?.setWaypoint?.(null);announce(scenes[state.sceneIndex].receiptMode==='archive'?'Archive open. Choose what to carry forward.':scenes[state.sceneIndex].signal===0?'Recovery channel ready.':'Observation recorded. Ready to send.');
    const record=recordedChoice(scenes[state.sceneIndex],state);
    if(record)state=transition(state,{type:'CHOOSE',choiceId:record.id},scenes);
  }
  if (state.complete) sound.cue('end');
  save();
  const passage=action.type==='NEXT' && !state.complete ? timePassage(scenes[old.sceneIndex].id,scenes[state.sceneIndex].id) : null;
  if(passage) {startBriefing(passage);window.scrollTo({top:0,behavior:'instant'});return;}
  renderGame({focus:true});
  if (action.type === 'TRANSMIT') {
    const contact = transmissionProfile(scenes[state.sceneIndex]);
    if(contact.mode!=='archive')sound.finishTransmission?.(contact.mode==='silence'?'call':contact.mode==='partial'?'partial':'normal');
    if (contact.mode === 'reply') controller?.feedback('received');
    announce(contact.result);
  }
  if (action.type === 'NEXT') window.scrollTo({top:0,behavior:'instant'});
}

function pause() {
  if(screen==='game')save();
  view?.setDiscoveryCameraFrozen?.(true);document.body.dataset.paused='true';
  if(survey)survey.pause();
  else if(!geologyActive)cancelScan();
  toolButtonHeld=false;toolPad={x:0,y:0,pressure:0};view?.setToolInput?.({actualSample:false});
  cancelTransmission();
  stopContact();
  pressed.clear();padInput={throttle:0,steer:0};
  controller?.setPaused(true);
  state = transition(state,{type:'PAUSE'},scenes);
  view?.setPaused(true); view?.setDrive?.({forward:0,turn:0}); sound.pause();
}
function resume() {
  if (document.hidden || document.querySelector('dialog[open]')) return;
  state = transition(state,{type:'RESUME'},scenes);
  document.body.dataset.paused='false';view?.setDiscoveryCameraFrozen?.(!!currentDiscovery() && discoveryStage()!=='aim');
  investigationSampleAt=performance.now();
  view?.setPaused(briefingPassage); controller?.setPaused(false); if (settings.sound) sound.resume();
  if (restoreSendFocus && screen === 'game' && state.phase === 'transmit') focusContent('[data-action="transmit"]');
  restoreSendFocus = false;
  if(screen==='game' && state.phase==='transmit')renderGame();
  syncInputMode();
}
function openModal(id) {
  if(document.querySelector('dialog[open]'))return;
  if(id==='#settings-modal') {
    const eligible=briefingActive || screen==='game' && (state.phase==='observe' && reached || cameraAiming());
    $('#activity-help').hidden=!eligible;
  }
  const focused=document.activeElement?.matches('button,input,summary,a[href],[tabindex]')?document.activeElement:null;
  const dialog=$(id),previousDialog=focused?.closest('dialog');
  modalReturnFocus.set(dialog,modalReturnFocus.get(previousDialog) || {element:focused,action:focused?.dataset?.action});
  pause();
  dialog.showModal();dialog.scrollTop=0;
  const initial=id==='#journal-modal'?dialog.querySelector('summary') : null;
  (initial || dialog.querySelector('[data-close],button,input'))?.focus({preventScroll:true});
  syncInputMode();
}
function closeModal(event) {
  const savedFocus=modalReturnFocus.get(event.currentTarget);
  modalReturnFocus.delete(event.currentTarget);
  if(document.querySelector('dialog[open]'))return;
  resume();
  requestAnimationFrame(()=>{
    if(document.querySelector('dialog[open]'))return;
    const target=savedFocus?.element?.isConnected && savedFocus.element.getClientRects().length && !savedFocus.element.closest('dialog:not([open])')?savedFocus.element:
      savedFocus?.action?app.querySelector(`[data-action="${CSS.escape(savedFocus.action)}"]`):null;
    (target || app.querySelector('[data-action="transmit"],[data-action="next"],[data-action="observe"]') || app.querySelector('h1'))?.focus({preventScroll:true});
    updateInputHint();
  });
}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close', closeModal);
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
function applySettings() {
  document.body.classList.toggle('touch-controls',settings.touch);
  document.body.dataset.reducedMotion=String(settings.reducedMotion);
  $('#motion-setting').checked=settings.reducedMotion;
  $('#touch-setting').checked = settings.touch;
  try { localStorage.setItem('last-light-settings',JSON.stringify({haptics:settings.haptics,touch:settings.touch,prompts:settings.prompts,reducedMotion:settings.reducedMotion})); } catch { /* Optional. */ }
}

function previewChoice(event) {
  const button=event.target.closest('[data-choice]');
  if(screen==='game' && state.phase==='choose' && button && !state.paused)
    view?.previewMemory?.(button.dataset.choice,scenes[state.sceneIndex].id);
}
app.addEventListener('focusin',event=>{document.body.classList.toggle('controller-menu-focus',controllerConnected);previewChoice(event);});
app.addEventListener('pointerover',previewChoice);

$('#credits-content').innerHTML = `<p>${escape(credits)}</p><h3>Built to remember</h3><p>Original story and procedural sound. The interactive terrain is an artistic reconstruction, not a surveyed map. Rover model: NASA/JPL-Caltech. Ground and rock surfaces use CC0 terrestrial scans by Rob Tuytel, Dario Barresi and Dimitrios Savva / Poly Haven, artistically adapted for Mars. Rendering: Three.js (MIT). The graphics fallback and cover are renders captured from the game.</p><p>This independent project is not affiliated with or endorsed by NASA. Inspiration: the scale of Journey, the curiosity of Outer Wilds, and the grounded science fiction of The Invincible.</p><h3>Primary mission sources</h3><ul class="sources-list">${sources.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)} ↗</a>${s.credit ? `<small>${escape(s.credit)}</small>`:''}</li>`).join('')}<li><a href="https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/" target="_blank" rel="noreferrer">NASA/JPL-Caltech rover model ↗</a></li><li><a href="./vendor/three/LICENSE" target="_blank">Three.js MIT license ↗</a></li></ul>`;
let photoFeedbackTimer;
function photoFeedback(message, state) {
  clearTimeout(photoFeedbackTimer);
  const feedback=$('#photo-feedback');
  feedback.textContent=message;feedback.dataset.state=state;feedback.hidden=false;
  if(state!=='capturing')photoFeedbackTimer=setTimeout(()=>{feedback.hidden=true;},3200);
}
$('#photo-button').addEventListener('click',async()=>{
  const button=$('#photo-button');
  button.disabled=true;
  photoFeedback('Taking photo…','capturing');
  if(!settings.reducedMotion)document.querySelectorAll('.photo-shutter span').forEach((curtain,index)=>{
    curtain.getAnimations().forEach(animation=>animation.cancel());
    const open=`translateY(${index?100:-100}%)`;
    curtain.animate([{transform:open},{transform:'translateY(0)',offset:.35},{transform:'translateY(0)',offset:.48},{transform:open}],{duration:420,easing:'ease-in-out'});
  });
  try {
    const photo=await view?.capturePhoto?.();
    if(!photo)throw new Error('Photo unavailable');
    const url=URL.createObjectURL(photo);
    const link=document.createElement('a');
    link.href=url;
    link.download=`last-light-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    photoFeedback('Photo downloaded','saved');
  } catch {
    photoFeedback('Could not save photo. Try again.','error');
  } finally {
    button.disabled=!worldReady;
  }
});
$('#sound-toggle').addEventListener('click',()=>{soundPreferenceSet=true;toggleSound(!settings.sound);});
$('#sound-setting').addEventListener('change',event=>{soundPreferenceSet=true;toggleSound(event.target.checked);});
$('#touch-setting').addEventListener('change',event=>{
  settings.touch=event.target.checked;
  if (inputDevice==='touch' || inputDevice==='keyboard') inputDevice=settings.touch?'touch':'keyboard';
  applySettings();updateInputHint();
});
document.querySelectorAll('[name="prompt-style"]').forEach(radio=>{
  radio.checked=radio.value===settings.prompts;
  radio.addEventListener('change',()=>{settings.prompts=radio.value;applySettings();refreshControllerPrompts();});
});
$('#motion-setting').addEventListener('change',event=>{settings.reducedMotion=event.target.checked;applySettings();if(currentDiscovery())renderGame();});
$('#activity-help').addEventListener('click',()=>{
  assistanceIntent={sceneId:scenes[state.sceneIndex].id,phase:state.phase,screen};
  $('#assistance-description').textContent=briefingActive?'Finish this introduction and continue the journey?':cameraAiming()?'Use the historical observation for this transmission without taking a new picture?':'Read the discovery and continue without completing this activity? Your journal will mark it as assisted.';
  $('#settings-modal').close();openModal('#assistance-modal');
});
$('#confirm-assistance').addEventListener('click',()=>{
  const intent=assistanceIntent;
  $('#assistance-modal').close();resume();
  if(!intent || intent.sceneId!==scenes[state.sceneIndex].id || intent.phase!==state.phase || intent.screen!==screen){assistanceIntent=null;return;}
  if(briefingActive)finishBriefing({skipped:true});
  else if(cameraAiming())useHistoricalObservation();
  else if(state.phase==='observe' && reached) {
    assistedScenes.add(scenes[state.sceneIndex].id);cancelScan();act({type:'OBSERVE'});
  }
  assistanceIntent=null;
});
$('#settings-toggle').addEventListener('click',()=>openModal('#settings-modal'));
$('#credits-button').addEventListener('click',()=>{$('#settings-modal').close();openModal('#credits-modal');});
$('#restart-button').addEventListener('click',()=>{$('#settings-modal').close();openModal('#restart-modal');});
$('#confirm-restart').addEventListener('click',()=>{
  $('#restart-modal').close();clearDiscovery();assistedScenes.clear(); stopBriefing();cancelScan();cancelTransmission();lastDistance=0; state=createState(); lastScene=null; reached=false; savedCheckpoint=null;pendingCheckpoint=null;
  view?.reset?.(); save(); startBriefing(); window.scrollTo(0,0);
});
$('.brand').addEventListener('click',event=>{event.preventDefault();if(screen==='game')save();cancelScan();renderTitle();window.scrollTo(0,0);});
$('#explore-toggle').addEventListener('click',()=>setExploring(!exploring));

app.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  switch(button.dataset.action) {
    case 'begin': { const fresh=!saved;if(!soundPreferenceSet)toggleSound(true); state=saved || createState(); state={...state,paused:false}; lastScene=null;pendingCheckpoint=savedCheckpoint;if(fresh)startBriefing();else renderGame({focus:true});save();break; }
    case 'capture-discovery': captureDiscovery();break;
    case 'retake-discovery': retakeDiscovery();break;
    case 'use-discovery-photo': useHistoricalObservation();break;
    case 'observe': scan(); break;

    case 'compare-samples': view?.compareToolSamples?.();break;
    case 'choose': act({type:'CHOOSE',choiceId:button.dataset.choice}); break;
    case 'transmit': sendMemory(); break;
    case 'next': act({type:'NEXT'}); break;
    case 'about': openModal('#credits-modal'); break;
    case 'journal': openJournal(); break;
    case 'restart': openModal('#restart-modal'); break;
    case 'text-only': reached=true;renderGame({focus:true});break;

  }
});

function syncToolInput(actualSample=false) {
  if(!geologyActive || state.paused || document.hidden)return;
  const x=(pressed.has('arrowright')?1:0)-(pressed.has('arrowleft')?1:0);
  const y=(pressed.has('arrowdown')?1:0)-(pressed.has('arrowup')?1:0);
  view?.setToolInput?.({x:x || toolPad.x,y:y || toolPad.y,pressure:Math.max(toolPad.pressure,toolButtonHeld || pressed.has(' ')?1:0),actualSample:actualSample || toolButtonHeld || ['arrowleft','arrowright','arrowup','arrowdown',' '].some(key=>pressed.has(key))});
}
app.addEventListener('pointerdown',event=>{const button=event.target.closest('.tool-operate');if(!button || !geologyActive)return;event.preventDefault();button.setPointerCapture(event.pointerId);toolButtonHeld=true;syncToolInput(true);});
const releaseTool=()=>{toolButtonHeld=false;syncToolInput(true);};
app.addEventListener('pointerup',releaseTool);app.addEventListener('pointercancel',releaseTool);app.addEventListener('lostpointercapture',releaseTool);
const pressed = new Set();
window.addEventListener('pointermove',event=>{if(event.pointerType==='mouse' && (event.movementX || event.movementY))document.body.dataset.input='pointer';},{passive:true});
window.addEventListener('pointerdown',()=>{document.body.dataset.input='pointer';},{passive:true});
function drive() {
  if (screen !== 'game' || state.paused || state.phase!=='observe' || reached || scanning || transmitting || scenes[state.sceneIndex].signal === 0) return view?.setDrive?.({forward:0,turn:0});
  const forward=(pressed.has('w')||pressed.has('arrowup')?1:0)-(pressed.has('s')||pressed.has('arrowdown')?1:0);
  const turn=(pressed.has('a')||pressed.has('arrowleft')?1:0)-(pressed.has('d')||pressed.has('arrowright')?1:0);
  view?.setDrive?.({forward:Math.max(-1,Math.min(1,forward+padInput.throttle)),turn:Math.max(-1,Math.min(1,turn-padInput.steer))});
}
window.addEventListener('keydown',event=>{
  if(event.repeat && ['Enter',' '].includes(event.key)) {event.preventDefault();return;}
  if (event.key==='Escape' && !document.querySelector('dialog[open]')) { event.preventDefault();openModal('#settings-modal');return; }
  if (event.key.toLowerCase()==='j' && !document.querySelector('dialog[open]') && screen==='game') {event.preventDefault();openJournal();return;}
  if (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) || document.querySelector('dialog[open]')) return;
  const key=event.key.toLowerCase();
  if(cameraAiming() && ['arrowup','arrowdown','arrowleft','arrowright'].includes(key)){event.preventDefault();pressed.add(key);inspectionLook();return;}
  if(cameraAiming() && key==='enter' && !event.target.closest('button,a,input,summary')){event.preventDefault();captureDiscovery();return;}
  if(geologyActive && ['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){event.preventDefault();pressed.add(key);syncToolInput(true);return;}
  if(geologyActive && key==='enter' && toolState?.stage==='compare'){event.preventDefault();view?.compareToolSamples?.();return;}
  if(contacting && key==='enter' && !event.target.closest('button,a,input,summary')) {event.preventDefault();sendMemory();return;}
  if(investigating && ['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {event.preventDefault();pressed.add(key);inspectionLook();return;}
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key) && screen==='game') {event.preventDefault();pressed.add(key);drive();}
});
function inspectionLook() {if(geologyActive){syncToolInput(true);return;}const value={x:(pressed.has('arrowright')?1:0)-(pressed.has('arrowleft')?1:0),y:(pressed.has('arrowdown')?1:0)-(pressed.has('arrowup')?1:0)};if(investigating || cameraAiming())view?.setLook?.(value);}
window.addEventListener('keyup',event=>{pressed.delete(event.key.toLowerCase());if(investigating || cameraAiming())inspectionLook();else drive();});
window.addEventListener('blur',()=>{pressed.clear();view?.setLook?.({x:0,y:0});drive();});
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
  $('#photo-button').disabled=!worldReady;
  graphicsError=status==='error';
  $('#world-status').textContent=message;
  $('#world-status').dataset.state=status;
  if(status==='error') { $('.world').dataset.fallback='true'; announce(message); }
  if(screen==='game' && (state.phase==='observe' || currentDiscovery())) renderGame();
});
canvas.addEventListener('discovery-camera-sample',event=>{
  if(!cameraAiming())return;
  discoveryReady=event.detail.ready;discoveryAligned=event.detail.aligned;
  const button=app.querySelector('[data-action="capture-discovery"]');if(button)button.disabled=!discoveryReady;
  const panel=app.querySelector('.discovery-camera');if(panel)panel.dataset.aligned=String(discoveryAligned);
  const alignment=$('#discovery-camera-alignment');if(alignment && alignment.dataset.aligned!==String(discoveryAligned)){alignment.dataset.aligned=String(discoveryAligned);alignment.innerHTML='<i></i>'+(discoveryAligned?'FRAMED':'LIVE VIEW');}
  const status=$('#discovery-camera-status'),text=discoveryShot?.error || (!discoveryReady?'Positioning the mast…':discoveryAligned?'Discovery in frame · Take your picture':'Adjust the frame, or capture your own composition');
  if(status && status.textContent!==text)status.textContent=text;
});
canvas.addEventListener('tool-feedback',event=>{
  const allowed=geologyActive && !state.paused && screen==='game' && !document.querySelector('dialog[open]');
  controller?.setToolFeedback?.(allowed?event.detail:undefined);
});
canvas.addEventListener('tool-sample',event=>{
  if(!geologyActive || state.paused || screen!=='game')return;
  const next=event.detail,previous=toolState;toolState=next;
  saveWork();
  if(next.complete){cancelScan();act({type:'OBSERVE'});return;}
  if(next.samples.length>toolSampleCount){toolSampleCount=next.samples.length;save();sound.cue('observe');controller?.feedback('observe');}
  if(previous && (next.stage!==previous.stage || next.samples.length!==previous.samples.length))renderGame();
  const hint=$('#tool-hint');if(hint)hint.textContent=next.hint.replaceAll('R2',controllerConnected?'R2':'Space').replace('×',controllerConnected?'×':'Enter');
  const coverage=$('#tool-coverage');if(coverage)coverage.textContent=`${next.stage==='trace'?'Layers traced':'Brush progress'} · ${Math.round(next.progress*100)}%`;
  const progress=$('#tool-progress');if(progress)progress.value=next.progress;
  sound.setActivity?.({investigating:true,toolActive:next.operating,toolPressure:next.operating?1:0,toolMotion:next.toolMotion});
});
canvas.addEventListener('survey-sample',event=>{
  if(!survey || !investigating || state.paused || screen!=='game')return;
  const now=performance.now(),result=survey.sample(event.detail,(now-investigationSampleAt)/1000);investigationSampleAt=now;
  const profile=surveyProfiles[scenes[state.sceneIndex].id],target=profile.steps[result.step];
  const progress=$('#investigation-progress');if(progress)progress.value=result.progress;
  const hint=$('#investigation-hint');if(hint)hint.textContent=result.hint;
  app.querySelectorAll('[data-survey-step]').forEach(el=>{el.dataset.recorded=String(Number(el.dataset.surveyStep)<result.step);el.dataset.active=String(Number(el.dataset.surveyStep)===result.step);});
  const marker=$('#survey-target');
  if(marker && target){
    const dx=Math.atan2(Math.sin(target.yaw-event.detail.yaw),Math.cos(target.yaw-event.detail.yaw));
    const dy=target.pitch-event.detail.pitch;
    marker.style.transform=`translate(${Math.max(-65,Math.min(65,dx*160))}px,${Math.max(-45,Math.min(45,dy*160))}px)`;
    marker.dataset.aligned=String(Math.abs(dx)<=.16 && Math.abs(dy)<=.16);
  }
  if(result.step>surveyStep){surveyStep=result.step;save();sound.cue('observe');controller?.feedback('observe');announce(result.hint);}
  if(result.complete){cancelScan();act({type:'OBSERVE'});}
});
canvas.addEventListener('inspection-sample',event=>{
  if(!investigating || survey || state.paused) return;
  const now=performance.now();
  const result=investigation.sample(event.detail,(now-investigationSampleAt)/1000);investigationSampleAt=now;
  const progress=$('#investigation-progress');if(progress)progress.value=result.progress;
  const hint=$('#investigation-hint');if(hint)hint.textContent=event.detail.hint;
  if(result.complete) {cancelScan();act({type:'OBSERVE'});}
});
canvas.addEventListener('waypoint-guidance',event=>{
  if(screen!=='game'||state.phase!=='observe'||reached||!goals[state.sceneIndex])return;
  const {x,y,angle,onScreen,steering,remaining}=event.detail;
  const distanceLabel=$('#objective-distance');
  if(distanceLabel && movementBlocked)distanceLabel.textContent=movementBlockReason==='boundary'?'Edge of exploration area · turn back':'Rock contact · reverse or steer around';
  else if(distanceLabel && Number.isFinite(steering) && Number.isFinite(remaining)) distanceLabel.textContent=`${Math.abs(steering)<.25?'Drive ahead':steering>0?'Turn left':'Turn right'} · ${remaining.toFixed(1)} m`;
  if(![x,y,angle].every(Number.isFinite))return;
  const marker=$('#waypoint-hud');
  marker.style.left=`${x*100}%`;marker.style.top=`${y*100}%`;
  marker.style.setProperty('--bearing',`${angle}deg`);
  marker.dataset.onscreen=String(onScreen);marker.hidden=false;
});
canvas.addEventListener('waypoint-reached',()=>{
  if(screen!=='game'||!goals[state.sceneIndex]||reached) return;
  reached=true; setExploring(false); renderGame({focus:true}); save();
  announce('Destination reached. Press Interact to investigate.');sound.cue('observe');controller?.feedback('arrival');
});
canvas.addEventListener('rover-move',event=>{
  movementBlockReason=event.detail.blockedReason??null;
  movementBlocked=!!event.detail.blocked && (Math.abs(padInput.throttle)>.1 || ['w','s','arrowup','arrowdown'].some(key=>pressed.has(key)));
  const moving=event.detail.distance>lastDistance+.001; lastDistance=event.detail.distance;
  if(moving)saveWork();
  if(!contacting)sound.setActivity?.({moving:moving||!!event.detail.blocked,speed:event.detail.speed,roughness:event.detail.roughness});
  controller?.setTerrain({moving:moving||!!event.detail.blocked,blocked:!!event.detail.blocked,power:scenes[state.sceneIndex].power/100,speed:event.detail.speed,roughness:event.detail.roughness,slip:event.detail.slip});
  if(goals[state.sceneIndex] && !reached && Number.isFinite(event.detail.remaining)) $('#waypoint-hud').textContent=`${goals[state.sceneIndex].label} · ${event.detail.remaining.toFixed(1)} m`;
});
function menuTargets() {
  const root=document.querySelector('dialog[open]') || app;
  return controllerMenuTargets(root);
}
function controllerAction(action) {
  document.body.dataset.input='controller';
  const dialog=document.querySelector('dialog[open]');
  if(action==='pause') { if(dialog) dialog.close(); else openModal('#settings-modal'); return; }
  if(action==='back') { if(dialog) dialog.close(); else if(exploring) setExploring(false); else openModal('#settings-modal'); return; }
  if(action==='journal') { if(dialog?.id==='journal-modal') dialog.close(); else if(!dialog && screen!=='title') openJournal(); return; }
  if(briefingActive && !dialog)return;
  const targets=menuTargets();
  if(action.startsWith('nav')) {
    if(exploring) setExploring(false);
    const index=targets.indexOf(document.activeElement);
    const step=['navUp','navLeft'].includes(action)?-1:1;
    const next=index<0 ? (step>0?0:targets.length-1) : (index+step+targets.length)%targets.length;
    targets[next]?.focus({preventScroll:false}); return;
  }
  if(action==='primary') {
    if(cameraAiming() && !dialog){if(document.activeElement?.dataset.action==='use-discovery-photo')useHistoricalObservation();else captureDiscovery();return;}
    if(geologyActive && !dialog && toolState?.stage==='compare'){
      view?.compareToolSamples?.();
      return;
    }
    if(contacting && !dialog) {
      const selected=targets.includes(document.activeElement)?document.activeElement:null;
      if(selected?.matches('[data-action="retake-discovery"]'))selected.click();else sendMemory();
      return;
    }
    if(!dialog && screen==='game' && state.phase==='observe' && !reached && !targets.includes(document.activeElement)) {announce(`Drive to ${goals[state.sceneIndex]?.label || 'the beacon'}. Use the left stick or WASD.`);return;}
    if (!dialog && (transmitting || scanning)) {
      return;
    }
    if(exploring && !dialog) {setExploring(false);return;}
    const focused=targets.includes(document.activeElement)?document.activeElement:null;
    const fallback=dialog ? targets[0] : app.querySelector('[data-action="observe"]:not([disabled]),[data-action="next"],.choice,[data-action="begin"],[data-action="journal"]');
    (focused || fallback)?.click();
  }
}
controller=createController({
  onInput(input) {
    if(input.actualSample && [input.steer,input.throttle,input.lookX,input.lookY,input.leftTrigger,input.rightTrigger].some(v=>Math.abs(v)>.15))document.body.dataset.input='controller';
    if(state.paused || document.querySelector('dialog[open]')) {padInput={throttle:0,steer:0};return;}
    padInput={throttle:input.throttle,steer:input.steer};drive();
    if(cameraAiming()){if(!['arrowup','arrowdown','arrowleft','arrowright'].some(key=>pressed.has(key)))view?.setLook?.({x:input.lookX,y:input.lookY});return;}
    if(geologyActive) {
      toolPad={x:input.actualSample?input.lookX:0,y:input.actualSample?input.lookY:0,pressure:input.actualSample?input.rightTrigger:0};syncToolInput(input.actualSample===true);return;
    }
    if(contacting) {
      const now=performance.now(),dt=(now-uploadInputAt)/1000;uploadInputAt=now;
      if(input.actualSample && Math.max(input.leftTrigger || 0,input.rightTrigger || 0)>.03)document.body.dataset.input='controller';
      updateUploadProgress(squeeze.sample({left:input.leftTrigger,right:input.rightTrigger,actualSample:input.actualSample},dt));
      view?.setLook?.({x:0,y:0});return;
    }
    if(!investigating || !['arrowup','arrowdown','arrowleft','arrowright'].some(key=>pressed.has(key))) view?.setLook?.({x:screen==='game'&&!state.paused&&state.phase==='observe'?input.lookX:0,y:screen==='game'&&!state.paused&&state.phase==='observe'?input.lookY:0});
  },
  onAction:controllerAction,
  onScroll(deltaY) {controllerScrollTarget(app,document.querySelector('dialog[open]'))?.scrollBy({top:deltaY,behavior:'instant'});},
  onStatus(status) {
    const connectionChanged=controllerConnected!==status.connected;
    const disconnected = controllerConnected && !status.connected;
    controllerConnected=status.connected;
    controllerId=status.id;
    if (disconnected && !padPreviewMuted) {
      pressed.clear();padInput={throttle:0,steer:0};view?.stopDrive?.();
      if((screen==='game' || briefingActive) && !document.querySelector('dialog[open]')) {openModal('#settings-modal');announce('Controller disconnected. Journey paused. Reconnect or close settings to continue with other controls.');}
    }
    document.body.classList.toggle('controller-connected',status.connected);
    if(!status.connected)document.body.dataset.input='pointer';
    const detectedFamily = controllerFamily(status.id);
    $('#controller-status').textContent=status.connected ? `${detectedFamily==='playstation'?'PlayStation controller':detectedFamily==='xbox'?'Xbox controller':'Controller'} connected · ${status.haptics?'vibration available':'vibration unavailable in this browser'}` : 'Connect a controller, then press any button.';
    inputDevice = status.connected ? (detectedFamily==='playstation' ? 'dualsense' : 'gamepad') : settings.touch ? 'touch' : 'keyboard';
    refreshControllerPrompts();
    if(connectionChanged && screen==='game' && (geologyActive || ['transmit','received'].includes(state.phase)))renderGame();
    if(contacting)resetUpload();
    $('#adaptive-connect').disabled=!status.adaptiveSupported || status.adaptiveOpen;
    $('#adaptive-disconnect').hidden=!status.adaptiveOpen;
    $('#adaptive-status').textContent=status.message || (status.adaptiveConnected?'USB trigger feedback connected.':status.adaptiveSupported?'Optional: original DualSense via USB. Click or tap to connect.':'USB trigger effects unavailable here. Standard trigger controls still work.');
  },
});
// An isolated preview can suppress physical pad input while another tab is playtested.
controller.setEnabled(!padPreviewMuted);
controller.setHaptics(settings.haptics && !padPreviewMuted);
$('#haptics-setting').checked=settings.haptics;
$('#haptics-setting').addEventListener('change',event=>{settings.haptics=event.target.checked;controller.setHaptics(settings.haptics && !padPreviewMuted);applySettings();});
$('#adaptive-connect').addEventListener('click',()=>controller.connectAdaptiveTriggers());
$('#adaptive-disconnect').addEventListener('click',()=>controller.disconnectAdaptiveTriggers());
window.addEventListener('resize',updateInputHint);
window.addEventListener('blur',()=>{padInput={throttle:0,steer:0};pause();});
window.addEventListener('focus',resume);
window.addEventListener('pagehide',()=>{storyWriter.stop();pause();controller.disconnectAdaptiveTriggers();});
try { view=createLandscape(canvas); } catch(error) {
  graphicsError=true;
  $('.world').dataset.fallback='true';
  $('#world-status').textContent='3D graphics could not start. Try a browser with WebGL 2 enabled.';
  $('#world-status').dataset.state='error';
  console.error(error);
}
applySettings();
renderTitle();
