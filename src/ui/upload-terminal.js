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
        <div class="upload-terminal__half upload-terminal__half--left" aria-hidden="true"><span>LEFT</span><i></i></div>
        <div class="upload-terminal__memory"><span class="upload-terminal__label">${mode === 'silence' ? 'ONE MORE CALL' : mode === 'archive' ? 'TO REMEMBER' : 'A MEMORY FOR EARTH'}</span><h2>${escapeHtml(title)}</h2><span class="upload-terminal__seam" aria-hidden="true"></span></div>
        <div class="upload-terminal__half upload-terminal__half--right" aria-hidden="true"><span>RIGHT</span><i></i></div>
        <div class="upload-terminal__signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="upload-terminal__receipt" aria-hidden="true"></span>
      </div>
    </div>
    ${stage === 'ready' && meaning ? `<p class="upload-terminal__meaning">${escapeHtml(meaning)}</p>` : ''}
    ${stage === 'ready' ? `<div class="upload-terminal__guidance"><p id="squeeze-hint" class="upload-terminal__instruction">${instruction}</p><progress id="upload-progress" max="1" value="0" aria-label="${commitmentLabel}" style="--upload-progress:0"></progress></div>` : ''}
    ${stage === 'sending' ? `<p class="upload-terminal__sending" role="status">${status}</p><p class="upload-terminal__prompt">${escapeHtml(prompt)}</p>` : ''}
    ${stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    <footer class="upload-terminal__footer"><span>${footer}</span>${action}</footer>
  </section>`;
}
