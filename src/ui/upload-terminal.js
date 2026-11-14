const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const results = {
  reply: 'REPLY RECEIVED', partial: 'PARTIAL IMAGE RECEIVED',
  silence: 'NO REPLY', archive: 'MEMORY KEPT',
};

// The caller owns gesture recognition, live hint text, and stage transitions.
export function renderUploadTerminal({ title, mode, stage, prompt, response, meaning = '', input = 'pointer' }) {
  const upload = mode === 'reply' || mode === 'partial';
  const controller = input === 'controller';
  const verb = mode === 'silence' ? 'call' : mode === 'archive' ? 'keep' : 'send';
  const instruction = controller ? `Squeeze, then release to ${verb}.` : upload
    ? 'Send this memory home with the button below.' : mode === 'silence'
      ? 'Call Opportunity. Then listen.' : 'Keep this memory in the mission archive.';
  const status = stage === 'received' ? (results[mode] || results.reply)
    : upload ? 'SENDING MEMORY' : mode === 'silence' ? 'CALLING' : 'KEEPING MEMORY';
  const footer = stage === 'sending' ? (upload ? 'MEMORY IN TRANSIT' : mode === 'silence' ? 'LISTENING' : 'KEEPING MEMORY')
    : stage === 'received' ? (upload ? 'SAVED IN YOUR ARCHIVE' : mode === 'silence' ? 'CHANNEL QUIET · MEMORY KEPT' : 'ARCHIVED') : '';
  const route = mode === 'archive' ? '<span>EARTH</span><i aria-hidden="true">/</i><span>MISSION ARCHIVE</span>'
    : mode === 'silence' ? '<span>EARTH</span><i aria-hidden="true">→</i><span>OPPORTUNITY · MARS</span>'
      : '<span>OPPORTUNITY · MARS</span><i aria-hidden="true">→</i><span>EARTH</span>';
  const buttonLabel = upload ? 'Upload memory' : mode === 'silence' ? 'Call Opportunity' : 'Keep memory';
  const commitmentLabel = mode === 'silence' ? 'Call commitment' : mode === 'archive' ? 'Archive commitment' : 'Send commitment';
  const action = stage === 'ready'
    ? `<button class="upload-terminal__button" type="button" data-action="transmit">${buttonLabel} <span aria-hidden="true">→</span></button>`
    : stage === 'received' ? '<button class="upload-terminal__button" type="button" data-action="next">Continue <span aria-hidden="true">→</span></button>' : '';
  return `<section class="upload-terminal" data-stage="${escapeHtml(stage)}" data-mode="${escapeHtml(mode)}" data-input="${controller ? 'controller' : 'pointer'}" data-squeeze="release" style="--upload-progress:0;--squeeze-left:0;--squeeze-right:0;--charge-progress:0" aria-label="${upload ? 'Memory uplink' : mode === 'silence' ? 'Earth recovery channel' : 'Mission archive'}">
    <div class="upload-terminal__body">
      <div class="upload-terminal__destination" aria-label="${upload?'Sending from Opportunity to Earth':mode==='silence'?'Calling Opportunity from Earth':'Remembering on Earth'}">${route}</div>
      <div class="upload-terminal__apparatus">
        <div class="signal-map" role="img" aria-label="${mode==='archive'?'Discoveries preserved on Earth':mode==='silence'?'A call travels from Earth to the silent rover on Mars':'A signal travels from Opportunity on Mars to Earth'}">
          <div class="signal-world signal-world--mars"><div class="planet planet--mars"><i></i></div><span>MARS<small>OPPORTUNITY</small></span></div>
          <div class="signal-path" aria-hidden="true"><div class="signal-path__line"></div><div class="signal-path__wave"></div><i class="signal-packet"></i><i class="signal-packet signal-packet--two"></i><i class="signal-packet signal-packet--three"></i><i class="signal-echo"></i><span class="signal-outcome">${stage==='received'?(mode==='partial'?'INCOMPLETE FRAME':mode==='silence'?'NO RETURN SIGNAL':mode==='archive'?'PRESERVED':'RECEIPT RETURNED'):stage==='sending'?'CROSSING THE DISTANCE':'LINK STANDING BY'}</span></div>
          <div class="signal-world signal-world--earth"><div class="planet planet--earth"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 12 37 8 46 18 40 29 27 34 31 45 21 39 14 26ZM35 47 48 50 54 61 47 69 44 85 37 92 35 70 29 57ZM62 9 80 15 90 32 82 40 72 33 69 43 55 37 52 25ZM62 43 75 47 79 58 69 76 60 65 55 51ZM83 69 96 73 93 86 82 83Z"/></svg></div><span>EARTH<small>${mode==='archive'?'MISSION ARCHIVE':'DEEP SPACE NETWORK'}</small></span></div>
        </div>
        ${mode!=='archive'?`<div class="signal-dialogue" aria-label="${stage==='received'?(mode==='reply'?'Call and reply complete':'Call sent. The reply is absent.'):'Outgoing call and expected reply'}"><div class="signal-phrase signal-phrase--question"><span>${mode==='partial'?'FRAGMENT':'CALL'}</span><i></i><i></i><i></i><i></i></div><div class="signal-phrase signal-phrase--answer"><span>${stage==='received' && mode!=='reply'?'NO ANSWER':'REPLY'}</span><i></i><i></i><i></i><i></i></div></div>`:''}
        <div class="upload-terminal__memory"><span class="upload-terminal__label">${mode === 'archive' ? 'A DISCOVERY THAT STAYS' : stage==='sending'?'SIGNAL IN TRANSIT':stage==='received'?(mode==='silence'?'THE CHANNEL STAYS QUIET':mode==='partial'?'AN UNFINISHED FRAME':'AN OBSERVATION SHARED'):mode==='silence'?'A CALL FROM HOME':'OBSERVATION READY'}</span><h2>${escapeHtml(title)}</h2></div>
        <div class="signal-exciter" aria-hidden="true"><div class="upload-terminal__half upload-terminal__half--left"><i></i><span>L2</span></div><span class="upload-terminal__seam"></span><div class="upload-terminal__half upload-terminal__half--right"><i></i><span>R2</span></div></div>
      </div>
      <p class="signal-scale">${mode==='archive'?'THE DISCOVERIES REMAIN':'DISTANCE & TRAVEL TIME COMPRESSED'}</p>
    </div>
    ${stage === 'ready' && meaning ? `<p class="upload-terminal__meaning">${escapeHtml(meaning)}</p>` : ''}
    ${stage === 'ready' ? `<div class="upload-terminal__guidance"><p id="squeeze-hint" class="upload-terminal__instruction">${instruction}</p><progress id="upload-progress" max="1" value="0" aria-label="${commitmentLabel}" style="--upload-progress:0"></progress></div>` : ''}
    ${stage === 'sending' ? `<p class="upload-terminal__sending" role="status">${status}</p><p class="upload-terminal__prompt">${escapeHtml(prompt)}</p>` : ''}
    ${stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    <footer class="upload-terminal__footer"><span>${footer}</span>${action}</footer>
  </section>`;
}
