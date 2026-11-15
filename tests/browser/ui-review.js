// Isolated real-game UI fixture: virtual Gamepad inputs and private save storage.
import {installClock} from './showcase-clock.js';
import {scenes} from '../../src/content/story.js';
import {restoreSession,serializeSession} from '../../src/session.js';
import {createGeologyTool} from '../../src/engine/geology-tool.js';
const frame=document.querySelector('iframe'),status=document.querySelector('#status');
const query=new URLSearchParams(location.search);
frame.style.width=(Number(query.get('width'))||1280)+'px';frame.style.height=(Number(query.get('height'))||720)+'px';
const pad={id:'DualSense UI review',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
let clock,seed,active;
const pressure=(i,value)=>pad.buttons[i]={value,pressed:value>.5,touched:value>0};
const tick=(n=1)=>{for(let i=0;i<n;i++)clock.tick();};
function report(){const d=frame.contentDocument,modal=d.querySelector('dialog[open]');status.textContent=`${active} · modal ${modal?.id||'none'} · focus ${d.activeElement?.textContent?.trim().replace(/\s+/g,' ').slice(0,65)} · scroll ${Math.round(modal?.scrollTop||0)} · expanded ${d.querySelectorAll('#journal-content details[open]').length} · triangle glyphs ${d.querySelectorAll('[aria-label*="Triangle"]').length}`;}
window.installUIReview=win=>{
 clock=installClock(win);const memory=new Map(Object.entries(seed));
 Object.defineProperty(win,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
 Object.defineProperty(win.navigator,'getGamepads',{value:()=>[pad]});
 win.addEventListener('DOMContentLoaded',()=>win.document.addEventListener('world-status',e=>{if(win.document!==frame.contentDocument)return;if(e.detail.state==='ready'){document.querySelector('#start').disabled=false;status.textContent='Ready: '+active;}}));
};
async function load(){
 active=document.querySelector('#scene').value;document.querySelector('#start').disabled=true;pad.axes.fill(0);pad.buttons.forEach((_,i)=>pressure(i,0));
 seed={'last-light-settings':JSON.stringify({sound:false,haptics:false,touch:false,prompts:'playstation'})};
 if(active!=='intro'){
 const id=['travel','trace','compare'].includes(active)?'stone-ripples':active==='ending'?'last-call':'last-image';
 const sceneIndex=scenes.findIndex(s=>s.id===id),phase=['travel','trace','compare'].includes(active)?'observe':active==='send'?'transmit':'received';
 const count=sceneIndex+(['received','transmit'].includes(phase)?1:0);
 const state=restoreSession(JSON.stringify({version:1,sceneIndex,phase,choices:scenes.slice(0,count).map(s=>s.choices[0]?.id)}),scenes);
 const checkpoint={sceneId:id,reached:active!=='travel',position:{x:7,z:-7,heading:Math.PI}};
 if(['trace','compare'].includes(active)){
 const tool=createGeologyTool(id);
 if(active==='compare')for(const path of tool.snapshot().paths){tool.setInput({});tool.setInput({pressure:1});for(const point of path.points){tool.setCursor(point.x,point.y);tool.update(.05);}}
 checkpoint.tool=tool.checkpoint();
 }
 seed['last-light-journey-v1']=serializeSession(state,checkpoint);
 }
 const html=await(await fetch('../../index.html')).text();frame.srcdoc=html.replace('<head>','<head><base href="../../"><script>parent.installUIReview(window);<\/script>');
}
// Preserve the game's focused entry while operating the external test pad.
document.querySelector('nav').addEventListener('pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
function prepare(){if(!frame.contentDocument.hasFocus())frame.contentWindow.focus();tick(2);}
function tap(i){prepare();pressure(i,1);tick(2);pressure(i,0);tick(3);report();}
document.querySelector('#load').onclick=load;
document.querySelector('#start').onclick=()=>{const begin=frame.contentDocument.querySelector('[data-action="begin"]');if(!begin){status.textContent='Wait for the scene to finish loading';return;}document.querySelector('#start').disabled=true;prepare();begin.click();tick(48);if(active==='ending'){tap(0);tick(20);}report();};
for(const button of document.querySelectorAll('[data-button]'))button.onclick=()=>tap(Number(button.dataset.button));
for(const button of document.querySelectorAll('[data-axis]'))button.onclick=()=>{prepare();const [axis,value]=button.dataset.axis.split(',').map(Number);pad.axes[axis]=value;tick(24);pad.axes.fill(0);tick(3);report();};
document.querySelector('#settle').onclick=()=>{prepare();tick(48);report();};
await load();
