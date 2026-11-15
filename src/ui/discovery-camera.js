import { controllerGlyph } from './controller-prompts.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => /^(?:https?:|blob:|data:image\/|\.\.?\/|\/)/i.test(String(value || '')) ? escape(value) : '';

/** The caller owns capture, image loading, live status and progression. */
export function renderDiscoveryCamera({photo={},stage='aim',captureUrl='',ready=false,aligned=false,controller=false,family='playstation',imageState='loading',reducedMotion=false,error=''} = {}) {
  const aiming=stage==='aim' || stage==='capturing', received=stage==='received', unavailable=stage==='unavailable';
  const authentic=received && imageState==='ready' && !!safeUrl(photo.src);
  const glyph=controller?controllerGlyph('primary',family):'';
  const button=(action,label,disabled=false,primary=true)=>`<button class="${primary?'primary-button':'quiet-button'} discovery-camera__action" data-action="${action}"${disabled?' disabled':''}>${primary?glyph:''}<span>${label}</span></button>`;
  const visibleError=error || (unavailable?'Camera unavailable.':received && imageState==='error'?'NASA image unavailable.':'');
  const status=visibleError || (stage==='capturing'?'Recording picture.':stage==='sending'?'Sending to Earth.':received?(authentic?'Actual mission image received.':'Loading mission image. You can continue.') : stage==='captured'?'Picture ready to send.':ready?'Camera ready.':'Positioning camera.');
  const name=/berry|blueberr/i.test(photo.title || '')?'BERRY BOWL':/chance|layer/i.test(photo.title || '')?'LAST CHANCE':photo.title || '';
  return `<section class="discovery-camera" data-stage="${escape(stage)}" data-aligned="${aligned}" data-reduced-motion="${reducedMotion}" aria-label="${received?'Opportunity mission image':'Rover camera'}">
    <div class="discovery-camera__view${aiming?' discovery-camera__view--open':''}">
      ${captureUrl?`<img class="discovery-camera__capture" src="${safeUrl(captureUrl)}" alt="Reconstructed game view of ${escape(photo.title || 'Mars')}"${authentic?' aria-hidden="true"':''}>`:''}
      ${authentic?`<img class="discovery-camera__original" data-discovery-photo="true" src="${safeUrl(photo.src)}" alt="${escape(photo.alt || photo.title || 'Opportunity’s actual observation')}">`:''}
      <div class="discovery-camera__brackets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      ${aiming?`<span class="discovery-camera__target">${escape(name)}</span><span class="discovery-camera__crosshair" aria-hidden="true"></span><span id="discovery-camera-alignment" class="discovery-camera__alignment" aria-hidden="true"><i></i>${aligned?'FRAMED':'LIVE'}</span>`:''}
      ${stage==='capturing' || stage==='captured'?'<div class="discovery-camera__exposure" aria-hidden="true"></div>':''}
      ${stage==='captured' && controller?'<div class="discovery-camera__charge" aria-hidden="true"></div><span id="squeeze-hint" class="sr-only">Squeeze both triggers, then release to send.</span>':''}
      ${stage==='sending'?'<div class="discovery-camera__scan" aria-hidden="true"></div><span class="discovery-camera__downlink" aria-hidden="true">MARS <i></i> EARTH</span>':''}
    </div>
    <div class="discovery-camera__reading">
      ${authentic?`<div class="discovery-camera__credit"><span>Actual mission image</span><small>${escape(photo.credit || 'NASA · Opportunity')}</small>${/^https?:\/\//i.test(photo.sourceUrl || '')?`<a href="${escape(photo.sourceUrl)}" target="_blank" rel="noreferrer">NASA source ↗</a>`:''}</div>`:''}
      <p id="discovery-camera-status" class="discovery-camera__status${visibleError?'':' sr-only'}" role="status">${escape(status)}</p>
      <div class="discovery-camera__actions">${unavailable?button('use-discovery-photo','Use mission image'):aiming && error?button('capture-discovery','Try again',!ready)+button('use-discovery-photo','Use mission image',false,false):aiming?`${button('capture-discovery','Take picture',!ready || stage==='capturing')}<span class="discovery-camera__help">${controller?controllerGlyph('look',family):'Drag to frame'}</span>`:stage==='captured'?button('transmit','Send')+button('retake-discovery','Retake',false,false):received?button('next','Continue'):''}</div>
    </div>
  </section>`;
}
