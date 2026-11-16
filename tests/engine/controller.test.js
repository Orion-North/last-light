import test from 'node:test';
import assert from 'node:assert/strict';
import { createController } from '../../src/input/controller.js';

function fixture(onAction = () => {}) {
  const win = new EventTarget(), doc = new EventTarget(), hid = new EventTarget();
  doc.hidden = false;
  let timeNow = 0;
  let raf, cancelled = false, pads = [], resets = 0;
  const pulses = [], inputs = [], actions = [], statuses = [], touches = [], scrolls = [], activities = [];
  win.requestAnimationFrame = fn => { raf = fn; return 1; };
  win.cancelAnimationFrame = () => { cancelled = true; };
  const pad = { id: 'DualSense', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })),
    vibrationActuator: { effects: ['dual-rumble'], playEffect: async (...args) => pulses.push(args), reset: async () => { resets++; } } };
  const nav = { getGamepads: () => pads, hid };
  const driver = createController({ navigator: nav, window: win, document: doc, now: () => timeNow,
    onActivity: () => activities.push(timeNow), onInput: value => inputs.push(value), onAction: value => { actions.push(value); onAction(value); }, onStatus: value => statuses.push(value),
    onTouch: value => touches.push(value), onScroll: value => scrolls.push(value) });
  return { win, doc, hid, pad, driver, inputs, actions, statuses, pulses, nav, touches, scrolls, activities,
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

function touchReport(device, { x = 0, y = 0, active = true, second = false, both = false, id = 3, reportId = 1, length = 63 } = {}) {
  const data = new DataView(new ArrayBuffer(length));
  if (length >= 40) {
    data.setUint8(32, 0x80); data.setUint8(36, 0x80);
    const offset = second ? 36 : 32;
    data.setUint8(offset, active ? id : 0x80 | id);
    if (both) data.setUint8(second ? 32 : 36, 4);
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
  assert.deepEqual(f.touches.at(-1), { x: 1, y: 1, id: 3, active: true, cancelled: false });
  touchReport(device, { x: 0, y: 0, second: true });
  assert.deepEqual(f.touches.at(-1), { x: -1, y: -1, id: 3, active: true, cancelled: false });
  touchReport(device, { x: 960, y: 540 });
  assert.ok(Math.abs(f.touches.at(-1).x) < .002 && Math.abs(f.touches.at(-1).y) < .002);
  const count = f.touches.length;
  touchReport(device, { reportId: 0x31 }); touchReport(device, { length: 12 });
  assert.equal(f.touches.length, count);
  const lastPoint = f.touches.at(-1);
  touchReport(device, { active: false });
  assert.deepEqual(f.touches.at(-1), { ...lastPoint, active: false, cancelled: false });
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
    interrupt(); assert.equal(f.touches.at(-1).active, false); assert.equal(f.touches.at(-1).cancelled, true);
    const count = f.touches.length; touchReport(device); assert.equal(f.touches.length, count);
    f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange'));
    f.win.dispatchEvent(new Event('focus')); f.driver.setPaused(false);
    touchReport(device, { active: false });
  }
  touchReport(device); f.tick(251); assert.equal(f.touches.at(-1).active, false);
  assert.equal(f.touches.at(-1).cancelled, true); touchReport(device, { active: false });
  touchReport(device); f.pads([]); f.tick(252); assert.equal(f.touches.at(-1).active, false);
  f.pads([f.pad]); f.tick(253); touchReport(device, { active: false }); touchReport(device);
  await f.driver.disconnectAdaptiveTriggers(); assert.equal(f.touches.at(-1).active, false);
  const count = f.touches.length; touchReport(device); assert.equal(f.touches.length, count);
  await f.driver.connectAdaptiveTriggers(); touchReport(device, { active: false }); touchReport(device);
  const unplug = new Event('disconnect'); unplug.device = device; f.hid.dispatchEvent(unplug);
  assert.equal(f.touches.at(-1).active, false); await settle();
  await f.driver.connectAdaptiveTriggers(); touchReport(device, { active: false }); touchReport(device);
  await f.driver.destroy(); assert.equal(f.touches.at(-1).active, false);
});

