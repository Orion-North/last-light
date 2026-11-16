import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDiscoveryCamera,renderPhotoUplink} from '../../src/ui/discovery-camera.js';
const photo={title:'Last Chance',src:'./public/images/discoveries/layers.jpg',alt:'Layers crossing in Martian rock',credit:'NASA/JPL-Caltech',sourceUrl:'https://science.nasa.gov/',discovery:'Scientific explanation stays in the journal.',date:'2004'};
test('camera keeps capture and readiness without extra navigation or scoring cues',()=>{
 assert.match(renderDiscoveryCamera({photo}),/data-action="capture-discovery" disabled/);
 const html=renderDiscoveryCamera({photo,ready:true});
 for(const text of ['Take picture','LAST CHANCE','id="discovery-camera-status"'])assert.ok(html.includes(text));
 assert.match(html,/discovery-camera__status sr-only/);
 assert.doesNotMatch(html,/<h2|Scientific explanation|2004|Retake|Drag to frame|FRAMED|LIVE|NASA source/);
});
test('revealing distinguishes the authentic mission image without buttons or source navigation',()=>{
 const html=renderDiscoveryCamera({photo,stage:'revealing',imageState:'ready',captureUrl:'blob:frame'});
 assert.match(html,/data-discovery-photo="true"/);assert.match(html,/NASA · Opportunity/);
 assert.doesNotMatch(html,/data-action=|<a |Scientific explanation|2004|Retake/);
});
test('unavailable camera offers assistance and untrusted metadata is escaped',()=>{
 assert.match(renderDiscoveryCamera({photo,stage:'unavailable'}),/Use mission image/);
 assert.match(renderDiscoveryCamera({photo,error:'Capture failed'}),/discovery-camera__status" role="status">Capture failed/);
 const html=renderDiscoveryCamera({photo:{...photo,title:'<script>',src:'javascript:bad'},stage:'revealing',imageState:'ready'});
 assert.doesNotMatch(html,/javascript:|data-discovery-photo|<script>/);
});
test('photo fades out during handoff and original terminal alone remains afterward',()=>{
 const terminal='<section class="upload-terminal"><div class="signal-map">Mars to Earth</div><progress id="upload-progress"></progress><p id="squeeze-hint">Original instruction</p><button data-action="transmit">Send</button></section>';
 for(const stage of ['handoff','uplink','sending','received']){
  const html=renderPhotoUplink({photo,captureUrl:'blob:frame',imageState:'ready',stage,terminal});
  assert.ok(html.includes(`<div class="photo-uplink__terminal">${terminal}</div>`));
  if(stage==='handoff')assert.match(html,/photo-uplink__photo/);
  else assert.doesNotMatch(html,/photo-uplink__photo|<img /);
  assert.doesNotMatch(html,/Retake|NASA source|<a |figcaption/);
 }
 assert.match(renderPhotoUplink({photo,stage:'handoff',terminal}),/--handoff-progress:0/);
});

test('the captured-frame reveal retains the shutter layer without introducing another action',()=>{
 const html=renderDiscoveryCamera({photo,captureUrl:'blob:frame',stage:'revealing',imageState:'ready'});
 assert.match(html,/discovery-camera__exposure/);assert.match(html,/discovery-camera__capture/);
 assert.match(html,/discovery-camera__original/);assert.doesNotMatch(html,/data-action=/);
});

test('camera shutter uses the right bumper glyph while historical fallback keeps confirm',()=>{
 const camera=renderDiscoveryCamera({photo,ready:true,controller:true,family:'xbox'});
 assert.match(camera,/RB/);assert.doesNotMatch(camera,/aria-label="A"/);
 const fallback=renderDiscoveryCamera({photo,stage:'unavailable',controller:true,family:'xbox'});
 assert.doesNotMatch(fallback,/RB/);
});
