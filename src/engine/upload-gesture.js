const result = (progress = 0, commit = false) => ({ progress, commit });
const coordinate = value => Number.isFinite(value) && value >= -1 && value <= 1;

/** Track one deliberate upward contact; only a real release can commit it. */
export function createUploadGesture({ maxDurationMs = 1800 } = {}) {
  let contact = null;
  let blocked = false;

  function reset() {
    blocked = blocked || contact !== null;
    contact = null;
  }

  function sample(point = {}, nowMs) {
    const { x, y, active, cancelled = false, id } = point || {};
    if (cancelled) {
      contact = null;
      blocked = Boolean(active);
      return result();
    }
    if (!active) {
      const previous = contact;
      contact = null;
      const wasBlocked = blocked;
      blocked = false;
      if (!previous || wasBlocked || id !== previous.id || !Number.isFinite(nowMs)
        || nowMs < previous.lastAt || nowMs - previous.startedAt < 70
        || nowMs - previous.startedAt > maxDurationMs || !coordinate(x) || !coordinate(y)
        || Math.abs(x - previous.x) > .35) return result();
      return previous.y - y >= .55 - 1e-10 ? result(1, true) : result();
    }
    if (blocked) return result();
    if (!coordinate(x) || !coordinate(y) || !Number.isFinite(nowMs)) {
      contact = null; blocked = true;
      return result();
    }
    if (!contact) {
      contact = { id, x, y, startedAt: nowMs, lastAt: nowMs, progress: 0 };
      return result();
    }
    if (id !== contact.id || nowMs < contact.lastAt || nowMs - contact.startedAt > maxDurationMs
      || Math.abs(x - contact.x) > .35) {
      contact = null; blocked = true;
      return result();
    }
    contact.lastAt = nowMs;
    contact.progress = Math.max(0, Math.min(1, (contact.y - y) / .55));
    return result(contact.progress);
  }

  return { sample, reset };
}

/** Accessible stick alternative: neutral, then hold up; one commit per push. */
export function createStickUpload() {
  let armed = false;
  let elapsed = 0;
  function reset() { armed = false; elapsed = 0; }
  function sample(y, deltaSeconds) {
    if (!Number.isFinite(y)) { reset(); return result(); }
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(.05, deltaSeconds)) : 0;
    if (Math.abs(y) <= .3) { armed = true; elapsed = 0; return result(); }
    if (!armed) return result();
    if (y > -.6) { elapsed = 0; return result(); }
    elapsed = Math.min(.65, elapsed + delta);
    if (elapsed >= .65 - 1e-10) { reset(); return result(1, true); }
    return result(elapsed / .65);
  }
  return { sample, reset };
}
