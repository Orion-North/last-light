import test from 'node:test';
import assert from 'node:assert/strict';
import { createController } from '../../src/input/controller.js';

function fixture() {
  const win = new EventTarget(), doc = new EventTarget(), hid = new EventTarget();
  doc.hidden = false;
  let timeNow = 0;
  let raf, cancelled = false, pads = [], resets = 0;
  const pulses = [], inputs = [], actions = [], statuses = [], touches = [], scrolls = [];
  win.requestAnimationFrame = fn => { raf = fn; return 1; };
  win.cancelAnimationFrame = () => { cancelled = true; };
  const pad = { id: 'DualSense', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })),
    vibrationActuator: { effects: ['dual-rumble'], playEffect: async (...args) => pulses.push(args), reset: async () => { resets++; } } };
  const nav = { getGamepads: () => pads, hid };
  const driver = createController({ navigator: nav, window: win, document: doc, now: () => timeNow,
    onInput: value => inputs.push(value), onAction: value => actions.push(value), onStatus: value => statuses.push(value),
    onTouch: value => touches.push(value), onScroll: value => scrolls.push(value) });
  return { win, doc, hid, pad, driver, inputs, actions, statuses, pulses, nav, touches, scrolls,
    tick: (time = 0) => { timeNow = time; raf(time); }, pads: value => { pads = value; }, get resets() { return resets; }, get cancelled() { return cancelled; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const assertNeutral = input => assert.deepEqual([input.steer, input.throttle, input.lookX, input.lookY], [0, 0, 0, 0]);
function usb() {
  return Object.assign(new EventTarget(), { vendorId: 0x054c, productId: 0x0ce6, opened: false, reports: [], closes: 0,
    collections: [{ usagePage: 1, usage: 5, inputReports: [{ items: [{ reportSize: 8, reportCount: 63 }] }] }],
    async open() { this.opened = true; }, async close() { this.opened = false; this.closes++; },
    async sendReport(id, data) { this.reports.push({ id, data: Array.from(data) }); } });
}

function touchReport(device, { x = 0, y = 0, active = true, second = false, reportId = 1, length = 63 } = {}) {
  const data = new DataView(new ArrayBuffer(length));
  if (length >= 40) {
    data.setUint8(32, 0x80); data.setUint8(36, 0x80);
    const offset = second ? 36 : 32;
    data.setUint8(offset, active ? 3 : 0x83);
    data.setUint8(offset + 1, x & 255);
    data.setUint8(offset + 2, ((x >> 8) & 15) | ((y & 15) << 4));
    data.setUint8(offset + 3, y >> 4);
  }
  const event = new Event('inputreport');
  Object.assign(event, { device, data, reportId }); device.dispatchEvent(event);
}

test('opted-in USB touch decodes packed coordinates and either active contact', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device];
  touchReport(device); assert.deepEqual(f.touches, []); // no implicit permission/listener
  await f.driver.connectAdaptiveTriggers();
  touchReport(device, { x: 1919, y: 1079 });
  assert.deepEqual(f.touches.at(-1), { x: 1, y: 1, active: true });
  touchReport(device, { x: 0, y: 0, second: true });
  assert.deepEqual(f.touches.at(-1), { x: -1, y: -1, active: true });
  touchReport(device, { x: 960, y: 540 });
  assert.ok(Math.abs(f.touches.at(-1).x) < .002 && Math.abs(f.touches.at(-1).y) < .002);
  const count = f.touches.length;
  touchReport(device, { reportId: 0x31 }); touchReport(device, { length: 12 });
  assert.equal(f.touches.length, count);
  touchReport(device, { active: false });
  assert.deepEqual(f.touches.at(-1), { x: 0, y: 0, active: false });
  await f.driver.destroy();
});

