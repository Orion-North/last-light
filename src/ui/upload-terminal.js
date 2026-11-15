import { controllerGlyph } from './controller-prompts.js';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const results = {
  reply: 'REPLY RECEIVED', partial: 'PARTIAL IMAGE RECEIVED',
  silence: 'NO REPLY', archive: 'MEMORY KEPT',
};

// The caller owns gesture recognition, live hint text, and stage transitions.
export function renderUploadTerminal({ sceneId = '', findings = [], title, mode, stage, prompt, response, meaning = '', input = 'pointer', family = 'playstation', story = '', voice = true }) {
  const upload = mode === 'reply' || mode === 'partial';
  const controller = input === 'controller';
  const verb = mode === 'silence' ? 'call' : mode === 'archive' ? 'keep' : 'send';
  const instruction = controller ? `Squeeze both triggers. Release to ${verb}.` : upload
    ? 'Send this memory home with the button below.' : mode === 'silence'
      ? 'Call Opportunity. Then listen.' : 'Keep this memory in the mission archive.';
  const status = results[mode] || results.reply;
  const operationalResponse = /^Earth[’']s call, imagined:/i.test(response || '') ? 'No signal is received from Opportunity.' : response;
  // An absent rover thought is authored silence, not a request for Earth dialogue.
  const showOperationalResponse = !voice && (mode === 'silence' || mode === 'archive');
  const buttonLabel = upload ? 'Upload memory' : mode === 'silence' ? 'Call Opportunity' : 'Keep memory';
  const commitmentLabel = mode === 'silence' ? 'Call commitment' : mode === 'archive' ? 'Archive commitment' : 'Send commitment';
  const action = stage === 'ready' && !controller
    ? `<button class="upload-terminal__button" type="button" data-action="transmit">${buttonLabel} <span aria-hidden="true">→</span></button>`
    : stage === 'received' ? '<button class="upload-terminal__button" type="button" data-action="next">Continue <span aria-hidden="true">→</span></button>' : '';
  return `<section class="upload-terminal" data-presentation="${story?'story':'standalone'}" data-stage="${escapeHtml(stage)}" data-mode="${escapeHtml(mode)}" data-input="${controller ? 'controller' : 'pointer'}" data-squeeze="release" style="--upload-progress:0;--squeeze-left:0;--squeeze-right:0;--charge-progress:0" aria-label="${upload ? 'Memory uplink' : mode === 'silence' ? 'Earth recovery channel' : 'Mission archive'}">
    <div class="upload-terminal__body">
      ${findings.length?`<div class="evidence-readings" aria-label="Compared observations">${findings.map(f=>`<p><span>${escapeHtml(f.label)}</span><strong>${escapeHtml(f.reading)}</strong></p>`).join('')}</div>`:''}
      ${['earth-listens','months','last-call'].includes(sceneId)?`<ol class="recovery-trace" aria-label="Unanswered recovery attempts">${[['earth-listens','JUN 2018'],['months','AUTUMN'],['last-call','FEB 2019']].map(([id,date],i)=>`<li data-reached="${i<=['earth-listens','months','last-call'].indexOf(sceneId)}"><i aria-hidden="true"></i><span>${date}</span></li>`).join('')}</ol>`:''}
      <div class="upload-terminal__apparatus">
        <div class="signal-map" role="img" aria-label="${mode==='archive'?'Discoveries preserved on Earth':mode==='silence'?'A call travels from Earth to the silent rover on Mars':'A signal travels from Opportunity on Mars to Earth'}">
          <div class="signal-world signal-world--mars"><div class="planet planet--mars"><i></i></div><span>MARS<small>OPPORTUNITY</small></span></div>
          <div class="signal-path" aria-hidden="true"><div class="signal-path__line"></div><div class="signal-path__wave"></div><i class="signal-packet"></i><i class="signal-packet signal-packet--two"></i><i class="signal-packet signal-packet--three"></i><i class="signal-echo"></i></div>
          <div class="signal-world signal-world--earth"><div class="planet planet--earth"></div><span>EARTH<small>${mode==='archive'?'MISSION ARCHIVE':'DEEP SPACE NETWORK'}</small></span></div>
        </div>
        ${mode!=='archive'?`<div class="signal-dialogue" aria-label="${stage==='received'?(mode==='reply'?'Call and reply complete':'Call sent. The reply is absent.'):'Outgoing call and expected reply'}"><div class="signal-phrase signal-phrase--question"><span>${mode==='partial'?'FRAGMENT':'CALL'}</span><i></i><i></i><i></i><i></i></div><div class="signal-phrase signal-phrase--answer"><span>${stage==='received' && mode!=='reply'?'NO ANSWER':'REPLY'}</span><i></i><i></i><i></i><i></i></div></div>`:''}
        ${story?'':`<div class="upload-terminal__memory"><h2>${escapeHtml(title)}</h2></div>`}
        ${story ? '' : `<div class="signal-exciter" aria-hidden="true"><div class="upload-terminal__half upload-terminal__half--left"><i></i><span data-trigger="left">${controllerGlyph('reverse',family)}</span></div><span class="upload-terminal__seam"></span><div class="upload-terminal__half upload-terminal__half--right"><i></i><span data-trigger="right">${controllerGlyph('forward',family)}</span></div></div>`}
      </div>
    </div>
    ${story?`<div class="story-shell ${voice?'':'story-voice-absent'}">${story}${stage==='ready' && controller?`<div class="signal-exciter" aria-hidden="true"><div class="upload-terminal__half upload-terminal__half--left"><i></i><span data-trigger="left">${controllerGlyph('reverse',family)}</span></div><span class="upload-terminal__seam"></span><div class="upload-terminal__half upload-terminal__half--right"><i></i><span data-trigger="right">${controllerGlyph('forward',family)}</span></div></div>`:''}`:''}
    ${story && !voice && mode==='archive' && stage==='ready'?`<p class="story-operational">${escapeHtml(title)}</p>`:''}
    ${!story && stage === 'ready' && meaning ? `<p class="upload-terminal__meaning">${escapeHtml(meaning)}</p>` : ''}
    ${stage === 'ready' ? `<div class="upload-terminal__guidance"><p id="squeeze-hint" class="upload-terminal__instruction">${instruction}</p><progress id="upload-progress" max="1" value="0" aria-label="${commitmentLabel}" style="--upload-progress:0"></progress></div>` : ''}
    ${!story && stage === 'sending' ? `<p class="upload-terminal__prompt" role="status">${escapeHtml(prompt)}</p>` : ''}
    ${story && stage === 'received' ? `<p class="story-receipt" data-mode="${escapeHtml(mode)}">${status}</p>${showOperationalResponse?`<p class="story-operational">${escapeHtml(operationalResponse)}</p>`:''}`:''}
    ${story && !voice && mode==='silence' && stage==='sending'?`<p class="story-operational" role="status">${escapeHtml(prompt)}</p>`:''}
    ${!story && stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    ${action?`<footer class="upload-terminal__footer">${action}</footer>`:''}
    ${story?'</div>':''}
  </section>`;
}
