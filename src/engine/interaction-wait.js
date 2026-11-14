/** One pending UI wait; cancellation also invalidates already queued callbacks. */
export function createInteractionWait({ setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0;
  let current = null;

  function cancel() {
    generation++;
    const previous = current;
    current = null;
    if (previous) {
      previous.callback = null;
      clearTimer(previous.timer);
    }
  }

  function start(delayMs, onComplete) {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new RangeError('Wait delay must be finite and nonnegative.');
    }
    if (typeof onComplete !== 'function') {
      throw new TypeError('Wait completion must be a function.');
    }
    cancel();
    const token = { generation, callback: onComplete, timer: null };
    current = token;
    token.timer = setTimer(() => {
      if (current !== token || token.generation !== generation) return;
      const callback = token.callback;
      token.callback = null;
      current = null;
      callback();
    }, delayMs);
  }

  return { start, cancel, get pending() { return current !== null; } };
}
