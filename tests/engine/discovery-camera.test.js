import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDiscoveryCamera,renderPhotoUplink} from '../../src/ui/discovery-camera.js';
const photo={title:'Last Chance',src:'./public/images/discoveries/layers.jpg',alt:'Layers crossing in Martian rock',credit:'NASA/JPL-Caltech',sourceUrl:'https://science.nasa.gov/',discovery:'Scientific explanation stays in the journal.',date:'2004'};
test('aim is restrained, readiness gated and exposes live hooks',()=>{
  assert.match(renderDiscoveryCamera({photo}),/data-action="capture-discovery" disabled/);
  const html=renderDiscoveryCamera({photo,ready:true});
  for(const text of ['Take picture','LAST CHANCE','Drag to frame','id="discovery-camera-status"','id="discovery-camera-alignment"'])assert.ok(html.includes(text));
  assert.match(html,/discovery-camera__status sr-only/);
  assert.doesNotMatch(html,/<h2|Scientific explanation|2004|Reconstructed rover view/);
});
test('captured view offers Send and Retake on controller without a paragraph',()=>{
  const html=renderDiscoveryCamera({photo,stage:'captured',captureUrl:'blob:frame',controller:true});
  assert.match(html,/data-action="transmit"/);assert.match(html,/<span>Send<\/span>/);assert.match(html,/<span>Retake<\/span>/);
  assert.doesNotMatch(html,/data-discovery-photo|Scientific explanation/);
  assert.match(html,/alt="Reconstructed game view/);
});
test('received photo identifies actual provenance and never blocks Continue',()=>{
  const html=renderDiscoveryCamera({photo,stage:'received',imageState:'ready'});
  for(const text of ['Actual mission image','NASA/JPL-Caltech','data-discovery-photo="true"','data-action="next"'])assert.ok(html.includes(text));
  assert.doesNotMatch(html,/Scientific explanation|2004/);
  for(const imageState of ['loading','error'])assert.match(renderDiscoveryCamera({photo,stage:'received',imageState}),/data-action="next"/);
});
test('failures remain visible and actionable; untrusted values are escaped',()=>{
  assert.match(renderDiscoveryCamera({photo,stage:'unavailable'}),/Use mission image/);
  assert.match(renderDiscoveryCamera({photo,error:'Capture failed'}),/discovery-camera__status" role="status">Capture failed/);
  const html=renderDiscoveryCamera({photo:{...photo,title:'<script>',src:'javascript:bad',sourceUrl:'javascript:bad'},stage:'received',imageState:'ready'});
  assert.doesNotMatch(html,/javascript:|data-discovery-photo|<script>/);
});

test('revealing presents the authentic image before the uplink without actions',()=>{
 const html=renderDiscoveryCamera({photo,stage:'revealing',imageState:'ready',captureUrl:'blob:frame'});
 assert.match(html,/data-discovery-photo="true"/);assert.match(html,/Actual mission image/);
 assert.doesNotMatch(html,/data-action=|discovery-camera__scan|discovery-camera__downlink/);
});
test('photo uplink preserves the production signal markup byte for byte',()=>{
 const terminal='<section class="upload-terminal"><div class="signal-map">Mars to Earth</div><progress id="upload-progress"></progress><p id="squeeze-hint">Original instruction</p><button data-action="transmit">Send</button></section>';
 for(const stage of ['handoff','uplink','sending','received']){
  const html=renderPhotoUplink({photo,captureUrl:'blob:frame',imageState:'ready',stage,terminal});
  assert.ok(html.includes(`<div class="photo-uplink__terminal">${terminal}</div>`));
  assert.match(html,/NASA source for Last Chance/);
  assert.doesNotMatch(html,/discovery-camera__scan|discovery-camera__downlink|Scientific explanation/);
 }
 assert.match(renderPhotoUplink({photo,stage:'handoff',terminal}),/--handoff-progress:0/);
 assert.match(renderPhotoUplink({photo,stage:'uplink',terminal,retake:true}),/data-action="retake-discovery"/);
 assert.doesNotMatch(renderPhotoUplink({photo,stage:'uplink',terminal}),/data-action="retake-discovery"/);
});
