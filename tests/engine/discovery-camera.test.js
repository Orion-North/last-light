import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDiscoveryCamera} from '../../src/ui/discovery-camera.js';
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