test('touch replacement and two fingers cancel instead of producing a real release', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  touchReport(device, { id: 5, x: 1000, y: 200 });
  const original = f.touches.at(-1);
  touchReport(device, { id: 6, x: 1000, y: 200 });
  assert.deepEqual(f.touches.at(-1), { ...original, active: false, cancelled: true });
  const count = f.touches.length;
  touchReport(device, { id: 6 }); touchReport(device, { active: false });
  assert.equal(f.touches.length, count); // no second release may commit
  touchReport(device, { id: 7 }); assert.equal(f.touches.at(-1).active, true);
  touchReport(device, { id: 7, both: true }); assert.equal(f.touches.at(-1).cancelled, true);
  const afterTwo = f.touches.length;
  touchReport(device, { id: 7 }); assert.equal(f.touches.length, afterTwo);
  touchReport(device, { active: false }); touchReport(device, { id: 8, second: true });
  assert.equal(f.touches.at(-1).id, 8); assert.equal(f.touches.at(-1).active, true);
  await f.driver.destroy();
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

test('synthetic neutral reports cannot masquerade as physically sampled neutral sticks', async () => {
  const f = fixture(); f.pad.axes[3] = -1; f.pads([f.pad]); f.tick();
  assert.equal(f.inputs.at(-1).actualSample, true);
  f.driver.setInputMode('inspect');
  assertNeutral(f.inputs.at(-1)); assert.equal(f.inputs.at(-1).actualSample, false);
  f.tick(10); assert.equal(f.inputs.at(-1).lookY, -1); assert.equal(f.inputs.at(-1).actualSample, true);
  f.pad.axes[3] = 0; f.tick(20);
  assert.equal(f.inputs.at(-1).lookY, 0); assert.equal(f.inputs.at(-1).actualSample, true);
  f.driver.setPaused(true); assert.equal(f.inputs.at(-1).actualSample, false);
  f.driver.setInputMode('menu'); f.tick(30); assert.equal(f.inputs.at(-1).actualSample, false);
  f.win.dispatchEvent(new Event('blur')); assert.equal(f.inputs.at(-1).actualSample, false);
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

test('uplink samples analog triggers with neutral axes and honest synthetic samples', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.pad.axes = [1, -1, 1, -1];
  f.pad.buttons[6].value = .37; f.pad.buttons[7].value = .83;
  f.driver.setInputMode('uplink');
  assert.equal(f.inputs.at(-1).actualSample, false);
  assert.equal(f.inputs.at(-1).leftTrigger, 0); assert.equal(f.inputs.at(-1).rightTrigger, 0);
  f.tick(1); const sample = f.inputs.at(-1); assertNeutral(sample);
  assert.equal(sample.actualSample, true); assert.equal(sample.connected, true);
  assert.equal(sample.leftTrigger, .37); assert.equal(sample.rightTrigger, .83);
  f.driver.setPaused(true); assert.equal(f.inputs.at(-1).actualSample, false);
  assert.equal(f.inputs.at(-1).rightTrigger, 0);
  f.pad.buttons[9].pressed = true; f.tick(2); assert.equal(f.actions.at(-1), 'pause');
  await f.driver.destroy();
});

test('uplink resists through full pressure and expires without terrain leakage', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink'); f.driver.setTerrain({ moving: true, roughness: 1 });
  await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  f.driver.setUplink({ active: true, progress: 0 }); await settle();
  assert.deepEqual(device.reports.at(-1).data.slice(10, 13), [0x21, 0xff, 3]);
  f.driver.setUplink({ active: true, progress: .75 }); await settle();
  assert.deepEqual(device.reports.at(-1).data.slice(21, 24), [0x21, 0xff, 3]);
  f.driver.setUplink({ active: true, progress: 1 }); await settle();
  assert.equal(device.reports.at(-1).data[10], 0x21); // full pressure before charge still resists
  f.driver.setUplink({ active: true, progress: .5 }); f.tick(400); await settle();
  assert.equal(device.reports.at(-1).data[21], 5); assert.equal(f.pulses.length, 0);
  assert.equal(f.driver.feedback('terrain'), false); assert.equal(f.driver.feedback('blocked'), false);
  for (const [index, kind] of ['tension', 'lock', 'charged', 'transmit', 'received'].entries()) {
    f.tick(800 + index * 400);
    assert.equal(f.driver.feedback(kind), true); await settle();
    const effect = f.pulses.at(-1)[1]; assert.ok(effect.duration <= 320 && effect.strongMagnitude <= .7 && effect.weakMagnitude <= .7);
  }
  await f.driver.destroy();
});

test('uplink interruption resets both actuators and never revives old pressure on return', async () => {
  for (const interruption of ['pause', 'blur', 'hidden', 'disable', 'mode', 'haptics', 'gamepad', 'hid']) {
    const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
    f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
    f.driver.setInputMode('uplink'); f.driver.setUplink({ active: true, progress: .04, leftTrigger: .04, rightTrigger: 0 }); await settle();
    assert.equal(device.reports.at(-1).data[21], 0x21, interruption);
    assert.equal(device.reports.at(-1).data[10], 5, interruption);
    if (interruption === 'pause') f.driver.setPaused(true);
    if (interruption === 'blur') f.win.dispatchEvent(new Event('blur'));
    if (interruption === 'hidden') { f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); }
    if (interruption === 'disable') f.driver.setEnabled(false);
    if (interruption === 'mode') f.driver.setInputMode('menu');
    if (interruption === 'haptics') f.driver.setHaptics(false);
    if (interruption === 'gamepad') { f.pads([]); f.tick(1); }
    if (interruption === 'hid') await f.driver.disconnectAdaptiveTriggers();
    await settle();
    assert.equal(device.reports.at(-1).data[10], 5, interruption);
    assert.equal(device.reports.at(-1).data[21], 5, interruption);
    // Calls received while inactive cannot preload resistance for later reentry.
    f.driver.setUplink({ active: true, progress: .8 });
    f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange'));
    f.win.dispatchEvent(new Event('focus')); f.driver.setEnabled(true); f.driver.setPaused(false);
    f.driver.setHaptics(true); f.driver.setInputMode('uplink'); f.pads([f.pad]); f.tick(2);
    if (interruption === 'hid') await f.driver.connectAdaptiveTriggers();
    await settle(); assert.equal(device.reports.at(-1).data[10], 5, interruption);
    await f.driver.destroy();
  }
});


