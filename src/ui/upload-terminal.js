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
      <div class="upload-terminal__instrument" aria-hidden="true">
        <div class="upload-terminal__destination"><b></b><span>${mode === 'silence' ? 'OPPORTUNITY' : mode === 'archive' ? 'MISSION ARCHIVE' : 'EARTH'}</span></div>
        <div class="upload-terminal__lane">
          <svg class="upload-terminal__dish" viewBox="0 0 320 320" fill="none"><circle cx="160" cy="160" r="144"/><circle cx="160" cy="160" r="119"/><ellipse cx="160" cy="160" rx="65" ry="144"/><path d="M16 160h288M160 16v288M58 58l204 204M58 262 262 58"/><path class="upload-terminal__reflector" d="M39 205Q160 318 281 205M67 237Q160 290 253 237M160 160l-40 117m40-117 40 117"/></svg>
          <span class="upload-terminal__axis"></span>
          <span class="upload-terminal__bearing">${mode === 'archive' ? 'PRESERVE' : mode === 'silence' ? 'LISTEN' : 'DEEP SPACE'}</span>
          ${upload ? '<div class="upload-terminal__packet"><span>MEMORY</span><strong>↑</strong></div>' : '<div class="upload-terminal__channel">◌</div>'}
        </div>
        <span class="upload-terminal__origin">${mode === 'silence' ? 'EARTH / RECOVERY' : mode === 'archive' ? 'EARTH / REMEMBRANCE' : 'OPPORTUNITY / MARS'}</span>
      </div>
    </div>
    ${upload && stage === 'ready' ? '<div class="upload-terminal__progress"><span>GESTURE</span><progress id="upload-progress" max="1" value="0" aria-label="Upload gesture progress" style="--upload-progress:0"></progress></div>' : ''}
    ${stage === 'received' ? `<div class="upload-terminal__response" role="status"><span>${status}</span><p>${escapeHtml(response)}</p></div>` : ''}
    <footer class="upload-terminal__footer"><span>${footer}</span>${action}</footer>
  </section>`;
}
