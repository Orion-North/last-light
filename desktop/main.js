import { app, BrowserWindow, dialog, ipcMain, net, protocol, session, shell } from 'electron';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { APP_URL, deviceAllowed, isLocal, resourcePath, safeExternal, supportedDevice } from './policy.js';

protocol.registerSchemesAsPrivileged([{ scheme: 'last-light', privileges: {
  standard: true, secure: true, supportFetchAPI: true, corsEnabled: true,
} }]);
const smoke = process.argv.includes('--smoke-test');
if (smoke) setTimeout(() => { console.error('LAST_LIGHT_SMOKE timed out'); app.exit(1); }, 40000).unref();
if (smoke) app.setPath('userData', path.join(app.getPath('temp'), `last-light-smoke-${process.pid}`));
let win;
const approved = new Set(); // Session-only; a fresh launch always requires selection.
let choosing = false;

function localMain(contents) {
  return !!win && contents === win.webContents && !contents.isDestroyed() && isLocal(contents.getURL());
}

app.whenReady().then(async () => {
  const ses = session.fromPartition('persist:last-light');
  const gameRoot = path.join(app.getAppPath(), 'game');
  const index = await readFile(path.join(gameRoot, 'index.html'), 'utf8');
  const importMap = index.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1] || '';
  const hash = createHash('sha256').update(importMap).digest('base64');
  const csp = `default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`;
  await ses.protocol.handle('last-light', async request => {
    const file = resourcePath(gameRoot, request.url);
    if (!file || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404 });
    try {
      const response = await net.fetch(pathToFileURL(file).href);
      const headers = new Headers(response.headers);
      headers.set('Content-Security-Policy', csp);
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
    }
    catch { return new Response('Not found', { status: 404 }); }
  });
  // Bundled code/assets only. The external browser handles explicit source links.
  ses.webRequest.onBeforeRequest((details, callback) => {
    const local = isLocal(details.url);
    const memory = details.url.startsWith('blob:last-light://game/');
    callback({ cancel: !local && !memory && !details.url.startsWith('data:') });
  });
  ses.setPermissionCheckHandler((contents, permission, origin, details) =>
    permission === 'hid' && localMain(contents) && isLocal(origin) && details.isMainFrame === true);
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(permission === 'hid' && localMain(contents) && details.isMainFrame === true &&
      isLocal(details.requestingUrl));
  });
  // Never grant by VID/PID alone; only a device selected in this run is allowed.
  ses.setDevicePermissionHandler(details => deviceAllowed(details, approved));
  ses.on('select-hid-device', async (event, details, callback) => {
    event.preventDefault();
    const frame = details.frame;
    if (choosing || !frame || !win || frame !== win.webContents.mainFrame || !isLocal(frame.url)) {
      callback(); return;
    }
    const devices = details.deviceList.filter(supportedDevice).slice(0, 8);
    if (!devices.length) { callback(); return; }
    choosing = true;
    try {
      const result = await dialog.showMessageBox(win, {
        type: 'question', title: 'Connect DualSense USB features',
        message: 'Allow Last Light to use this original DualSense?',
        detail: 'USB trigger resistance is experimental. Vibration settings control all feedback. Cancel or disconnect in Settings at any time.',
        buttons: [...devices.map((device, index) => `Connect ${index + 1}: ${device.name || 'DualSense'}`), 'Cancel'],
        defaultId: devices.length, cancelId: devices.length, noLink: true,
      });
      const selected = devices[result.response];
      if (!selected || !win || win.isDestroyed() || frame !== win.webContents.mainFrame || !isLocal(frame.url)) {
        callback(); return;
      }
      approved.add(selected.deviceId);
      callback(selected.deviceId);
    } catch { callback(); }
    finally { choosing = false; }
  });
  ses.on('hid-device-revoked', (_event, details) => approved.delete(details.device?.deviceId));

  win = new BrowserWindow({
    title: 'Last Light', width: 1440, height: 900, minWidth: 760, minHeight: 560,
    backgroundColor: '#110e0d', autoHideMenuBar: true, show: !smoke,
    webPreferences: { session: ses, preload: path.join(app.getAppPath(), 'preload.cjs'), contextIsolation: true, sandbox: true,
      nodeIntegration: false, webSecurity: true, webviewTag: false, spellcheck: false },
  });
  win.removeMenu();
  const contents = win.webContents;
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('will-navigate', event => { if (!isLocal(event.url)) event.preventDefault(); });
  contents.on('will-frame-navigate', event => { if (!isLocal(event.url)) event.preventDefault(); });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // Only the isolated preload sees trusted DOM clicks; no API is exposed to game JS.
  ipcMain.on('open-source', (event, url) => {
    if (event.sender !== contents || event.senderFrame !== contents.mainFrame ||
        !isLocal(event.senderFrame.url) || !safeExternal(url)) return;
    shell.openExternal(url).catch(() => {});
  });
  const rendererErrors = [];
  if (smoke) {
    contents.on('console-message', details => {
      if (details.level === 'error') rendererErrors.push(`console: ${details.message} (${details.sourceId}:${details.lineNumber})`);
    });
    contents.on('preload-error', (_event, file, error) => rendererErrors.push(`preload: ${file}: ${error.message}`));
    contents.on('did-fail-load', (_event, code, description, url) => rendererErrors.push(`load: ${url}: ${code} ${description}`));
    contents.debugger.attach('1.3');
    contents.debugger.on('message', (_event, method, params) => {
      if (method === 'Runtime.exceptionThrown') {
        const detail = params.exceptionDetails;
        rendererErrors.push(`page: ${detail.exception?.description || detail.text}`);
      }
    });
    // Do not block the first navigation on a renderer context that does not exist yet.
    contents.debugger.sendCommand('Runtime.enable').catch(error => rendererErrors.push(`debugger: ${error.message}`));
  }
  contents.on('render-process-gone', () => { if (smoke) app.exit(1); });
  await win.loadURL(APP_URL);
  if (smoke) {
    const deadline = Date.now() + 30000;
    let result;
    do {
      result = await contents.executeJavaScript(`({
        secure: isSecureContext, hid: typeof navigator.hid?.requestDevice === 'function',
        sandbox: typeof process === 'undefined' && typeof require === 'undefined',
        game: !!document.querySelector('#app')?.children.length,
        world: document.querySelector('#world-status')?.dataset.state,
        local: location.href === ${JSON.stringify(APP_URL)}
      })`);
      if (rendererErrors.length || result.world === 'error' || result.world === 'ready') break;
      await new Promise(resolve => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    // Verify custom-protocol MIME under nosniff, and the actual NASA GLB header.
    const assets = await contents.executeJavaScript(`(async () => {
      const script = await fetch('./src/main.js');
      const css = await fetch('./src/ui/style.css');
      const rover = await fetch('./public/models/opportunity.glb');
      const bytes = new Uint8Array(await rover.arrayBuffer());
      return {
        scriptMime: script.ok && ['text/javascript', 'application/javascript'].includes((script.headers.get('content-type') || '').split(';')[0].trim()),
        cssMime: css.ok && (css.headers.get('content-type') || '').split(';')[0].trim() === 'text/css',
        rover: rover.ok && bytes.length > 1000000 && String.fromCharCode(...bytes.slice(0, 4)) === 'glTF'
      };
    })()`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('LAST_LIGHT_SMOKE', JSON.stringify({ ...result, ...assets, rendererErrors }));
    app.exit(result.world === 'ready' && [result.secure, result.hid, result.sandbox, result.game, result.local,
      ...Object.values(assets)].every(Boolean) && rendererErrors.length === 0 ? 0 : 1);
  }

}).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => app.quit());