test('charged resistance holds only with fresh telemetry and release neutralizes it', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink');
  for (let time = 0; time <= 2000; time += 200) {
    f.tick(time); f.driver.setUplink({ active: true, progress: 1, charged: true }); await settle();
    assert.equal(device.reports.at(-1).data[10], time === 0 ? 0x26 : 0x21);
  }
  assert.equal(f.pulses.length, 0); // charged rest has no repeating buzz
  f.tick(2400); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  f.driver.setUplink({ active: true, progress: 1, charged: true }); await settle();
  f.driver.setUplink({ active: false, progress: 1, charged: true }); await settle();
  assert.equal(device.reports.at(-1).data[21], 5);
  await f.driver.destroy();
});

test('charge pulses are finite, fresh, paced and priority cues preempt without old promise races', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.driver.setInputMode('uplink');
  const completions = [];
  f.pad.vibrationActuator.playEffect = (...args) => { f.pulses.push(args); return new Promise(resolve => completions.push(resolve)); };
  f.driver.setUplink({ active: true, progress: .1, leftTrigger: 0, rightTrigger: .03 }); f.tick(10); assert.equal(f.pulses.length, 0);
  f.driver.setUplink({ active: true, progress: .5 }); f.tick(20);
  assert.equal(f.pulses.length, 1); assert.equal(f.pulses[0][1].duration, 100);
  f.tick(180); assert.equal(f.pulses.length, 1); // unresolved call cannot queue charge pulses
  assert.equal(f.driver.feedback('lock'), true); assert.equal(f.pulses.length, 2);
  completions[0](); await settle(); f.tick(300);
  assert.equal(f.driver.feedback('charge'), false); // old completion cannot unlock new effect
  completions[1](); await settle(); f.tick(301); assert.equal(f.pulses.length, 3);
  f.driver.setUplink({ active: true, progress: 1, charged: true });
  assert.equal(f.driver.feedback('charged'), true);
  completions[2](); await settle(); f.tick(460); assert.equal(f.pulses.length, 4);
  f.driver.setUplink({ active: false });
  assert.equal(f.driver.feedback('transmit'), true);
  completions[3](); await settle(); assert.equal(f.driver.feedback('charge'), false);
  f.driver.setPaused(true); completions[4](); await settle();
  f.driver.setPaused(false); assert.equal(f.driver.feedback('received'), true);
  f.tick(1000); assert.equal(f.pulses.length, 6);
  await f.driver.destroy();
});


test('HID disconnect cancels squeeze input before pending output and close settle', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink'); f.pad.buttons[6].value = f.pad.buttons[7].value = 1;
  f.tick(1); assert.equal(f.inputs.at(-1).actualSample, true); await settle();
  let releaseWrite, releaseClose;
  device.sendReport = async function(id, data) {
    this.reports.push({ id, data: Array.from(data) });
    await new Promise(resolve => { releaseWrite = resolve; });
  };
  device.close = async function() { await new Promise(resolve => { releaseClose = resolve; }); this.opened = false; };
  f.driver.setUplink({ active: true, progress: 1, charged: true });
  const count = f.inputs.length;
  const disconnecting = f.driver.disconnectAdaptiveTriggers();
  assert.equal(f.inputs.length, count + 1);
  assert.equal(f.inputs.at(-1).actualSample, false);
  assert.equal(f.inputs.at(-1).leftTrigger, 0); assert.equal(f.inputs.at(-1).rightTrigger, 0);
  assert.equal(device.opened, true); assert.equal(releaseClose, undefined);
  releaseWrite(); await settle(); // serialized final off report
  assert.equal(device.reports.at(-1).data[10], 5);
  releaseWrite(); await settle(); assert.equal(device.opened, true);
  releaseClose(); await disconnecting;
  await f.driver.destroy();
});


test('sending resists immediately, briefly vibrates when charged, then restores maximum resistance', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink'); f.driver.setUplink({ active: true, progress: 0, charge: 0 }); await settle();
  const block = () => device.reports.at(-1).data.slice(10, 21);
  assert.deepEqual(block(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: true, progress: .8, charge: .35 }); await settle();
  assert.deepEqual(block(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true }); await settle();
  assert.deepEqual(block(), [0x26, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 75, 0]);
  assert.deepEqual(device.reports.at(-1).data.slice(21, 32), block());
  f.tick(179); await settle(); assert.equal(block()[0], 0x26);
  f.tick(180); await settle(); assert.deepEqual(block(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true });
  f.tick(181); await settle(); assert.equal(block()[0], 0x21); // refresh does not restart burst
  f.driver.setUplink({ active: false }); await settle(); assert.equal(block()[0], 5);
  const report = device.reports.at(-2); assert.equal(report.id, 2); assert.equal(report.data.length, 47); assert.equal(report.data[0], 12);
  await f.driver.destroy();
});

