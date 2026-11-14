const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const results = {
  reply: 'REPLY RECEIVED',
  partial: 'PARTIAL IMAGE RECEIVED',
  silence: 'NO REPLY',
  archive: 'MEMORY KEPT',
};

// The caller owns progress, gesture recognition, and the stage transition.
export function renderUploadTerminal({ title, mode, stage, prompt, response, input = 'pointer' }) {
  const upload = mode === 'reply' || mode === 'partial';
  const header = upload ? 'UPLINK <i aria-hidden="true">/</i> MEMORY BUFFER'
    : mode === 'silence' ? 'EARTH <i aria-hidden="true">/</i> RECOVERY CHANNEL'
      : 'MISSION <i aria-hidden="true">/</i> ARCHIVE';
  const buttonLabel = upload ? 'Upload memory' : mode === 'silence' ? 'Call Opportunity' : 'Keep memory';
  const status = stage === 'received' ? (results[mode] || results.reply)
    : stage === 'sending' ? (upload ? 'SENDING MEMORY' : mode === 'silence' ? 'CALLING' : 'KEEPING MEMORY')
      : (upload ? 'READY TO UPLOAD' : mode === 'silence' ? 'READY TO CALL' : 'READY TO KEEP');
  const controller = input === 'controller';
  const instruction = controller ? 'Release both triggers' : (upload ? 'Send this memory home with the button below.' : mode === 'silence' ? 'Call Opportunity. Then listen.' : 'Keep this memory in the mission archive.');
  const commitmentLabel = mode === 'silence' ? 'Call commitment' : mode === 'archive' ? 'Archive commitment' : 'Send commitment';
  const footer = stage === 'sending' ? (upload ? 'MEMORY IN TRANSIT' : mode === 'silence' ? 'LISTENING' : 'KEEPING MEMORY')
    : stage === 'received' ? (upload ? 'TRANSMISSION ENDED' : mode === 'silence' ? 'CHANNEL QUIET' : 'ARCHIVED')
      : upload ? 'A MEMORY FOR EARTH' : mode === 'silence' ? 'EARTH IS LISTENING' : 'MISSION ARCHIVE';
  const action = stage === 'ready'
    ? `<button class="upload-terminal__button" type="button" data-action="transmit">${buttonLabel} <span aria-hidden="true">${upload ? '·' : '→'}</span></button>`
    : stage === 'received'
      ? '<button class="upload-terminal__button" type="button" data-action="next">Continue <span aria-hidden="true">→</span></button>' : '';
  return `<section class="upload-terminal" data-stage="${escapeHtml(stage)}" data-mode="${escapeHtml(mode)}" data-input="${controller ? 'controller' : 'pointer'}" data-squeeze="release" style="--upload-progress:0;--squeeze-left:0;--squeeze-right:0" aria-label="${upload ? 'Memory uplink' : mode === 'silence' ? 'Earth recovery channel' : 'Mission archive'}">
    <header class="upload-terminal__header"><span>${header}</span><span class="upload-terminal__status"><b aria-hidden="true"></b>${status}</span></header>
    <div class="upload-terminal__body">
      <div class="upload-terminal__memory"><span class="upload-terminal__label">SELECTED MEMORY</span><h2>${escapeHtml(title)}</h2>${stage === 'ready' ? '' : `<p class="upload-terminal__prompt">${escapeHtml(prompt)}</p>`}</div>
      <div class="upload-terminal__instrument" aria-hidden="true">
        <div class="upload-terminal__destination"><b></b><span>${mode === 'silence' ? 'OPPORTUNITY' : mode === 'archive' ? 'MISSION ARCHIVE' : 'EARTH'}</span></div>
        <div class="upload-terminal__lane">
          <span class="upload-terminal__axis"></span>
          <svg class="upload-terminal__dish" viewBox="0 0 320 320" fill="none">
            <g class="upload-terminal__half upload-terminal__half--left"><path d="M137 49C78 60 46 102 46 160s32 100 91 111"/><path d="M132 69C88 83 65 116 65 160s23 77 67 91"/><path d="M45 160h24M92 89l11 13M92 231l11-13"/></g>
            <g class="upload-terminal__half upload-terminal__half--right"><path d="M183 49c59 11 91 53 91 111s-32 100-91 111"/><path d="M188 69c44 14 67 47 67 91s-23 77-67 91"/><path d="M275 160h-24M228 89l-11 13M228 231l-11-13"/></g>
          </svg><span class="upload-terminal__trigger upload-terminal__trigger--left">LEFT</span><span class="upload-terminal__trigger upload-terminal__trigger--right">RIGHT</span>
          <div class="upload-terminal__memory-core"><span>${mode === 'silence' ? 'CALL' : 'MEMORY'}</span><i></i></div><span class="upload-terminal__signal"></span>
        </div>
        <span class="upload-terminal__origin">${mode === 'silence' ? 'EARTH / RECOVERY' : mode === 'archive' ? 'EARTH / REMEMBRANCE' : 'OPPORTUNITY / MARS'}</span>
      </div>
    </div>
    ${stage === 'ready' ? `<p id="squeeze-hint" class="upload-terminal__instruction">${instruction}</p><div class="upload-terminal__progress"><span>${controller ? 'CONTACT' : 'READY'}</span><progress id="upload-progress" max="1" value="0" aria-label="${commitmentLabel}" style="--upload-progress:0"></progress></div>` : ''}
    ${stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    <footer class="upload-terminal__footer"><span>${footer}</span>${action}</footer>
  </section>`;
}
