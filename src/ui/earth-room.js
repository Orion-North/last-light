/** A physical recovery desk, rendered by the game's existing WebGL renderer. */
export function createEarthRoom(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10191c');
  scene.fog = new THREE.FogExp2('#10191c', .025);
  const camera = new THREE.PerspectiveCamera(42, 1, .08, 80);
  const owned = new Set();
  const materials = new Set();
  const textures = new Set();
  const material = (color, roughness = .6, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(m); return m;
  };
  const graphite = material('#242c2e', .38, .4);
  const edge = material('#11191b', .28, .45);
  const desk = material('#313d41', .8, .12);
  const grain = new Uint8Array(128*128*4);
  let seed=43;
  for(let i=0;i<128*128;i++) { seed=(seed*1664525+1013904223)>>>0; const n=200+(seed>>>28); grain.set([n,n,n,255],i*4); }
  const grainMap = new THREE.DataTexture(grain,128,128,THREE.RGBAFormat);
  grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping; grainMap.repeat.set(8,4); grainMap.needsUpdate=true; textures.add(grainMap); desk.roughnessMap=grainMap;
  const silver = material('#6f7b7d', .35, .7);
  const wall = material('#536067', .92);
  wall.roughnessMap=grainMap;
  const fabric = material('#202c30', .94);
  const keymat = material('#343d40', .78);
  const warm = material('#b6ab91', .8);
  const emissive = (color, strength) => {
    const m = material(color, .45); m.emissive.set(color); m.emissiveIntensity = strength; return m;
  };
  const strip = emissive('#b9d0ce', 1.7);
  const amber = emissive('#d3a765', .7);
  const mesh = (geometry, mat, x, y, z, parent = scene) => {
    owned.add(geometry);
    const obj = new THREE.Mesh(geometry, mat); obj.position.set(x, y, z);
    obj.castShadow=true; obj.receiveShadow=true; parent.add(obj); return obj;
  };
  const box = (w,h,d,mat,x,y,z,parent) => mesh(new THREE.BoxGeometry(w,h,d), mat,x,y,z,parent);
  // Bevels catch the grazing room light: moulded housings rather than sharp cubes.
  const rounded = (w,h,d,r,mat,x,y,z,parent) => {
    const s = new THREE.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2);
    s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r);
    s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2);
    s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r);
    s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const g = new THREE.ExtrudeGeometry(s,{depth:d, bevelEnabled:true, bevelSegments:2,steps:1,bevelSize:Math.min(.025,w*.12,h*.12,d*.12),bevelThickness:Math.min(.025,w*.12,h*.12,d*.12),curveSegments:6});
    g.translate(0,0,-d/2); return mesh(g,mat,x,y,z,parent);
  };
  box(24,.2,24,material('#192125',.9),0,-.12,-3);
  box(24,7,.2,wall,0,3.4,-7);
  box(.2,7,16,wall,-9,3.4,-1);
  // Acoustic panels and structural pilasters create scale behind the seated desk.
  for(let i=0;i<9;i++) {
    box(1.72,2.65,.13,i%3===0 ? fabric : material('#303b40',.95),-8+i*2,3.55,-6.82);
    box(.045,6.7,.3,graphite,-9+i*2,3.3,-6.7);
  }
  // Warm wall luminaires reveal the acoustic planes and give the room a source.
  const practical=emissive('#f1c58e',2.4);
  for(const x of [-5.5,6.5]) {
    rounded(.62,1.6,.17,.09,graphite,x,4.35,-6.58);
    rounded(.36,1.28,.05,.06,practical,x,4.35,-6.45);
    const glow=new THREE.PointLight('#e5b781',23,8,2); glow.position.set(x,4.35,-5.9); scene.add(glow);
  }
  box(24,.18,13,material('#222d32',.95),0,6.7,-2);
  for (const x of [-5,3]) {
    box(3.4,.055,.7,edge,x,6.54,-2.5);
    box(3.12,.025,.48,strip,x,6.5,-2.5);
  }
  // Main wraparound work surface, a thick laminate lip and recessed steel legs.
  // A softly rounded footprint lies horizontally with a narrow thickness.
  const slab2 = rounded(9,3.6,.17,.22,desk,0,1.17,.5); slab2.rotation.x=-Math.PI/2;
  box(8.65,.09,.045,silver,0,1.12,2.29);
  for(const x of [-3.7,3.7]) { box(.18,1.05,2.5,graphite,x,.56,.4); box(.85,.1,2.7,edge,x,.06,.4); }
  // Monitor mounting arm and low weighted pedestal remain visible below the glass.
  rounded(1.35,.15,.8,.08,edge,0,1.31,-.53);
  box(.28,.78,.3,silver,0,1.75,-.65);
  rounded(5.35,3.1,.22,.13,graphite,0,3.05,-.65);
  rounded(5.13,2.9,.06,.085,edge,0,3.09,-.506);
  const screenMaterial = new THREE.MeshBasicMaterial({color:0xffffff, toneMapped:false});
  materials.add(screenMaterial);
  const screen = mesh(new THREE.PlaneGeometry(4.98,2.76),screenMaterial,0,3.09,-.419);
  box(.45,.018,.012,silver,0,1.585,-.49);
  mesh(new THREE.SphereGeometry(.018,8,6),amber,2.41,1.585,-.48);
  // A full keyboard with separate, shallow keycaps; no invented telemetry or text.
  const keyboard = new THREE.Group(); scene.add(keyboard); keyboard.position.set(-.2,1.31,1.3); keyboard.rotation.x=-.085;
  rounded(2.7,.15,.93,.09,edge,0,0,0,keyboard);
  for(let row=0;row<5;row++) for(let col=0;col<15;col++) {
    if(row===4 && col>2 && col<10) continue;
    rounded(.145,.055,.125,.015,keymat,-1.2+col*.173,.105,-.34+row*.166,keyboard);
  }
  rounded(1.13,.055,.125,.018,keymat,-.16,.105,.324,keyboard);
  rounded(.53,.105,.72,.14,graphite,2.04,1.34,1.4).rotation.y=-.13;
  box(.022,.012,.12,silver,2.04,1.405,1.23);
  // A paper notebook and a coiled headset give human scale without UI decoration.
  rounded(.82,1.02,.055,.035,warm,-2.5,1.31,1.22).rotation.x=-Math.PI/2;
  box(.045,.025,.83,graphite,-2.78,1.36,1.2);
  const headset = mesh(new THREE.TorusGeometry(.3,.035,7,30,Math.PI*1.45),edge,3.25,1.34,.9); headset.rotation.x=Math.PI/2;
  for(const x of [2.99,3.51]) rounded(.16,.12,.24,.05,fabric,x,1.35,1.1);
  // Offset occupied desks beyond the main screen, with black standby glass.
  for(const [x,z] of [[-5.9,-3.6],[5.8,-4.2]]) {
    box(3.9,.16,1.9,desk,x,1.12,z);
    box(.13,1.1,1.4,graphite,x-1.5,.55,z);
    box(.13,1.1,1.4,graphite,x+1.5,.55,z);
    box(.12,.6,.18,silver,x,1.5,z-.3);
    rounded(2.35,1.4,.16,.08,graphite,x,2.17,z-.3);
    rounded(2.12,1.18,.035,.04,emissive('#213b45',.35),x,2.19,z-.195);
    const chair = rounded(1.1,1.25,.25,.16,fabric,x+.4,1.02,z+1.35); chair.rotation.y=-.2;
    box(.14,.6,.14,graphite,x+.4,.35,z+1.35);
  }
  scene.add(new THREE.HemisphereLight('#c0d3d9','#25221b',1.65));
  const area = (color,intensity,x,y,z,tx,ty,tz) => {
    const light = new THREE.SpotLight(color,intensity,25,.8,.8,1.3); light.position.set(x,y,z); light.target.position.set(tx,ty,tz); scene.add(light,light.target); return light;
  };
  const keyLight=area('#dbe8e7',52,-3,6,3,0,1,0);
  keyLight.castShadow=true; keyLight.shadow.mapSize.set(1024,1024); keyLight.shadow.bias=-.0002; keyLight.shadow.normalBias=.015;
  keyLight.shadow.camera.near=.5; keyLight.shadow.camera.far=22;
  area('#87a9b7',90,6,5,-4,0,2,0);
  area('#d3a578',28,-7,4,-3,-2,1,0);
  area('#aabdc8',55,4,4,-2,5,3,-7);
  area('#d4b78f',50,-4,4,-2,-5,3,-7);
  const screenGlow = new THREE.PointLight('#c59b73',8,5,2); screenGlow.position.set(0,2.8,.2); scene.add(screenGlow);
  // A transparent instrument layer is part of the physical display, using the
  // same renderer as the reconstructed landscape underneath it.
  const signalCanvas=document.createElement('canvas'); signalCanvas.width=1024; signalCanvas.height=200;
  const signalContext=signalCanvas.getContext('2d');
  const signalTexture=new THREE.CanvasTexture(signalCanvas); signalTexture.colorSpace=THREE.SRGBColorSpace; textures.add(signalTexture);
  const signalMaterial=new THREE.MeshBasicMaterial({map:signalTexture,transparent:true,depthWrite:false,toneMapped:false}); materials.add(signalMaterial);
  const signalPlane=mesh(new THREE.PlaneGeometry(4.95,.96),signalMaterial,0,2.20,-.403);
  signalPlane.castShadow=false; signalPlane.receiveShadow=false; signalPlane.renderOrder=2;
  let signalState={mode:'recovery',stage:'ready'};
  let signalStart=null, signalTime=0, signalLastDraw=-Infinity, signalDirty=true;
  function setSignal(state={}) {
    if(state.mode!==signalState.mode || state.stage!==signalState.stage) signalStart=null;
    if(Object.keys(state).some(key=>state[key]!==signalState[key])) signalDirty=true;
    signalState={...state}; signalPlane.visible=state.visible!==false;
  }
  function drawSignal(time) {
    if(!signalContext || !signalPlane.visible) return;
    const animated=/send|transmit|calling/.test(signalState.stage||'') && !signalState.reducedMotion;
    if(!signalDirty && (!animated || time-signalLastDraw<1/30)) return;
    signalDirty=false; signalLastDraw=time;
    if(signalStart===null) signalStart=time;
    const c=signalContext, w=1024, h=200;
    c.clearRect(0,0,w,h);
    const background=c.createLinearGradient(0,0,0,h); background.addColorStop(0,'rgba(7,16,20,0)'); background.addColorStop(.3,'rgba(7,16,20,.78)'); background.addColorStop(1,'rgba(7,16,20,.91)');
    c.fillStyle=background;c.fillRect(0,0,w,h);
    const archive=signalState.mode==='archive';
    const sending=/send|transmit|calling/.test(signalState.stage||'');
    const silence=/silent|silence|no-answer|unanswered|waiting|listen/.test(signalState.stage||'');
    const cy=95, left=137, right=887, radius=30;
    function planet(x,isEarth) {
      c.save();c.beginPath();c.arc(x,cy,radius,0,Math.PI*2);c.clip();
      const g=c.createRadialGradient(x-12,cy-14,2,x+8,cy+5,40);
      g.addColorStop(0,isEarth?'#7bafbd':'#d1a174');g.addColorStop(.55,isEarth?'#365f77':'#95603e');g.addColorStop(1,'#101b22');c.fillStyle=g;c.fillRect(x-radius,cy-radius,radius*2,radius*2);
      if(isEarth) { c.fillStyle='rgba(171,184,151,.5)'; c.beginPath();c.moveTo(x-21,cy-13);c.lineTo(x-9,cy-22);c.lineTo(x+4,cy-17);c.lineTo(x,cy-5);c.lineTo(x+10,cy+2);c.lineTo(x+1,cy+18);c.lineTo(x-6,cy+10);c.lineTo(x-9,cy-3);c.closePath();c.fill(); }
      else { c.strokeStyle='rgba(69,38,27,.35)'; c.lineWidth=3; for(const [dx,dy,r] of [[-9,-9,7],[11,6,9],[-11,17,4]]) { c.beginPath();c.arc(x+dx,cy+dy,r,0,7);c.stroke(); } }
      c.restore(); c.strokeStyle='rgba(190,211,214,.35)';c.lineWidth=1;c.beginPath();c.arc(x,cy,radius+.5,0,7);c.stroke();
      c.font='17px monospace';c.textAlign='center';c.fillStyle='#cad7d6';c.fillText(isEarth?'EARTH':'MARS',x,cy+59);
    }
    planet(left,true);planet(right,false);
    c.lineWidth=1;c.strokeStyle=silence?'rgba(176,189,190,.22)':'rgba(184,209,212,.55)';c.setLineDash([3,10]);c.beginPath();c.moveTo(left+51,cy);c.lineTo(right-51,cy);c.stroke();c.setLineDash([]);
    if(archive) {
      // Preserved memories gather at Earth; this is not a reply from Mars.
      c.strokeStyle='#d4b981';c.lineWidth=1.4;c.beginPath();c.arc(left,cy,41,-.8,Math.PI*1.8);c.stroke();
      for(let i=0;i<3;i++) { const x=left+80+i*32;c.save();c.translate(x,cy);c.rotate(Math.PI/4);c.fillStyle='rgba(205,180,125,.75)';c.fillRect(-5,-5,10,10);c.restore(); }
    } else if(sending) {
      const progress=signalState.reducedMotion?1:Number.isFinite(signalState.progress)?THREE.MathUtils.clamp(signalState.progress,0,1):Math.min(1,(time-signalStart)/2.4);
      const x=left+51+progress*(right-left-102);
      const glow=c.createRadialGradient(x,cy,0,x,cy,24);glow.addColorStop(0,'rgba(231,210,150,.6)');glow.addColorStop(1,'rgba(231,210,150,0)');c.fillStyle=glow;c.fillRect(x-24,cy-24,48,48);
      c.save();c.translate(x,cy);c.rotate(Math.PI/4);c.fillStyle='#eddaa3';c.fillRect(-5,-5,10,10);c.restore();
    } else if(silence) {
      c.strokeStyle='rgba(187,203,204,.28)';c.beginPath();c.arc(right,cy,42,-.65,.65);c.stroke();
    }
    signalTexture.needsUpdate=true;
  }
  function resize(width,height) {
    camera.aspect=width/Math.max(height,1);
    const portrait=camera.aspect<.85;
    camera.fov=42;
    const distance=portrait ? 3.12/(Math.tan(THREE.MathUtils.degToRad(21))*camera.aspect) : Math.max(7.8,3.8/camera.aspect);
    // Screen centre is intentionally high, leaving the desk for the action overlay.
    camera.position.set(portrait?.14:.68,3.34,distance-.65);
    const centre=portrait?.315:.355;
    const viewHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(21));
    camera.lookAt(portrait?.03:.20,3.09-(.5-centre)*viewHeight,-.65);
    camera.updateProjectionMatrix();
  }
  resize(1440,900);
  return {scene,camera,screen,resize,setSignal,update(time) { signalTime=time; drawSignal(signalTime); screenGlow.intensity=8+Math.sin(time*.17)*.035; },dispose() { for(const g of owned)g.dispose(); for(const m of materials)m.dispose(); for(const t of textures)t.dispose(); scene.clear(); }};
}