test('ordinary charge rumble crescendos with hold charge and ends with a distinct finite cue', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.driver.setInputMode('uplink');
  f.driver.setUplink({ active: true, progress: .04, charge: 0, leftTrigger: .04, rightTrigger: 0 }); f.tick(1); await settle();
  const early = f.pulses.at(-1)[1];
  f.driver.setUplink({ active: true, progress: .98, charge: .95 }); f.tick(161); await settle();
  const late = f.pulses.at(-1)[1];
  assert.ok(late.strongMagnitude > early.strongMagnitude); assert.ok(late.weakMagnitude > early.weakMagnitude);
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true });
  assert.equal(f.driver.feedback('charged'), true); const finish = f.pulses.at(-1)[1];
  assert.deepEqual(finish, { startDelay: 0, duration: 180, strongMagnitude: .7, weakMagnitude: .7 });
  f.tick(400); const count = f.pulses.length; f.tick(500); assert.equal(f.pulses.length, count);
  await f.driver.destroy();
});


test('late-story effort changes the confirmation frequency without reducing maximum resistance', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink');
  const block = () => device.reports.at(-1).data.slice(10, 21);
  f.driver.setUplink({ active: true, progress: 0, effort: 1 }); await settle();
  assert.deepEqual(block(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true, effort: 1 }); await settle();
  assert.deepEqual(block(), [0x26, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 85, 0]);
  assert.equal(f.driver.feedback('charged'), true); assert.equal(f.pulses.at(-1)[1].strongMagnitude, .85);
  f.tick(180); await settle();
  assert.deepEqual(block(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: false }); await settle();
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true, effort: 0 }); await settle();
  assert.deepEqual(block(), [0x26, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 75, 0]);
  f.driver.setUplink({ active: false }); f.driver.setUplink({ active: true, progress: 0, effort: 99 }); await settle();
  assert.equal(block()[5], 0xff); // external effort is clamped
  await f.driver.destroy();
});


test('zone-zero maximum resistance engages each trigger independently at the first pressure sample', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink');
  const right = () => device.reports.at(-1).data.slice(10, 21);
  const left = () => device.reports.at(-1).data.slice(21, 32);
  const off = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const early = [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0];
  f.driver.setUplink({ active: true, progress: 0, charge: 0, leftTrigger: .03, rightTrigger: 0 }); await settle();
  assert.deepEqual(left(), off); assert.deepEqual(right(), off);
  f.driver.setUplink({ active: true, progress: 0, charge: 0, leftTrigger: .04, rightTrigger: 0 }); await settle();
  assert.deepEqual(left(), early); assert.deepEqual(right(), off);
  f.tick(1); await settle();
  assert.deepEqual(f.pulses.at(-1)[1], { startDelay: 0, duration: 100, strongMagnitude: .514, weakMagnitude: .514 });
  f.driver.setUplink({ active: true, progress: 0, leftTrigger: 0, rightTrigger: .04 }); await settle();
  assert.deepEqual(left(), off); assert.deepEqual(right(), early);
  f.driver.setUplink({ active: true, progress: 0, leftTrigger: .04, rightTrigger: .04, effort: 1 }); await settle();
  const lateEarly = early;
  assert.deepEqual(left(), lateEarly); assert.deepEqual(right(), lateEarly);
  f.driver.setUplink({ active: true, progress: 1, charge: 1, charged: true, leftTrigger: 1, rightTrigger: 1, effort: 1 }); await settle();
  assert.deepEqual(left(), [0x26, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 85, 0]);
  f.driver.setUplink({ active: true, progress: 1, charged: true, leftTrigger: 0, rightTrigger: 1, effort: 1 }); await settle();
  assert.deepEqual(left(), off); assert.equal(right()[0], 0x26);
  f.tick(181); await settle();
  assert.deepEqual(left(), off); assert.deepEqual(right(), [0x21, 0xff, 3, 0xff, 0xff, 0xff, 0x3f, 0, 0, 0, 0]);
  f.driver.setUplink({ active: true, charged: true, leftTrigger: 0, rightTrigger: 0 }); await settle();
  assert.deepEqual(left(), off); assert.deepEqual(right(), off);
  const count = f.pulses.length; f.tick(500); assert.equal(f.pulses.length, count);
  await f.driver.destroy();
});

