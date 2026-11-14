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
export function renderUploadTerminal({ title, mode, stage, prompt, response }) {
  const upload = mode === 'reply' || mode === 'partial';
  const header = upload ? 'UPLINK <i aria-hidden="true">/</i> MEMORY BUFFER'
    : mode === 'silence' ? 'EARTH <i aria-hidden="true">/</i> RECOVERY CHANNEL'
      : 'MISSION <i aria-hidden="true">/</i> ARCHIVE';
  const buttonLabel = upload ? 'Upload memory' : mode === 'silence' ? 'Call Opportunity' : 'Keep memory';
  const status = stage === 'received' ? (results[mode] || results.reply)
    : stage === 'sending' ? (upload ? 'SENDING MEMORY' : mode === 'silence' ? 'CALLING' : 'KEEPING MEMORY')
      : (upload ? 'READY TO UPLOAD' : mode === 'silence' ? 'READY TO CALL' : 'READY TO KEEP');
  const footer = stage === 'sending' ? (upload ? 'MEMORY IN TRANSIT' : mode === 'silence' ? 'LISTENING' : 'KEEPING MEMORY')
    : stage === 'received' ? (upload ? 'TRANSMISSION ENDED' : mode === 'silence' ? 'CHANNEL QUIET' : 'ARCHIVED')
      : upload ? 'SWIPE UP OR USE BUTTON' : 'USE BUTTON TO CONTINUE';
  const action = stage === 'ready'
    ? `<button class="upload-terminal__button" type="button" data-action="transmit">${buttonLabel} <span aria-hidden="true">${upload ? '↑' : '→'}</span></button>`
    : stage === 'received'
      ? '<button class="upload-terminal__button" type="button" data-action="next">Continue <span aria-hidden="true">→</span></button>' : '';
  return `<section class="upload-terminal" data-stage="${escapeHtml(stage)}" data-mode="${escapeHtml(mode)}" style="--upload-progress:0" aria-label="${upload ? 'Memory uplink' : mode === 'silence' ? 'Earth recovery channel' : 'Mission archive'}">
    <header class="upload-terminal__header"><span>${header}</span><span class="upload-terminal__status"><b aria-hidden="true"></b>${status}</span></header>
    <div class="upload-terminal__body">
      <div class="upload-terminal__memory"><span class="upload-terminal__label">SELECTED MEMORY</span><h2>${escapeHtml(title)}</h2><p class="upload-terminal__prompt">${escapeHtml(prompt)}</p></div>
      <div class="upload-terminal__lane" aria-hidden="true">${upload ? '<div class="upload-terminal__chevron">⌃</div><div class="upload-terminal__track"><span></span><span></span><span></span></div><div class="upload-terminal__packet"><span>MEMORY</span><strong>↑</strong></div>' : '<div class="upload-terminal__channel">◌</div>'}</div>
    </div>
    ${upload && stage === 'ready' ? '<div class="upload-terminal__progress"><span>GESTURE</span><progress id="upload-progress" max="1" value="0" aria-label="Upload gesture progress" style="--upload-progress:0"></progress></div>' : ''}
    ${stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    <footer class="upload-terminal__footer"><span>${footer}</span>${action}</footer>
  </section>`;
}
