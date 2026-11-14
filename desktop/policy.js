import path from 'node:path';

export const APP_ORIGIN = 'last-light://game';
export const APP_URL = `${APP_ORIGIN}/index.html`;

// Node's URL.origin is opaque for custom schemes; compare every authority field.
export function isLocal(url) {
  try {
    const value = new URL(url);
    return value.protocol === 'last-light:' && value.hostname === 'game' &&
      !value.port && !value.username && !value.password;
  } catch { return false; }
}

export function resourcePath(root, url) {
  if (!isLocal(url)) return null;
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.includes(':')) return null;
    const candidate = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(root, candidate);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? candidate : null;
  } catch { return null; }
}

export function supportedDevice(device) {
  return device?.vendorId === 0x054c && device?.productId === 0x0ce6 &&
    typeof device.deviceId === 'string' && device.deviceId.length > 0 &&
    device.collections?.some(collection => collection.usagePage === 1 && collection.usage === 5 &&
      Math.max(0, ...(collection.inputReports || []).map(report =>
        (report.items || []).reduce((bits, item) => bits + item.reportSize * item.reportCount, 0))) === 504);
}

export function safeExternal(url) {
  try {
    const value = new URL(url);
    return value.protocol === 'https:' && !value.username && !value.password && !!value.hostname;
  } catch { return false; }
}

export function deviceAllowed(details, approved) {
  return details.deviceType === 'hid' && isLocal(details.origin) &&
    supportedDevice(details.device) && approved.has(details.device.deviceId);
}