test('ordinary build begins before hold charge and remains bounded at extreme inputs', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick(); f.driver.setInputMode('uplink');
  f.driver.setUplink({ active: true, progress: 0, charge: 0, leftTrigger: 0, rightTrigger: .04, effort: 1 });
  f.tick(1); await settle(); const early = f.pulses.at(-1)[1];
  assert.ok(early.strongMagnitude > .5); assert.equal(early.duration, 100);
  f.driver.setUplink({ active: true, progress: 1, charge: 99, leftTrigger: 99, rightTrigger: 99, effort: 99 });
  f.tick(161); await settle(); const full = f.pulses.at(-1)[1];
  assert.ok(full.strongMagnitude <= .9 && full.strongMagnitude >= .899); assert.ok(full.weakMagnitude <= .9 && full.weakMagnitude >= .899);
  f.driver.setUplink({ active: false }); const count = f.pulses.length;
  f.tick(321); assert.equal(f.pulses.length, count);
  await f.driver.destroy();
});

test('maximum resistance persists from light press through charge and held confirmation', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('uplink');
  const levels = block => {
    const packed = (block[3] | block[4] << 8 | block[5] << 16 | block[6] << 24) >>> 0;
    return Array.from({ length: 10 }, (_, i) => ((packed >>> (i * 3)) & 7) + 1);
  };
  for (const pressure of [.04, .3, 1]) for (const effort of [0, 1, 99]) {
    f.driver.setUplink({ active: true, leftTrigger: pressure, rightTrigger: pressure, effort }); await settle();
    const data = device.reports.at(-1).data;
    for (const offset of [10, 21]) {
      const block = data.slice(offset, offset + 11);
      assert.equal(block[0], 0x21); assert.equal(block[1] | block[2] << 8, 1023);
      assert.deepEqual(levels(block), Array(10).fill(8));
      assert.equal(block[9], 0);
      assert.deepEqual([block[7], block[8], block[10]], [0, 0, 0]);
    }
  }
  f.driver.setUplink({ active: true, charged: true, leftTrigger: .04, rightTrigger: .04 }); await settle();
  f.tick(180); await settle();
  for (const offset of [10, 21]) {
    const block = device.reports.at(-1).data.slice(offset, offset + 11);
    assert.equal(block[0], 0x21); assert.deepEqual(levels(block), Array(10).fill(8));
  }
  f.tick(400); await settle();
  assert.equal(device.reports.at(-1).data[10], 5); assert.equal(device.reports.at(-1).data[21], 5);
  await f.driver.destroy();
});


test('uplink right stick scrolls reading text without moving the rover or mast', async () => {
  const f=fixture();f.pads([f.pad]);f.tick();f.driver.setInputMode('uplink');
  f.pad.axes=[1,-1,.8,1];f.tick(50);
  assertNeutral(f.inputs.at(-1));assert.ok(f.scrolls.at(-1)>0);
  f.pad.axes[3]=-1;f.tick(100);assert.ok(f.scrolls.at(-1)<0);
  const count=f.scrolls.length;f.driver.setPaused(true);f.tick(150);
  assert.equal(f.scrolls.length,count);await f.driver.destroy();
});


test('Triangle has no gameplay action while Square, Cross and Circle remain mapped', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  for (const [index, action] of [[3, null], [2, 'journal'], [0, 'primary'], [1, 'back']]) {
    const count = f.actions.length;
    f.pad.buttons[index].pressed = true; f.tick(); f.tick();
    assert.equal(f.actions.length, count + (action ? 1 : 0));
    if (action) assert.equal(f.actions.at(-1), action);
    f.pad.buttons[index].pressed = false; f.tick();
  }
  await f.driver.destroy();
});

test('modal context rearm requires fresh face and directional button presses', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.driver.setInputMode('menu'); f.driver.setPaused(true);
  // A context change can happen between polls, with other buttons already held.
  f.pad.buttons[0].pressed = true; f.pad.buttons[1].pressed = true; f.pad.buttons[13].pressed = true;
  f.driver.rearmMenu(); f.tick(50); f.tick(100);
  assert.deepEqual(f.actions, []); assertNeutral(f.inputs.at(-1));
  for (const index of [0, 1, 13]) f.pad.buttons[index].pressed = false;
  f.tick(150);
  f.pad.buttons[0].pressed = true; f.tick(200);
  assert.deepEqual(f.actions, ['primary']);
  f.pad.buttons[1].pressed = true; f.tick(250);
  assert.deepEqual(f.actions, ['primary', 'back']);
  await f.driver.destroy();
});


test('opening a modal inside an action callback consumes other held buttons in that sample', async () => {
  let f;
  f = fixture(action => {
    if (action === 'journal') {
      f.driver.setPaused(true); f.driver.setInputMode('menu'); f.driver.rearmMenu();
    }
  });
  f.pads([f.pad]); f.tick();
  f.pad.buttons[2].pressed = true; f.pad.buttons[9].pressed = true; f.pad.buttons[13].pressed = true;
  f.tick(50);
  assert.deepEqual(f.actions, ['journal']);
  f.tick(100); assert.deepEqual(f.actions, ['journal']);
  f.pad.buttons[9].pressed = false; f.pad.buttons[13].pressed = false; f.tick(150);
  f.pad.buttons[13].pressed = true; f.tick(200);
  assert.deepEqual(f.actions, ['journal', 'navDown']);
  await f.driver.destroy();
});

