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
  paused = () => false, reducedMotion = () => false, pulse = () => {} } = {}) {
  let frame = 0, target = null, key = null, characters = [], deadlines = [], speaker = 'record';
  let elapsed = 0, previous = null, lastPulse = -Infinity, count = 0, sounded = false;
  function paint() {
    if (!target) return;
    target.textContent = characters.slice(0, count).join('');
    target.closest('.story-console')?.classList.toggle('is-writing', count < characters.length);
  }
  function complete() { count=characters.length;elapsed=deadlines.at(-1) || 0;paint(); }
  function tick(now) {
    frame = 0;
    if (!target?.isConnected) return;
    const delta = previous === null ? 0 : Math.max(0, Math.min(now - previous, 80));
    previous = now;
    if (reducedMotion()) { complete();return; }
    if (!paused()) {
      elapsed += delta;
      const before=count;
      while(count<characters.length && elapsed>=deadlines[count])count++;
      if(count>before) {
        // One current key sound per frame, never a burst of overdue audio.
        const character=characters.slice(before,count).findLast(c=>!/\s/.test(c));
        if(character && elapsed-lastPulse>=65) {
          pulse({speaker,first:!sounded,character,index:count-1,punctuation:/[,.!?;:…]/.test(character)});
          sounded=true;lastPulse=elapsed;
        }
      }
      paint();
    }
    if (count < characters.length) frame = requestFrame(tick);
  }
  return {
    mount(element, line, nextKey) {
      if (frame) cancelFrame(frame);
      frame = 0; target = element?.querySelector('.story-console__typed') || null;
      if (!target || !line.text) return;
      if (key !== nextKey) {
        key = nextKey; characters = Array.from(line.text); speaker = line.speaker;
        elapsed = 0; lastPulse = -Infinity; count=0;sounded=false;
        let time=40;
        deadlines=characters.map((character,index)=>{
          const at=time;
          // A little irregularity reads as a thought arriving, not a progress bar.
          time+=/\s/.test(character)?22:30+(index%3)*4;
          if(/[,.!?;:…]/.test(character))time+=/[.!?…]/.test(character)?220:110;
          return at;
        });
        const scale=Math.min(1,4200/(deadlines.at(-1) || 1));
        deadlines=deadlines.map(at=>at*scale);
      }
      previous = null;
      if(reducedMotion())complete();else paint();
      if (count < characters.length) frame = requestFrame(tick);
    },
    stop() {
      if (frame) cancelFrame(frame);
      frame = 0; target = null; previous = null; key = null;
    },
  };
}
