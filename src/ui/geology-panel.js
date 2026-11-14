const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderGeologyPanel(state={},controller=false) {
  const stage=state.stage || 'brush', trace=state.mode==='trace' || stage==='trace';
  const samples=state.samples || [], targets=state.targets || [];
  const hint=(state.hint || (trace?'Hold R2 and follow each dotted layer path':'Hold R2 and sweep across the dusty patch')).replaceAll('R2',controller?'R2':'Space').replace('×',controller?'×':'Enter');
  const steps=trace?['Trace layers','Compare directions']:['Brush surface','Read two patches','Compare samples'];
  const active=stage==='compare'?steps.length-1:stage==='sample'?1:0;
  const progressLabel=trace?'Layers traced':'Brush progress';
  const readings=stage==='compare' || stage==='sample' || samples.length>0;
  return `<section class="geology-tool-panel" data-tool-stage="${stage}" data-tool-mode="${trace?'trace':'brush'}" aria-label="${trace?'Layer tracing':'Geology tools'}">
    <ol class="tool-sequence sr-only" aria-label="Investigation steps">${steps.map((text,i)=>`<li ${i===active?'aria-current="step"':''} data-complete="${i<active}"><b>${String(i+1).padStart(2,'0')}</b> ${text}</li>`).join('')}</ol>
    <p id="tool-hint" class="tool-instruction ${stage==='compare'?'sr-only':''}">${escape(hint)}</p>
    <div class="tool-readout">${['brush','trace'].includes(stage)?`<span id="tool-coverage" class="sr-only">${progressLabel} · ${Math.round((state.progress || 0)*100)}%</span><progress id="tool-progress" max="1" value="${state.progress || 0}" aria-label="${progressLabel}"></progress>`:stage==='sample'?'<progress id="tool-progress" max="1" value="0" aria-label="Sample reading"></progress>':''}</div>
    ${readings?`<div class="sample-comparison">${targets.map((target,i)=>{const sample=samples.find(s=>s.id===target.id);return `<article class="sample-reading" data-recorded="${!!sample}"><span>${String(i+1).padStart(2,'0')} · ${escape(target.label)}</span><strong>${sample?escape(sample.reading):trace?'Trace this layer':'Awaiting reading'}</strong><i aria-hidden="true">${sample?'●':'○'}</i></article>`;}).join('')}</div>`:''}
    <div class="tool-actions">${stage==='compare'?`<button class="primary-button" data-action="compare-samples">${trace?'Compare layer directions':'Compare readings'}</button>`:!controller?`<button class="secondary-button tool-operate" type="button" aria-label="Hold to operate tool">Hold to ${stage==='trace'?'trace':stage==='brush'?'brush':'measure'}</button>`:''}<button class="quiet-button tool-skip" data-action="assist-observation">Skip investigation</button></div>
    ${stage==='compare'?'<p class="tool-qualification sr-only">Simplified field comparison · not instrument telemetry</p>':''}
  </section>`;
}