test('trace contacts push only R2 briefly, consume sequence once, and reject stale or synthetic pressure', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('inspect');
  const update = extra => f.driver.setToolFeedback({ active: true, mode: 'trace', pulse: 0, motion: .5, pressure: .8, ...extra });
  const right = () => device.reports.at(-1).data[10];
  update({ pulse: 0 }); await settle(); assert.equal(right(), 5);
  f.pad.buttons[7].value = .8;
  update({ pulse: 1 }); await settle();
  assert.deepEqual(device.reports.at(-1).data.slice(10, 17), [0x21, 255, 3, 255, 255, 255, 63]);
  assert.equal(device.reports.at(-1).data[21], 5); assert.equal(f.pulses.length, 0);
  f.tick(48); update({ pulse: 1 }); await settle(); assert.equal(right(), 5);
  update({ pulse: 2 }); await settle(); assert.equal(right(), 0x21);
  f.tick(228); await settle(); assert.equal(right(), 5);
  update({ pulse: 2 }); await settle(); assert.equal(right(), 5);
  f.pad.buttons[7].value = 0; update({ pulse: 3 }); await settle(); assert.equal(right(), 5);
  f.pad.buttons[7].value = 1; update({ pulse: 3 }); await settle(); assert.equal(right(), 5);
  update({ pulse: 4 }); await settle(); assert.equal(right(), 0x21);
  await f.driver.destroy();
});

test('brush texture changes bounded grains only while moving, fresh and physically held', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('inspect'); f.pad.buttons[7].value = 1;
  const update = extra => f.driver.setToolFeedback({ active: true, mode: 'brush', motion: 1, pressure: 1, roughness: 1, ...extra });
  update(); const packets = [];
  for (const time of [1, 55, 110, 165]) {
    f.tick(time); update(); await settle(); const data = device.reports.at(-1).data;
    packets.push(data.slice(10, 21).join(',')); assert.ok([0x21, 0x26].includes(data[10]));
    assert.equal(data[21], 5); assert.equal(data[11] | data[12] << 8, 1023);
    if (data[10] === 0x26) assert.ok(data[19] >= 28 && data[19] <= 76);
  }
  assert.ok(new Set(packets).size >= 3);
  update({ motion: 0 }); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(); f.tick(345); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(); f.pad.buttons[7].value = 0; f.tick(346); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  await f.driver.destroy();
});

test('tool cleanup withdraws R2 on every interruption and consumes contacts while inactive', async () => {
  for (const interruption of ['pause', 'blur', 'hidden', 'disable', 'menu', 'haptics', 'gamepad', 'hid']) {
    const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
    f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
    f.driver.setInputMode('inspect'); f.pad.buttons[7].value = 1;
    const update = pulse => f.driver.setToolFeedback({ active: true, mode: 'trace', pulse, motion: 1, pressure: 1 });
    update(1); await settle(); assert.equal(device.reports.at(-1).data[10], 0x21, interruption);
    if (interruption === 'pause') f.driver.setPaused(true);
    if (interruption === 'blur') f.win.dispatchEvent(new Event('blur'));
    if (interruption === 'hidden') { f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); }
    if (interruption === 'disable') f.driver.setEnabled(false);
    if (interruption === 'menu') f.driver.setInputMode('menu');
    if (interruption === 'haptics') f.driver.setHaptics(false);
    if (interruption === 'gamepad') { f.pads([]); f.tick(1); }
    if (interruption === 'hid') await f.driver.disconnectAdaptiveTriggers();
    await settle(); assert.equal(device.reports.at(-1).data[10], 5, interruption);
    f.driver.setPaused(false); f.doc.hidden = false; f.win.dispatchEvent(new Event('focus'));
    f.driver.setEnabled(true); f.driver.setHaptics(true); f.driver.setInputMode('inspect'); f.pads([f.pad]); f.tick(2);
    if (interruption === 'hid') await f.driver.connectAdaptiveTriggers();
    update(1); await settle(); assert.equal(device.reports.at(-1).data[10], 5, interruption);
    await f.driver.destroy();
  }
});

test('standard gamepad tool fallback is granular and stops without replaying old contact sequences', async () => {
  const f = fixture(); f.pad.id = 'Xbox'; f.pads([f.pad]); f.tick(); f.driver.setInputMode('inspect'); f.pad.buttons[7].value = 1;
  const update = extra => f.driver.setToolFeedback({ active: true, mode: 'trace', pulse: 20, motion: 1, pressure: 1, ...extra });
  update(); assert.equal(f.pulses.length, 0); // attaching to an old contact cannot replay twenty dots
  update({ pulse: 21 }); assert.equal(f.pulses.length, 1); assert.equal(f.pulses[0][1].duration, 35);
  update({ pulse: 21 }); assert.equal(f.pulses.length, 1);
  update({ mode: 'brush' }); f.tick(1); assert.equal(f.pulses.at(-1)[1].duration, 26);
  const count = f.pulses.length, resets = f.resets;
  update({ mode: 'brush', motion: 0 }); assert.ok(f.resets > resets);
  f.tick(60); assert.equal(f.pulses.length, count);
  update({ mode: 'brush' }); f.tick(61); const moving = f.pulses.length;
  f.pad.buttons[7].value = 0; f.tick(62); f.tick(120); assert.equal(f.pulses.length, moving);
  await f.driver.destroy();
});

