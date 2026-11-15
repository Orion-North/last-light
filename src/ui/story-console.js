const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** One stable reading position; the full accessible line never types letter by letter. */
export function renderStoryConsole({ line, time = '' }) {
  return `<section class="story-console" data-speaker="${escape(line.speaker)}" aria-label="${line.text?'Opportunity’s imagined thought':'Mission time'}">
    <div class="story-console__meta"><span class="story-console__mark" aria-hidden="true">&gt;_</span><span class="story-console__time">${escape(time)}</span></div>
    ${line.text ? `<p class="story-console__line"><span class="sr-only">${escape(line.text)}</span><span class="story-console__reserve" aria-hidden="true">${escape(line.text)}</span><span class="story-console__typed" aria-hidden="true">${escape(line.text)}</span></p>` : ''}
  </section>`;
}

/** Rebinding a rerendered line preserves progress; controls never wait on the reveal. */
export function createStoryWriter({ requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame,
  paused = () => false, pulse = () => {} } = {}) {
  let frame = 0, target = null, key = null, text = '', speaker = 'record';
  let elapsed = 0, previous = null, lastPulse = 0, pulses = 0, duration = 0, started = false;
  function paint() {
    if (!target) return;
    const count = Math.min(text.length, Math.ceil(text.length * elapsed / duration));
    target.textContent = text.slice(0, count);
    target.closest('.story-console')?.classList.toggle('is-writing', count < text.length);
  }
  function tick(now) {
    frame = 0;
    if (!target?.isConnected) return;
    const delta = previous === null ? 0 : Math.max(0, Math.min(now - previous, 80));
    previous = now;
    if (!paused()) {
      elapsed = Math.min(duration, elapsed + delta);
      if (!started) { started = true; pulse({speaker, first:true}); }
      else if (elapsed - lastPulse >= 135 && elapsed < duration && pulses < 16) {
        lastPulse = elapsed; pulses++; pulse({speaker, first:false});
      }
      paint();
    }
    if (elapsed < duration) frame = requestFrame(tick);
  }
  return {
    mount(element, line, nextKey) {
      if (frame) cancelFrame(frame);
      frame = 0; target = element?.querySelector('.story-console__typed') || null;
      if (!target || !line.text) return;
      if (key !== nextKey) {
        key = nextKey; text = line.text; speaker = line.speaker;
        elapsed = 0; lastPulse = 0; pulses = 0; started = false;
        duration = Math.min(2800, Math.max(700, text.length * 19));
      }
      previous = null; paint();
      if (elapsed < duration) frame = requestFrame(tick);
    },
    stop() {
      if (frame) cancelFrame(frame);
      frame = 0; target = null; previous = null; key = null;
    },
  };
}
