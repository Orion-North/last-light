const { ipcRenderer } = require('electron');
// Sandboxed isolated world: no contextBridge API and no renderer-accessible IPC.
window.addEventListener('click', event => {
  if (!event.isTrusted || event.button !== 0) return;
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  try {
    const url = new URL(link.href);
    if (url.protocol !== 'https:' || url.username || url.password) return;
    event.preventDefault();
    ipcRenderer.send('open-source', url.href);
  } catch {}
}, true);