test('rapid trace contacts cannot extend an attack or queue a delayed bump', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('inspect'); f.pad.buttons[7].value = 1;
  const update = pulse => f.driver.setToolFeedback({ active: true, mode: 'trace', pulse, motion: 1, pressure: 1 });
  update(0);
  const modes = [];
  for (let time = 0; time <= 160; time += 8) {
    f.tick(time); update(time / 8 + 1); await settle(); modes.push(device.reports.at(-1).data[10]);
  }
  assert.ok(modes.includes(5)); assert.ok(modes.includes(0x21));
  let consecutive = 0;
  for (const mode of modes) { consecutive = mode === 0x21 ? consecutive + 1 : 0; assert.ok(consecutive <= 3); }
  f.tick(200); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  f.tick(220); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  await f.driver.destroy();
});

test('a restarted tool sequence establishes a quiet baseline then emits its first new contact', async () => {
  const f = fixture(), device = usb(); f.pads([f.pad]); f.tick();
  f.hid.requestDevice = async () => [device]; await f.driver.connectAdaptiveTriggers();
  f.driver.setInputMode('inspect'); f.pad.buttons[7].value = 1;
  const update = (pulse, active = true) => f.driver.setToolFeedback({ active, mode: 'trace', pulse, motion: 1, pressure: 1 });
  update(70); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(71); await settle(); assert.equal(device.reports.at(-1).data[10], 0x21);
  f.driver.setPaused(true); update(71); f.driver.setPaused(false);
  update(71); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(0, false); update(0); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(1); await settle(); assert.equal(device.reports.at(-1).data[10], 0x21);
  f.tick(40); update(0); await settle(); assert.equal(device.reports.at(-1).data[10], 5);
  update(1); await settle(); assert.equal(device.reports.at(-1).data[10], 0x21);
  await f.driver.destroy();
});


test('connected idle pads and stick drift do not report intentional activity', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.pad.axes = [.12, -.18, .2, -.22]; f.tick(16); f.tick(32);
  f.pad.buttons[6].value = .04; f.pad.buttons[7].value = .1; f.tick(48);
  assert.deepEqual(f.activities, []);
  assert.equal(f.statuses.at(-1).connected, true);
  await f.driver.destroy();
});

test('new buttons, trigger pressure and deliberate stick movement report activity once per intent', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.pad.buttons[0].pressed = true; f.tick(10); f.tick(20);
  assert.deepEqual(f.activities, [10]);
  f.pad.buttons[0].pressed = false; f.tick(30);
  f.pad.buttons[0].pressed = true; f.tick(40);
  f.pad.buttons[7].value = .15; f.tick(50); f.tick(60);
  f.pad.buttons[7].value = .16; f.tick(70);
  assert.deepEqual(f.activities, [10, 40, 50]);
  f.pad.buttons[7].value = .3; f.tick(80);
  f.pad.axes[2] = .5; f.tick(90); f.tick(100);
  f.pad.axes[2] = .52; f.tick(110);
  assert.deepEqual(f.activities, [10, 40, 50, 80, 90]);
  f.pad.axes[2] = .7; f.tick(120);
  f.pad.axes[2] = 0; f.tick(130);
  f.pad.axes[2] = .5; f.tick(140);
  assert.deepEqual(f.activities, [10, 40, 50, 80, 90, 120, 140]);
  await f.driver.destroy();
});

test('held controls cannot repeatedly steal prompts back after keyboard or pointer use', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  let activeDevice = 'keyboard';
  // Represent the consumer changing input in response to the activity callback.
  f.pad.axes[0] = .8; f.pad.buttons[7].value = 1; f.pad.buttons[1].pressed = true;
  f.tick(16); if (f.activities.at(-1) === 16) activeDevice = 'controller';
  assert.equal(activeDevice, 'controller');
  activeDevice = 'mouse';
  for (const time of [32, 48, 64, 1000]) { f.tick(time); if (f.activities.at(-1) === time) activeDevice = 'controller'; }
  assert.equal(activeDevice, 'mouse'); assert.equal(f.activities.length, 1);
  f.pad.buttons[1].pressed = false; f.tick(1016);
  f.pad.buttons[1].pressed = true; f.tick(1032);
  assert.deepEqual(f.activities, [16, 1032]);
  await f.driver.destroy();
});

