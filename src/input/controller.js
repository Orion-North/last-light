// Browser-standard input; optional USB DualSense output. Protocol sources: docs/CONTROLLERS.md.
const ACTIONS = { 0: 'primary', 1: 'back', 2: 'journal', 3: 'camera', 9: 'pause', 12: 'navUp', 13: 'navDown', 14: 'navLeft', 15: 'navRight' };
const clamp = (n, min = -1, max = 1) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));
const axis = n => Math.abs(clamp(n)) < 0.18 ? 0 : clamp(Math.sign(n) * (Math.abs(clamp(n)) - 0.18) / 0.82);
const button = (pad, i) => clamp(pad?.buttons?.[i]?.value ?? (pad?.buttons?.[i]?.pressed ? 1 : 0), 0, 1);
const pressed = (pad, i) => !!pad?.buttons?.[i]?.pressed || button(pad, i) > 0.5;
const originalDualSense = pad => {
  const id = pad?.id || '';
  if (/edge|0df2|0x0df2|xbox|xinput|microsoft|045e/i.test(id)) return false;
  const vendor = id.match(/vendor:\s*(?:0x)?([0-9a-f]{4})/i);
  const product = id.match(/product:\s*(?:0x)?([0-9a-f]{4})/i);
  if (vendor && vendor[1].toLowerCase() !== '054c') return false;
  if (product && product[1].toLowerCase() !== '0ce6') return false;
  return /054c.*0ce6|0ce6.*054c|dualsense|wireless controller/i.test(id);
};
const usbCollection = device => device.collections?.some(c => c.usagePage === 1 && c.usage === 5 &&
  Math.max(0, ...(c.inputReports || []).map(r => (r.items || []).reduce((n, i) => n + i.reportSize * i.reportCount, 0))) === 504);