test('USB touch releases on interruption, stale report, unplug, and explicit disconnect', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  for (const interrupt of [
    () => f.driver.setPaused(true),
    () => f.win.dispatchEvent(new Event('blur')),
    () => { f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); },
  ]) {
    touchReport(device); assert.equal(f.touches.at(-1).active, true);
    interrupt(); assert.equal(f.touches.at(-1).active, false);
    const count = f.touches.length; touchReport(device); assert.equal(f.touches.length, count);
    f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange'));
    f.win.dispatchEvent(new Event('focus')); f.driver.setPaused(false);
  }
  touchReport(device); f.tick(251); assert.equal(f.touches.at(-1).active, false);
  touchReport(device); f.pads([]); f.tick(252); assert.equal(f.touches.at(-1).active, false);
  f.pads([f.pad]); f.tick(253); touchReport(device);
  await f.driver.disconnectAdaptiveTriggers(); assert.equal(f.touches.at(-1).active, false);
  const count = f.touches.length; touchReport(device); assert.equal(f.touches.length, count);
  await f.driver.connectAdaptiveTriggers(); touchReport(device);
  const unplug = new Event('disconnect'); unplug.device = device; f.hid.dispatchEvent(unplug);
  assert.equal(f.touches.at(-1).active, false); await settle();
  await f.driver.connectAdaptiveTriggers(); touchReport(device);
  await f.driver.destroy(); assert.equal(f.touches.at(-1).active, false);
});

test('menu right stick scrolls while paused with bounded delta and neutral game input', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.driver.setInputMode('menu'); f.driver.setPaused(true);
  f.pad.axes[3] = 1; f.tick(50); assert.equal(f.scrolls.at(-1), 21); assertNeutral(f.inputs.at(-1));
  f.tick(10000); assert.equal(f.scrolls.at(-1), 21);
  f.pad.axes[3] = -1; f.tick(10010); assert.equal(f.scrolls.at(-1), -4.2);
  const count = f.scrolls.length;
  f.win.dispatchEvent(new Event('blur')); f.tick(10020); assert.equal(f.scrolls.length, count);
  f.win.dispatchEvent(new Event('focus')); f.driver.setInputMode('drive'); f.driver.setPaused(false);
  f.tick(10030); assert.equal(f.scrolls.length, count);
  await f.driver.destroy();
});

test('standard input applies deadzones, trigger precedence and one action per press', async () => {
  const f = fixture(); f.pads([null, f.pad]); f.tick();
  f.pad.axes = [0.1, -1, 0.59, -0.59]; f.pad.buttons[0].pressed = true;
  f.tick(); f.tick();
  assert.deepEqual(f.actions, ['primary']);
  assert.equal(f.inputs.at(-1).steer, 0); assert.equal(f.inputs.at(-1).throttle, 1);
  assert.ok(Math.abs(f.inputs.at(-1).lookX - 0.5) < 1e-10);
  f.pad.buttons[7].value = 0.7; f.tick(); assert.equal(f.inputs.at(-1).throttle, 0.7);
  f.pad.buttons[0].pressed = false; f.tick(); f.pad.buttons[0].pressed = true; f.tick();
  assert.deepEqual(f.actions, ['primary', 'primary']);
  await f.driver.destroy(); assert.equal(f.cancelled, true);
});

test('menu stick is neutral, hysteretic, and repeats at bounded intervals while paused', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.driver.setInputMode('menu'); f.driver.setPaused(true); f.tick(0);
  f.pad.axes = [1, 0, 1, -1]; f.pad.buttons[7].value = 1;
  f.tick(1); assert.deepEqual(f.actions, ['navRight']); assertNeutral(f.inputs.at(-1));
  f.tick(350); assert.equal(f.actions.length, 1);
  f.tick(351); assert.equal(f.actions.length, 2);
  f.tick(490); assert.equal(f.actions.length, 2);
  f.tick(491); assert.equal(f.actions.length, 3);
  f.tick(5000); assert.equal(f.actions.length, 4); // no catch-up burst
  f.pad.axes[0] = .5; f.tick(5140); assert.equal(f.actions.length, 5);
  f.pad.axes[0] = .35; f.tick(5300);
  f.pad.axes[0] = .5; f.tick(5500); assert.equal(f.actions.length, 5);
  f.pad.axes[0] = -.8; f.tick(5501); assert.equal(f.actions.at(-1), 'navLeft');
  f.pad.buttons[0].pressed = true; f.tick(5502); assert.equal(f.actions.at(-1), 'primary');
  assertNeutral(f.inputs.at(-1));
  await f.driver.destroy();
});