test('menu activity works while paused and hidden, disabled or blurred inputs are consumed quietly', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.driver.setPaused(true); f.driver.setInputMode('menu');
  f.pad.buttons[13].pressed = true; f.tick(16);
  assert.deepEqual(f.activities, [16]); assert.equal(f.actions.at(-1), 'navDown');
  f.win.dispatchEvent(new Event('blur'));
  f.pad.buttons[0].pressed = true; f.tick(32);
  f.win.dispatchEvent(new Event('focus')); f.tick(48);
  assert.deepEqual(f.activities, [16]);
  f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange'));
  f.pad.axes[0] = .8; f.tick(64);
  f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange')); f.tick(80);
  assert.deepEqual(f.activities, [16]);
  f.driver.setEnabled(false); f.pad.buttons[7].value = .9; f.tick(96);
  f.driver.setEnabled(true); f.tick(112);
  assert.deepEqual(f.activities, [16]);
  f.pad.buttons[7].value = 0; f.tick(128);
  f.pad.buttons[7].value = .15; f.tick(144);
  assert.deepEqual(f.activities, [16, 144]);
  await f.driver.destroy();
});

test('controller activity precedes action dispatch and new hardware does not reuse old stick state', async () => {
  let f;
  f = fixture(() => assert.equal(f.activities.at(-1), 16));
  f.pads([f.pad]); f.tick(); f.pad.buttons[0].pressed = true; f.tick(16);
  f.pad.axes[0] = .8; f.tick(32);
  f.pads([]); f.tick(48);
  f.pads([{ ...f.pad, id: 'Xbox', index: 1, buttons: [], axes: [.8, 0, 0, 0] }]); f.tick(64);
  assert.deepEqual(f.activities, [16, 32, 64]);
  await f.driver.destroy();
});


test('resting trigger noise stays quiet and a slow intentional press crosses the activity threshold', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  for (let i = 1; i <= 12; i++) { f.pad.buttons[7].value = i / 100; f.tick(i); }
  assert.deepEqual(f.activities, []);
  f.pad.buttons[7].value = .13; f.tick(13);
  assert.deepEqual(f.activities, [13]);
  for (let i = 14; i <= 20; i++) { f.pad.buttons[7].value = i / 100; f.tick(i); }
  assert.deepEqual(f.activities, [13]);
  f.pad.buttons[7].value = .3; f.tick(30);
  assert.deepEqual(f.activities, [13, 30]);
  f.pad.buttons[7].value = .02; f.tick(31);
  assert.deepEqual(f.activities, [13, 30]);
  f.pad.buttons[7].value = .13; f.tick(32);
  assert.deepEqual(f.activities, [13, 30, 32]);
  await f.driver.destroy();
});


test('focus consumes a held input from a fresh browser gamepad snapshot', async () => {
  const f = fixture(); f.pads([f.pad]); f.tick();
  f.win.dispatchEvent(new Event('blur'));
  // Background requestAnimationFrame may stop entirely; browsers may return
  // new snapshot objects rather than mutating the previous gamepad object.
  const next = { ...f.pad, axes: [.8, 0, 0, 0], buttons: f.pad.buttons.map(b => ({ ...b })) };
  next.buttons[7].value = 1; f.pads([next]);
  f.win.dispatchEvent(new Event('focus')); f.tick(1000);
  assert.deepEqual(f.activities, []);
  next.axes[0] = 0; next.buttons[7].value = 0; f.tick(1016);
  next.axes[0] = .8; f.tick(1032);
  assert.deepEqual(f.activities, [1032]);
  await f.driver.destroy();
});


test('right bumper shutter requires a fresh edge after connection and context rearm', () => {
  const f=fixture();
  f.pad.buttons[5].pressed=true; f.pads([f.pad]); f.tick(0); f.tick(16);
  assert.deepEqual(f.actions,[], 'preheld bumper cannot take a photograph on connection');
  f.pad.buttons[5].pressed=false; f.tick(32);
  f.pad.buttons[5].pressed=true; f.tick(48); f.tick(64);
  assert.deepEqual(f.actions,['shutter'], 'holding creates one shutter action');
  f.driver.rearmMenu(); f.tick(80);
  assert.deepEqual(f.actions,['shutter'], 'rearming never replays a held bumper');
  f.pad.buttons[5].pressed=false; f.tick(96);
  f.pad.buttons[5].pressed=true; f.tick(112);
  assert.deepEqual(f.actions,['shutter','shutter']);
  f.pad.buttons[5].pressed=false; f.tick(128);
  f.pad.buttons[0].pressed=true; f.tick(144);
  assert.equal(f.actions.at(-1),'primary', 'face interaction remains a separate action');
  f.driver.destroy();
});

test('context rearm consumes a simultaneously held bumper during another action', () => {
  let f;
  f=fixture(action=>{if(action==='primary')f.driver.rearmMenu();});
  f.pads([f.pad]); f.tick(0);
  f.pad.buttons[0].pressed=true; f.pad.buttons[5].pressed=true; f.tick(16);
  assert.deepEqual(f.actions,['primary'], 'Compare or menu transition cannot also fire its preheld shutter');
  f.pad.buttons[0].pressed=false; f.pad.buttons[5].pressed=false; f.tick(32);
  f.pad.buttons[5].pressed=true; f.tick(48);
  assert.deepEqual(f.actions,['primary','shutter']);
  f.driver.destroy();
});
