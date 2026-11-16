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
  let frame = 0, target = null, key = null, characters = [], deadlines = [], speaker = 'record', emotion = 'neutral', accentIndex = -1;
  let elapsed = 0, previous = null, lastPulse = -Infinity, count = 0, sounded = false, accented = false;
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
        // Articulate a thought, never its individual letters. A second cue is
        // tied to one authored-text clause, with no pause/resume audio backlog.
        const index = !sounded ? characters.findIndex(c=>!/\s/.test(c)) : accentIndex;
        if (index >= before && index < count && (!sounded || !accented && elapsed-lastPulse>=1200)) {
          const character=characters[index];
          pulse({speaker,emotion,first:!sounded,accent:sounded?'clause':'start',character,index,punctuation:/[,.!?;:…]/.test(character)});
          if(sounded)accented=true;
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
      emotion = line.emotion || 'neutral';
      if (key !== nextKey) {
        key = nextKey; characters = Array.from(line.text); speaker = line.speaker;
        elapsed = 0; lastPulse = -Infinity; count=0;sounded=false;accented=false;
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
        accentIndex=characters.findIndex((character,index)=>index>0 && !/\s/.test(character)
          && deadlines[index]-deadlines[0]>=1200
          && /[,.!?;:…]\s+$/.test(characters.slice(0,index).join('')));
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