test('new menu contexts and reconnects gate held stick until neutral', async () => {
  const f = fixture(); f.pad.axes[1] = -1; f.pads([f.pad]); f.tick();
  f.driver.setInputMode('menu'); f.tick(1000); assert.deepEqual(f.actions, []);
  f.pad.axes[1] = 0; f.tick(1001);
  f.pad.axes[1] = -1; f.tick(1002); assert.deepEqual(f.actions, ['navUp']);
  f.pads([]); f.tick(1003); f.pads([f.pad]); f.tick(2000);
  assert.deepEqual(f.actions, ['navUp']);
  f.pad.axes[1] = 0; f.tick(2001); f.pad.axes[1] = 1; f.tick(2002);
  assert.deepEqual(f.actions, ['navUp', 'navDown']);
  await f.driver.destroy();
});

test('explicit menu rearm gates a held stick across same-mode screen changes', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.driver.setInputMode('menu'); f.tick(0);
  f.pad.axes[0] = 1; f.tick(1); assert.deepEqual(f.actions, ['navRight']);
  f.driver.rearmMenu(); f.driver.setInputMode('menu'); f.driver.setPaused(true);
  f.tick(1000); f.tick(2000); assert.deepEqual(f.actions, ['navRight']);
  f.pad.axes[0] = .3; f.tick(2001);
  f.pad.axes[0] = -1; f.tick(2002); assert.deepEqual(f.actions, ['navRight', 'navLeft']);
  f.driver.setInputMode('menu'); f.tick(2352);
  assert.deepEqual(f.actions, ['navRight', 'navLeft', 'navLeft']);
  assertNeutral(f.inputs.at(-1));
  await f.driver.destroy();
});

test('blur and hidden pages cannot replay held menu input or face buttons', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.driver.setInputMode('menu'); f.tick();
  f.win.dispatchEvent(new Event('blur'));
  f.pad.axes[0] = 1; f.pad.buttons[0].pressed = true;
  f.win.dispatchEvent(new Event('focus')); f.tick(1000);
  assert.deepEqual(f.actions, []);
  f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange'));
  f.pad.buttons[2].pressed = true; f.tick(2000);
  f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange')); f.tick(3000);
  assert.deepEqual(f.actions, []);
  f.pad.axes[0] = 0; f.pad.buttons[0].pressed = false; f.tick(3001);
  f.pad.axes[0] = 1; f.pad.buttons[0].pressed = true; f.tick(3002);
  assert.deepEqual(f.actions, ['primary', 'navRight']);
  await f.driver.destroy();
});

test('inspection retains right-stick look without drive and drive mode restores original axes', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.pad.axes = [1, -1, 1, -.59];
  f.driver.setInputMode('inspect'); f.tick();
  assert.equal(f.inputs.at(-1).throttle, 0); assert.equal(f.inputs.at(-1).steer, 0);
  assert.equal(f.inputs.at(-1).lookX, 1); assert.ok(f.inputs.at(-1).lookY < 0);
  f.driver.setPaused(true); assertNeutral(f.inputs.at(-1));
  f.driver.setPaused(false); f.driver.setInputMode('drive'); f.tick();
  assert.equal(f.inputs.at(-1).throttle, 1); assert.equal(f.inputs.at(-1).steer, 1);
  await f.driver.destroy();
});

test('dpad is menu navigation; pause keeps menu actions and neutralizes drive', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.pad.axes[1] = -1; f.pad.buttons[12].pressed = true; f.tick();
  assert.equal(f.actions.at(-1), 'navUp');
  f.driver.setPaused(true); assert.equal(f.inputs.at(-1).throttle, 0);
  f.pad.buttons[0].pressed = true; f.tick(); assert.equal(f.actions.at(-1), 'primary');
  assert.equal(f.inputs.at(-1).throttle, 0);
  f.driver.setEnabled(false); f.pad.buttons[9].pressed = true; f.tick();
  assert.equal(f.actions.includes('pause'), false);
  await f.driver.destroy();
});

test('unmapped controllers ignored; disconnect, hide and haptics off stop feedback', async () => {
  const f = fixture(); f.pad.mapping = ''; f.pads([f.pad]); f.tick();
  assert.equal(f.inputs.length, 0); assert.equal(f.driver.feedback(), false);
  f.pad.mapping = 'standard'; f.tick(); assert.equal(f.driver.feedback('transmit'), true);
  assert.equal(f.pulses[0][0], 'dual-rumble');
  f.driver.setHaptics(false); assert.equal(f.driver.feedback(), false);
  f.driver.setHaptics(true); f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.inputs.at(-1).throttle, 0); assert.equal(f.driver.feedback(), false);
  f.doc.hidden = false; f.pads([]); f.tick();
  assert.equal(f.statuses.at(-1).connected, false); assert.ok(f.resets >= 3);
  await f.driver.destroy();
});

