import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { APP_URL, deviceAllowed, isLocal, resourcePath, safeExternal, supportedDevice } from '../policy.js';
const device = () => ({ vendorId: 0x054c, productId: 0x0ce6, deviceId: 'exact-usb-interface',
  collections: [{ usagePage: 1, usage: 5, inputReports: [{ items: [{ reportSize: 8, reportCount: 63 }] }] }] });
test('only exact local scheme authority has access', () => {
  assert.equal(isLocal(APP_URL), true);
  for (const url of ['https://game/index.html', 'last-light://game.evil/', 'last-light://other/',
    'last-light://user@game/', 'last-light://game:80/', 'file:///game/index.html', 'invalid']) {
    assert.equal(isLocal(url), false, url);
  }
});
test('bundle paths contain decoded Windows and POSIX traversal', () => {
  const root = path.resolve('desktop/stage/game');
  assert.equal(resourcePath(root, APP_URL), path.join(root, 'index.html'));
  assert.equal(resourcePath(root, 'last-light://game/public/models/opportunity.glb'), path.join(root, 'public/models/opportunity.glb'));
  for (const url of ['last-light://game/%2e%2e%2fsecret', 'last-light://game/%2e%2e%5csecret',
    'last-light://game/C:%5csecret', 'last-light://game/%00', 'last-light://game/%zz', 'https://game/index.html']) {
    assert.equal(resourcePath(root, url), null, url);
  }
});
test('HID permission requires supported descriptor, selected identity and local origin', () => {
  const original = device(), approved = new Set([original.deviceId]);
  const request = { deviceType: 'hid', origin: 'last-light://game', device: original };
  assert.equal(supportedDevice(original), true);
  assert.equal(deviceAllowed(request, new Set()), false);
  assert.equal(deviceAllowed(request, approved), true);
  for (const change of [{ deviceType: 'usb' }, { origin: 'https://example.com' },
    { device: { ...original, deviceId: 'another-interface' } },
    { device: { ...original, productId: 0x0df2 } }, { device: { ...original, vendorId: 1 } },
    { device: { ...original, collections: [] } }]) {
    assert.equal(deviceAllowed({ ...request, ...change }, approved), false);
  }
  const bluetooth = device(); bluetooth.collections[0].inputReports[0].items[0].reportCount = 77;
  assert.equal(supportedDevice(bluetooth), false);
});
test('external browser only accepts plain HTTPS destinations', () => {
  assert.equal(safeExternal('https://science.nasa.gov/mission/mer-opportunity/'), true);
  for (const url of ['http://example.com', 'javascript:alert(1)', 'file:///secret', 'https://user:password@example.com', 'ms-settings:']) {
    assert.equal(safeExternal(url), false);
  }
});