export function createController({ onInput = () => {}, onAction = () => {}, onStatus = () => {}, onTouch = () => {}, onScroll = () => {},
  navigator: nav = globalThis.navigator, window: win = globalThis.window, document: doc = globalThis.document, now: clock = () => globalThis.performance.now() } = {}) {
  let enabled = true, paused = false, blurred = false, haptics = true, destroyed = false, pad = null, previous = {}, frame;
  let inputMode = 'drive', menuNeedsNeutral = true, menuDirection = '', menuRepeatAt = 0;
  let touchActive = false, touchAt = -Infinity, lastPollAt = null, touchBlocked = false;
  let touchPoint = { x: 0, y: 0, id: null };
  let device = null, closing = false, connecting = false, generation = 0, pending = null, writing = null, lastReport = '', outputFailed = false;
  let terrain = { moving: false, blocked: false, power: 1 }, lastPulse = -Infinity, terrainAt = -Infinity;
  let lastStatus = '', rumbling = false;
  const active = () => enabled && !paused && !blurred && !doc?.hidden && !destroyed;
  const actuator = () => pad?.vibrationActuator;
  const canRumble = () => !!actuator()?.playEffect && (!actuator().effects || actuator().effects.includes('dual-rumble'));
  function status(message = '') {
    const value = { connected: !!pad, id: pad?.id || '', haptics: canRumble(), adaptiveSupported: !!nav?.hid?.requestDevice,
      adaptiveConnected: !!device && !closing && !outputFailed, adaptiveOpen: !!device && !closing, message };
    const key = JSON.stringify(value);
    if (key !== lastStatus) { lastStatus = key; onStatus(value); }
  }
  function neutral() { onInput({ steer: 0, throttle: 0, lookX: 0, lookY: 0, connected: !!pad, actualSample: false }); }
  function releaseTouch(cancelled = true) {
    if (cancelled && touchActive) touchBlocked = true;
    if (touchActive) { touchActive = false; onTouch({ ...touchPoint, active: false, cancelled }); }
  }
  function inputReport(event) {
    if (event.device !== device || !device?.opened || closing || !active() || !originalDualSense(pad)) return;
    const data = event.data;
    if (event.reportId !== 1 || data?.byteLength !== 63 || typeof data.getUint8 !== 'function') return;
    // Sony-authored Linux hid-playstation: USB common payload points[0] at32.
    // Contact bit7 means inactive; coordinates are packed little-endian12-bit.
    const first = !(data.getUint8(32) & 0x80), second = !(data.getUint8(36) & 0x80);
    if (!first && !second) { releaseTouch(false); touchBlocked = false; return; }
    if (first && second) { releaseTouch(); touchBlocked = true; return; }
    if (touchBlocked) return;
    const offset = first ? 32 : 36;
    const id = data.getUint8(offset) & 0x7f;
    if (touchActive && id !== touchPoint.id) { releaseTouch(); touchBlocked = true; return; }
    const middle = data.getUint8(offset + 2);
    const x = data.getUint8(offset + 1) | ((middle & 15) << 8);
    const y = (middle >> 4) | (data.getUint8(offset + 3) << 4);
    touchAt = clock(); touchActive = true;
    touchPoint = { x: clamp(x / 1919 * 2 - 1), y: clamp(y / 1079 * 2 - 1), id };
    onTouch({ ...touchPoint, active: true, cancelled: false });
  }
  function gateMenu() { menuNeedsNeutral = true; menuDirection = ''; menuRepeatAt = 0; }
  function latchButtons() { previous = Object.fromEntries(Object.keys(ACTIONS).map(i => [i, pressed(pad, i)])); }
  function menuStick(now) {
    const x = clamp(pad.axes?.[0]), y = clamp(pad.axes?.[1]);
    const magnitude = Math.max(Math.abs(x), Math.abs(y));
    if (menuNeedsNeutral) {
      if (magnitude <= .3) menuNeedsNeutral = false;
      return;
    }
    if (magnitude < .4) { menuDirection = ''; return; }
    if (magnitude < .6 && !menuDirection) return;
    const direction = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'navLeft' : 'navRight') : (y < 0 ? 'navUp' : 'navDown');
    if (direction !== menuDirection) {
      menuDirection = direction; menuRepeatAt = now + 350;
      onAction(direction);
    } else if (now >= menuRepeatAt) {
      menuRepeatAt = now + 140;
      onAction(direction);
    }
  }
  function stopRumble() { try { Promise.resolve(actuator()?.reset?.()).catch(() => {}); } catch {} }
  function report() {
    const data = new Uint8Array(47);
    // Only the two trigger-valid bits; leave audio, LEDs, and motor ownership alone.
    data[0] = 0x0c;
    // Mode 5 fully disengages and withdraws the trigger actuator.
    data[10] = data[21] = 5;
    if (active() && haptics && originalDualSense(pad) && !closing && terrain.moving && clock() - terrainAt < 400) {
      // Mode 1: continuous resistance after a start position. Deliberately mild.
      const strength = terrain.blocked ? 60 : Math.round(clamp(24 + clamp(terrain.roughness, 0, 1) * 18 + clamp(terrain.slip, 0, 1) * 12 + (terrain.power < 0.3 ? 5 : 0), 0, 60));
      for (const offset of [10, 21]) data.set([1, 80, strength], offset);
    }
    return data;
  }
  function queueReport(force = false) {
    if (!device?.opened || (outputFailed && !force)) return Promise.resolve();
    const data = report(), key = data.join(',');
    if (!force && key === lastReport) return writing || Promise.resolve();
    lastReport = key; pending = data;
    if (!writing) {
      const target = device;
      writing = (async () => {
        while (pending && target.opened) {
          const next = pending; pending = null;
          try { await target.sendReport(0x02, next); }
          catch { pending = null; outputFailed = true; status('Adaptive trigger output unavailable.'); break; }
        }
      })().finally(() => { writing = null; });
    }
    return writing;
  }
  function cleanup() { neutral(); releaseTouch(); stopRumble(); queueReport(true); }
  function feedback(kind = 'observe') {
    if (!active() || !haptics || !canRumble() || rumbling) return false;
    if (kind === 'choose') kind = 'choice';
    if (kind === 'arrival') kind = 'observe';
    const effects = { observe: [100, 0.18, 0.12], transmit: [220, 0.28, 0.12], choice: [65, 0.1, 0.15], blocked: [95, 0.25, 0.18], terrain: [65, 0.06, 0.1] };
    let [duration, strongMagnitude, weakMagnitude] = effects[kind] || effects.observe;
    if (kind === 'terrain') {
      const rough = clamp(terrain.roughness, 0, 1), slip = clamp(terrain.slip, 0, 1), speed = clamp(Math.abs(terrain.speed || 0) / 3, 0, 1);
      duration = Math.round(50 + rough * 35);
      strongMagnitude = clamp(0.025 + rough * 0.22 + slip * 0.13, 0, 0.4) * (0.35 + speed * 0.65);
      weakMagnitude = clamp(0.04 + rough * 0.28 + slip * 0.18, 0, 0.5) * (0.4 + speed * 0.6);
    }
    try { rumbling = true; Promise.resolve(actuator().playEffect('dual-rumble', { startDelay: 0, duration, strongMagnitude, weakMagnitude })).catch(() => {}).finally(() => { rumbling = false; }); return true; } catch { rumbling = false; return false; }
  }
  function poll() {
    const now = clock();
    if (destroyed) return;
    const delta = lastPollAt === null ? 0 : Math.max(0, Math.min(.05, (now - lastPollAt) / 1000));
    lastPollAt = now;
    if (touchActive && now - touchAt > 250) releaseTouch();
    let pads = [];
    try { pads = Array.from(nav?.getGamepads?.() || []); } catch {}
    const next = (device && pads.find(p => p && p.connected !== false && p.mapping === 'standard' && originalDualSense(p)))
      || pads.find(p => p && p.connected !== false && p.mapping === 'standard' && p.index === pad?.index)
      || pads.find(p => p && p.connected !== false && p.mapping === 'standard') || null;
    if (next?.index !== pad?.index || next?.id !== pad?.id) {
      stopRumble(); releaseTouch(); pad = next; latchButtons(); gateMenu(); neutral(); queueReport(true); status();
    } else pad = next;
    if (pad) {
      const current = {};
      for (const [index, action] of Object.entries(ACTIONS)) current[index] = pressed(pad, index);
      // Paused menus still receive button actions; disabled/hidden pages do not.
      if (enabled && !blurred && !doc?.hidden) for (const [index, action] of Object.entries(ACTIONS)) {
        if (enabled && !blurred && !doc?.hidden && current[index] && !previous[index]) onAction(action);
      }
      previous = current;
      if (inputMode === 'menu' && enabled && !blurred && !doc?.hidden) {
        neutral();
        menuStick(now);
        const scroll = axis(pad.axes?.[3]) * 420 * delta;
        if (scroll) onScroll(scroll);
      } else if (active()) {
        const trigger = button(pad, 7) - button(pad, 6);
        onInput({ steer: inputMode === 'inspect' ? 0 : axis(pad.axes?.[0]), throttle: inputMode === 'inspect' ? 0 : Math.abs(trigger) > 0.05 ? trigger : -axis(pad.axes?.[1]),
          lookX: axis(pad.axes?.[2]), lookY: axis(pad.axes?.[3]), connected: true, actualSample: true });
        if (terrain.moving && now - terrainAt < 400 && now - lastPulse >= 160 - clamp(terrain.roughness, 0, 1) * 50 - clamp(Math.abs(terrain.speed || 0) / 3, 0, 1) * 30) { feedback(terrain.blocked ? 'blocked' : 'terrain'); lastPulse = now; }
      }
    }
    queueReport();
    frame = win?.requestAnimationFrame?.(poll);
  }
  async function disconnectAdaptiveTriggers() {
    generation++;
    releaseTouch();
    if (!device || closing) return writing;
    closing = true;
    device.removeEventListener?.('inputreport', inputReport);
    await queueReport(true);
    const old = device; device = null; pending = null; lastReport = '';
    try { if (old.opened) await old.close(); } catch {}
    closing = false; status();
  }
  async function connectAdaptiveTriggers() {
    if (destroyed || connecting || closing || device || !nav?.hid?.requestDevice) return false;
    connecting = true; const token = ++generation;
    try {
      // Must be invoked directly by a settings button, never from polling.
      const devices = await nav.hid.requestDevice({ filters: [{ vendorId: 0x054c, productId: 0x0ce6, usagePage: 1, usage: 5 }] });
      const selected = devices[0];
      if (!selected) { status('Adaptive triggers were not connected.'); return false; }
      if (selected.vendorId !== 0x054c || selected.productId !== 0x0ce6 || !usbCollection(selected)) {
        status('Adaptive triggers require an original DualSense connected by USB.'); return false;
      }
      if (!selected.opened) await selected.open();
      if (token !== generation || destroyed) { await selected.close(); return false; }
      device = selected; device.addEventListener?.('inputreport', inputReport);
      lastReport = ''; outputFailed = false; await queueReport(true);
      if (outputFailed) { await disconnectAdaptiveTriggers(); status('Adaptive trigger output unavailable.'); return false; }
      status('USB touchpad and trigger features connected.'); return true;
    } catch { status('Adaptive triggers unavailable; standard controls still work.'); return false; }
    finally { connecting = false; }
  }
  function visibility() { gateMenu(); latchButtons(); if (doc?.hidden) { terrain.moving = false; cleanup(); } else queueReport(); }
  function blur() { blurred = true; gateMenu(); terrain.moving = false; cleanup(); }
  function focus() { blurred = false; gateMenu(); latchButtons(); queueReport(); }
  function disconnected(event) {
    if (event.gamepad?.index === pad?.index) { stopRumble(); pad = null; previous = {}; cleanup(); status(); }
  }
  function hidDisconnected(event) { if (event.device === device) disconnectAdaptiveTriggers(); }
  doc?.addEventListener?.('visibilitychange', visibility);
  win?.addEventListener?.('gamepaddisconnected', disconnected);
  win?.addEventListener?.('blur', blur); win?.addEventListener?.('focus', focus);
  nav?.hid?.addEventListener?.('disconnect', hidDisconnected);
  status(); frame = win?.requestAnimationFrame?.(poll);
  return {
    rearmMenu() { gateMenu(); },
    setInputMode(mode) {
      if (!['drive', 'menu', 'inspect'].includes(mode) || mode === inputMode) return;
      inputMode = mode; gateMenu(); neutral();
    },
    setEnabled(value) { enabled = !!value; gateMenu(); latchButtons(); if (!enabled) cleanup(); else queueReport(); },
    setPaused(value) { paused = !!value; if (paused) { terrain.moving = false; cleanup(); } else queueReport(); },
    pause(value = true) { this.setPaused(value); },
    setHaptics(value) { haptics = !!value; if (!haptics) stopRumble(); queueReport(true); },
    feedback,
    setTerrain(value) { terrain = { ...terrain, ...value }; terrainAt = clock(); queueReport(); },
    connectAdaptiveTriggers, disconnectAdaptiveTriggers,
    async destroy() {
      if (destroyed) return;
      destroyed = true; win?.cancelAnimationFrame?.(frame); cleanup();
      doc?.removeEventListener?.('visibilitychange', visibility);
      win?.removeEventListener?.('gamepaddisconnected', disconnected);
      win?.removeEventListener?.('blur', blur); win?.removeEventListener?.('focus', focus);
      nav?.hid?.removeEventListener?.('disconnect', hidDisconnected);
      await disconnectAdaptiveTriggers();
    },
  };
}
