import {installClock} from './showcase-clock.js';
import {scenes} from '../../src/content/story.js';
import {restoreSession,serializeSession} from '../../src/session.js';
import {createGeologyTool} from '../../src/engine/geology-tool.js';
const frame=document.querySelector('iframe'),status=document.querySelector('#status');
const durations={opening:8,driving:6,trace:10,brush:10,send:14,storm:8,'final-image':10,ending:14};
let clock,tool,active='',frameNumber=0,ready=false,started=false,tracePath=0,tracePoint=0,brushPoint=0,sample=0,compareAt=null,doneSend=false;
const pad={id:'DualSense showcase input',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false,touched:false}))};
const pressure=(i,value)=>{pad.buttons[i]={value,pressed:value>.5,touched:value>0};};
let pressFrames=0;
function cross(){pressure(0,1);pressFrames=3;}
let seed; let events=[],lastStage="";
window.installShowcase=win=>{
 clock=installClock(win);
 const memory=new Map(Object.entries(seed));
 Object.defineProperty(win,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
 Object.defineProperty(win.navigator,'getGamepads',{value:()=>[pad]});
 win.addEventListener('DOMContentLoaded',()=>{
  win.document.querySelector('#sound-toggle').click();win.document.querySelector('#sound-toggle').click();
  win.document.addEventListener('tool-sample',e=>{tool=e.detail;});
  win.document.addEventListener('world-status',e=>{if(e.detail.state==='ready'){ready=true;status.textContent=`Ready: ${active}`;document.querySelector('#start').disabled=false;}if(e.detail.state==='error')status.textContent=e.detail.message;});
 });
};
function blankTool(scene){return createGeologyTool(scene).checkpoint();}
function brushedTool(){const t=createGeologyTool('blueberries');t.setInput({});t.setInput({pressure:1});for(let y=-.85;y<.9;y+=.18)for(let x=-.85;x<.9;x+=.18){t.setCursor(x,y);t.update(.05);}return t.checkpoint();}
async function load(){
 events=[];lastStage='';active=document.querySelector('#clip').value;ready=false;started=false;frameNumber=0;tool=null;tracePath=0;tracePoint=0;brushPoint=0;sample=0;compareAt=null;doneSend=false;pressFrames=0;
 pad.axes.fill(0);pad.buttons.forEach((_,i)=>pressure(i,0));
 document.querySelectorAll('#start,#next,#preview').forEach(b=>b.disabled=true);status.textContent='Loading '+active;
 seed={'last-light-settings':JSON.stringify({haptics:false,touch:false,prompts:'playstation'})};
 if(active!=='opening'){
  const id=({driving:'stone-ripples',trace:'stone-ripples',brush:'blueberries',send:'blueberries',storm:'dust','final-image':'last-image',ending:'last-call'})[active];
  const sceneIndex=scenes.findIndex(s=>s.id===id),phase=['send','trace','brush','driving','storm'].includes(active)?'observe':'transmit';
  const count=sceneIndex+(phase==='transmit'?1:0);
  const legal=restoreSession(JSON.stringify({version:1,sceneIndex,phase,choices:scenes.slice(0,count).map(s=>s.choices[0]?.id)}),scenes);
  const pos=({driving:[4,-3,2.5],trace:[7,-7,Math.PI],brush:[-5,-10,Math.PI],send:[-5,-10,Math.PI],storm:[10,-1,1.7],'final-image':[3,-4,-.45],ending:[3,-4,-.45]})[active];
  const checkpoint={sceneId:id,reached:!['driving','storm'].includes(active),position:{x:pos[0],z:pos[1],heading:pos[2]}};
  if(active==='trace'||active==='brush')checkpoint.tool=blankTool(id);
  if(active==='send')checkpoint.tool=brushedTool();
  seed['last-light-journey-v1']=serializeSession(legal,checkpoint);
 }
 const html=await(await fetch('../../index.html')).text();
 const boot='<base href="../../"><style>html{scrollbar-width:none}::-webkit-scrollbar{display:none}</style><script>parent.installShowcase(window);<\/script>';
 frame.srcdoc=html.replace('<head>','<head>'+boot);
}
const doc=()=>frame.contentDocument;
function start(){
 if(!ready)return;started=true;
 if(active!=='opening')doc().querySelector('[data-action="begin"]').click();
 // Settle the authored camera before each editorial cut. No gameplay inputs.
 for(let i=0;i<48;i++)clock.tick();
 frameNumber=0;document.querySelector('#next').disabled=false;document.querySelector('#preview').disabled=false;
 status.textContent=`${active} frame 0 / ${durations[active]*24}`;
}
const brushPath=Array.from({length:5},(_,row)=>{const y=-.65+row*.3;return row%2?[{x:.8,y},{x:-.8,y}]:[{x:-.8,y},{x:.8,y}];}).flat();
function aim(point){
 if(!tool)return false;
 const dx=point.x-tool.cursor.x,dy=point.y-tool.cursor.y;
 pad.axes[2]=Math.abs(dx)<.025?0:Math.max(-1,Math.min(1,dx*12));pad.axes[3]=Math.abs(dy)<.025?0:Math.max(-1,Math.min(1,dy*12));
 return Math.hypot(dx,dy)<.055;
}
function script(t){
 pad.axes.fill(0);pressure(6,0);pressure(7,0);if(pressFrames>0){pressFrames--;if(!pressFrames)pressure(0,0);}
 if(active==='opening'){if(frameNumber===48)doc().querySelector('[data-action="begin"]').click();}
 if(active==='driving'){pad.axes[1]=t<4.6?-.72:0;pad.axes[0]=t<2?-.12:0;pad.axes[2]=t>4.5?.12:0;}
 if(active==='trace'&&tool?.stage==='trace'){
  const path=tool.paths.find(p=>!p.complete);
  if(path){if(path.id!==tracePath){tracePath=path.id;tracePoint=0;}
   const point=path.points[tracePoint];if(aim(point)){tracePoint=Math.min(path.points.length-1,tracePoint+1);}
   pressure(7,tool.hint.startsWith('Release')?0:1);
  }
 }
 if(active==='trace'&&tool?.stage==='compare'&&t>8.7&&!doneSend){cross();doneSend=true;}
 if(active==='brush'&&tool?.stage==='brush'){
  if(aim(brushPath[Math.min(brushPoint,brushPath.length-1)]))brushPoint++;
  pressure(7,tool.hint.startsWith('Release')?0:1);
 }
 if(active==='send'){
  if(tool?.stage==='sample'){
   const target=tool.targets.find(p=>!tool.samples.some(s=>s.id===p.id));
   if(target){const on=aim(target);if(on){pad.axes[2]=0;pad.axes[3]=0;pressure(7,tool.hint.startsWith('Release')?0:1);}}
  } else if(tool?.stage==='compare'&&!doneSend){cross();doneSend=true;compareAt=t;}
  if(compareAt!==null&&t>compareAt+1&&t<compareAt+3){pressure(6,1);pressure(7,1);}
 }
 if(active==='storm'){pad.axes[1]=t<5?-.45:0;pad.axes[2]=t>4?.16:0;pad.axes[3]=t>4?-.08:0;}
 if(active==='ending'&&frameNumber===240)doc().querySelector('[data-action="next"]')?.click();
 if(active==='final-image'||active==='ending'){
  if(t>2&&t<4.2){pressure(6,1);pressure(7,1);}
  if(t>8&&!doneSend&&doc().querySelector('[data-action="next"]')){cross();doneSend=true;}
 }
}
function next(){
 if(!started||frameNumber>=durations[active]*24)return;
 script(frameNumber/24);clock.tick();frameNumber++;
 if(active==='ending'&&doc().activeElement?.matches('h1'))doc().activeElement.blur();
 const stage=doc().querySelector('.upload-terminal')?.dataset.stage||'';if(stage!==lastStage){events.push(`${(frameNumber/24).toFixed(3)}:${stage||'none'}`);lastStage=stage;}
 const detail=tool?` · ${tool.stage} ${Math.round(tool.progress*100)}%`:'';
 status.textContent=`${active} frame ${frameNumber} / ${durations[active]*24}${detail} · ${events.join(" / ")}`;
}
document.querySelector('#load').onclick=load;document.querySelector('#start').onclick=start;document.querySelector('#next').onclick=next;
document.querySelector('#preview').onclick=async()=>{while(frameNumber<durations[active]*24){next();await new Promise(r=>setTimeout(r,0));}};
await load();