test('USB opt-in uses narrow filters, mild resistance and resets before closing', async () => {
  const f = fixture(), device = usb(); let filters;
  f.hid.requestDevice = async options => { filters = options.filters; return [device]; };
  f.pads([f.pad]); f.tick();
  assert.equal(await f.driver.connectAdaptiveTriggers(), true);
  assert.deepEqual(filters, [{ vendorId: 0x054c, productId: 0x0ce6, usagePage: 1, usage: 5 }]);
  f.driver.setTerrain({ moving: true, power: 1 }); await settle();
  const effect = device.reports.at(-1);
  assert.equal(effect.id, 2); assert.equal(effect.data.length, 47); assert.equal(effect.data[0], 12);
  assert.deepEqual(effect.data.slice(10, 13), [1, 80, 24]);
  assert.deepEqual(effect.data.slice(21, 24), [1, 80, 24]);
  f.driver.setPaused(true); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  f.driver.setPaused(false); f.driver.setTerrain({ moving: true }); await settle(); assert.equal(device.reports.at(-1).data[10], 1);
  f.driver.setHaptics(false); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  await f.driver.disconnectAdaptiveTriggers(); assert.equal(device.closes, 1);
  assert.equal(device.reports.at(-1).data[21], 5); await f.driver.destroy();
});

test('rejects Bluetooth descriptor, unknown Sony product and cancelled picker', async () => {
  const f = fixture(), device = usb();
  device.collections[0].inputReports[0].items[0].reportCount = 77;
  f.hid.requestDevice = async () => [device];
  assert.equal(await f.driver.connectAdaptiveTriggers(), false); assert.equal(device.opened, false);
  device.collections[0].inputReports[0].items[0].reportCount = 63; device.productId = 0x0df2;
  assert.equal(await f.driver.connectAdaptiveTriggers(), false);
  f.hid.requestDevice = async () => { throw new Error('cancel'); };
  assert.equal(await f.driver.connectAdaptiveTriggers(), false); await f.driver.destroy();
});

test('HID output coalesces pending terrain changes and destroy ends with off report', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  let release, inFlight = 0, max = 0;
  device.sendReport = async function(id, data) {
    inFlight++; max = Math.max(max, inFlight); this.reports.push({ id, data: Array.from(data) });
    await new Promise(resolve => { release = resolve; }); inFlight--;
  };
  f.driver.setTerrain({ moving: true });
  for (let i = 0; i < 50; i++) f.driver.setTerrain({ blocked: i % 2 === 0 });
  const closing = f.driver.destroy();
  release(); await settle();
  assert.equal(device.reports.at(-1).data[10], 5); assert.equal(max, 1);
  release(); await closing; assert.equal(device.opened, false);
  assert.equal(device.reports.length, 3);
});

test('destroy while permission picker is open never adopts the selected device', async () => {
  const f = fixture(), device = usb(); let choose;
  f.hid.requestDevice = () => new Promise(resolve => { choose = resolve; });
  const connecting = f.driver.connectAdaptiveTriggers(); await f.driver.destroy();
  choose([device]); assert.equal(await connecting, false); assert.equal(device.opened, false);
  assert.equal(device.reports.length, 0);
});

 test('stale terrain, blur and hidden reset resistance; reconnect latches held buttons', async () => {
  const f = fixture(), device = usb(); f.hid.requestDevice = async () => [device];
  f.pad.buttons[0].pressed = true; f.pads([f.pad]); f.tick(); assert.deepEqual(f.actions, []);
  await f.driver.connectAdaptiveTriggers(); f.driver.setTerrain({ moving: true }); await settle();
  assert.equal(device.reports.at(-1).data[10], 1);
  f.tick(401); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  f.driver.setTerrain({ moving: true }); await settle();
  f.win.dispatchEvent(new Event('blur')); await settle();
  assert.equal(device.reports.at(-1).data[10], 5); assert.equal(f.driver.feedback(), false);
  f.win.dispatchEvent(new Event('focus')); f.tick(402); await settle();
  assert.equal(device.reports.at(-1).data[10], 5);
  f.driver.setTerrain({ moving: true }); f.doc.hidden = true;
  f.doc.dispatchEvent(new Event('visibilitychange')); await settle();
  assert.equal(device.reports.at(-1).data[21], 5);
  f.doc.hidden = false; f.pads([]); f.tick(); f.pads([f.pad]); f.tick();
  assert.deepEqual(f.actions, []); await f.driver.destroy();
});

 test('terrain texture follows measured roughness/speed/slip with bounded short pulses', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.driver.setTerrain({ moving: true, speed: 1, roughness: 0, slip: 0 }); f.tick(10); await settle();
  const smooth = f.pulses.at(-1)[1];
  f.driver.setTerrain({ speed: 3, roughness: 1, slip: 1 }); f.tick(170); await settle();
  const rough = f.pulses.at(-1)[1];
  assert.ok(rough.duration <= 100 && rough.duration >= 50);
  assert.ok(rough.strongMagnitude > smooth.strongMagnitude && rough.strongMagnitude <= 0.4);
  assert.ok(rough.weakMagnitude > smooth.weakMagnitude && rough.weakMagnitude <= 0.5);
  const count = f.pulses.length; f.tick(190); assert.equal(f.pulses.length, count);
  f.driver.setTerrain({ moving: false, blocked: true }); f.tick(500); assert.equal(f.pulses.length, count);
  await f.driver.destroy();
});

test('HID errors report unavailable and disconnect closes without repeated output retries', async () => {
  const f = fixture(), device = usb(); f.hid.requestDevice = async () => [device];
  device.sendReport = async () => { throw new Error('OS denied write'); };
  assert.equal(await f.driver.connectAdaptiveTriggers(), false);
  assert.equal(device.opened, false); assert.equal(f.statuses.at(-1).adaptiveConnected, false);
  assert.match(f.statuses.at(-1).message, /unavailable/);
  device.sendReport = async function(id, data) { this.reports.push({ id, data: Array.from(data) }); };
  assert.equal(await f.driver.connectAdaptiveTriggers(), true);
  const event = new Event('disconnect'); event.device = device; f.hid.dispatchEvent(event); await settle();
  assert.equal(device.opened, false); assert.equal(f.statuses.at(-1).adaptiveConnected, false);
  await f.driver.destroy();
});

 test('USB effects follow a matching original DualSense, never another pad or Edge', async () => {
  const f = fixture(), device = usb(); f.hid.requestDevice = async () => [device];
  const other = { ...f.pad, index: 1, id: 'Xbox Controller' };
  f.pads([other]); f.tick(); await f.driver.connectAdaptiveTriggers();
  f.driver.setTerrain({ moving: true }); await settle();
  assert.equal(device.reports.at(-1).data[10], 5);
  other.id = 'Xbox Wireless Controller'; f.tick(); f.driver.setTerrain({ moving: true }); await settle();
  assert.equal(device.reports.at(-1).data[10], 5);
  f.pads([other, f.pad]); f.tick(); await settle();
  assert.equal(f.statuses.at(-1).id, 'DualSense');
  assert.equal(device.reports.at(-1).data[10], 1);
  f.pad.id = 'DualSense Edge (Vendor: 054c Product: 0df2)'; f.pads([f.pad]); f.tick(); await settle();
  assert.equal(device.reports.at(-1).data[10], 5);
  await f.driver.destroy();
});

 test('HID write failure turns connected capability off and polling does not retry', async () => {
  const f = fixture(), device = usb(); f.hid.requestDevice = async () => [device];
  f.pads([f.pad]); f.tick(); await f.driver.connectAdaptiveTriggers();
  let attempts = 0;
  device.sendReport = async () => { attempts++; throw new Error('unplug'); };
  f.driver.setTerrain({ moving: true }); await settle();
  assert.equal(f.statuses.at(-1).adaptiveConnected, false);
  for (let i = 0; i < 10; i++) { f.tick(i * 10); f.driver.setTerrain({ roughness: i / 10 }); }
  await settle(); assert.equal(attempts, 1);
  await f.driver.destroy();
});
