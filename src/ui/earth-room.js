/** A physical recovery desk, rendered by the game's existing WebGL renderer. */
export function createEarthRoom(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101b20');
  scene.fog = new THREE.FogExp2('#101b20', .027);
  const camera = new THREE.PerspectiveCamera(42, 1, .08, 80);
  const owned = new Set(), materials = new Set(), textures = new Set();
  let seed=43;
  const random = () => { seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const material = (color, roughness = .6, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(m); return m;
  };
  const canvasTexture = (w,h,draw) => {
    const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d'); if(ctx) draw(ctx,w,h);
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4; textures.add(texture); return texture;
  };
  const grainMap=canvasTexture(256,256,(c,w,h) => {
    c.fillStyle='#a5a5a5'; c.fillRect(0,0,w,h);
    for(let i=0;i<18000;i++) { const v=125+Math.floor(random()*80); c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(random()*w,random()*h,1,1); }
  });
  grainMap.colorSpace=THREE.NoColorSpace; grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping; grainMap.repeat.set(8,4);
  const graphite=material('#252d30',.42,.3), edge=material('#111b20',.39,.22);
  const desk=material('#41494a',.8,.08); desk.roughnessMap=grainMap; desk.bumpMap=grainMap; desk.bumpScale=.008;
  const silver=material('#89918e',.37,.72), wall=material('#293a40',.94);
  wall.bumpMap=grainMap; wall.bumpScale=.015;
  const fabric=material('#1a292d',.96), keymat=material('#515958',.72), paper=material('#cec8b2',.92);
  fabric.bumpMap=grainMap; fabric.bumpScale=.012;
  const emissive=(color,strength) => { const m=material(color,.4);m.emissive.set(color);m.emissiveIntensity=strength;return m; };
  const amber=emissive('#d4b47c',.7);
  const mesh=(geometry,mat,x,y,z,parent=scene) => {
    owned.add(geometry); const obj=new THREE.Mesh(geometry,mat);obj.position.set(x,y,z);
    obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
  };
  const box=(w,h,d,mat,x,y,z,parent) => mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
  const rounded=(w,h,d,r,mat,x,y,z,parent) => {
    const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);
    s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const bevel=Math.min(.022,w*.1,h*.1,d*.15);
    const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:5});
    g.translate(0,0,-d/2);return mesh(g,mat,x,y,z,parent);
  };
  const flat=(w,d,thickness,r,mat,x,y,z,parent) => { const m=rounded(w,d,thickness,r,mat,x,y,z,parent);m.rotation.x=-Math.PI/2;return m; };
  const tube=(points,r,mat,parent=scene,segments=32) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,6,false),mat,0,0,0,parent);
  const rod=(a,b,r,mat,parent=scene) => {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat,...start.clone().add(end).multiplyScalar(.5).toArray(),parent);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
  };
  const surface=(w,h,texture,x,y,z,matColor='#ffffff',parent=scene) => {
    const mat=material(matColor,.85);mat.map=texture;mat.side=THREE.DoubleSide;
    const m=mesh(new THREE.PlaneGeometry(w,h),mat,x,y,z,parent);m.castShadow=false;return m;
  };
  // Soft contact occlusion is local to the surfaces, not a screen-space vignette.
  const contactMap=canvasTexture(128,128,(c,w,h) => {
    const g=c.createRadialGradient(w/2,h/2,9,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.7)');g.addColorStop(.48,'rgba(0,0,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
  });
  const contactMat=new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,opacity:.6});materials.add(contactMat);
  const contact=(w,d,x,z,y=1.277) => {const m=mesh(new THREE.PlaneGeometry(w,d),contactMat,x,y,z);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;};

  // An after-hours operations floor: felt wall panels, a glazed adjoining room,
  // and a low continuous light reveal. The workstation is the brightest place.
  box(24,.2,24,material('#142025',.95),0,-.12,-3);
  box(24,7,.2,wall,0,3.4,-7);
  box(.2,7,16,wall,-9,3.4,-1);
  const wallInset=material('#203138',.96);
  for(let i=0;i<6;i++) {
    box(1.44,3.6,.12,i%2 ? fabric:wallInset,-8+i*1.5,3.35,-6.82);
    box(.016,3.55,.018,material('#4b5a5e',.7),-7.28+i*1.5,3.35,-6.74);
  }
  box(24,.07,.35,edge,0,1.43,-6.72);
  box(24,.12,.5,graphite,0,5.5,-6.55);
  box(24,.028,.15,emissive('#93aaa8',.45),0,5.43,-6.38);
  // A dark interior behind glazing lends depth without fictional live readouts.
  const glass=material('#142c37',.25,.35);
  for(let i=0;i<3;i++) {
    const x=3.15+i*2.05;
    box(1.98,3.75,.08,glass,x,3.48,-6.72);
    box(.065,4,.14,silver,x-1.02,3.48,-6.61);
    for(let j=0;j<8;j++) box(1.98,.023,.025,wallInset,x,2.45+j*.32,-6.62);
    box(.95,.54,.025,emissive('#304a55',.25),x+.2,2.35,-6.6);
  }
  box(6.2,.055,.18,silver,5.15,5.42,-6.61);
  box(6.2,.09,.18,graphite,5.15,1.55,-6.61);
  box(24,.18,13,material('#1d2c32',.95),0,6.7,-2);
  for(const x of [-5.8,3.9]) { box(2.8,.07,.45,edge,x,6.5,-3);box(2.6,.025,.22,emissive('#b9d0ce',1.4),x,6.45,-3); }
  // Plain typeset location signage, deliberately not an imitation NASA insignia.
  const plaqueTexture=canvasTexture(1024,384,(c,w,h) => {
    c.fillStyle='#263a42';c.fillRect(0,0,w,h);
    c.fillStyle='#c6d0cb';c.font='500 102px sans-serif';c.fillText('NASA / JPL',66,148);
    c.fillStyle='#aabbb8';c.font='29px sans-serif';c.fillText('MARS EXPLORATION PROGRAM',70,223);
    c.fillStyle='#829894';c.fillRect(70,269,56,3);c.font='25px sans-serif';c.fillText('MISSION OPERATIONS',149,280);
  });
  rounded(2.9,1.12,.085,.035,edge,-6.9,4.2,-6.58);
  const plaque=surface(2.82,1.07,plaqueTexture,-6.9,4.2,-6.508);
  plaque.material.emissive.set('#ffffff');plaque.material.emissiveMap=plaqueTexture;plaque.material.emissiveIntensity=.12;
  for(const x of [-8.23,-5.57]) mesh(new THREE.SphereGeometry(.017,6,4),silver,x,4.66,-6.50);

  // Thick, gently radiused laminate with an inset rubber edge and metal underframe.
  flat(9,3.6,.17,.24,desk,0,1.17,.5);
  flat(9.015,3.61,.055,.24,edge,0,1.075,.5);
  box(8.6,.028,.025,silver,0,1.092,2.3);
  for(const x of [-3.7,3.7]) {box(.16,1.05,2.5,graphite,x,.55,.4);box(.7,.1,2.6,edge,x,.06,.4);}
  const mat=material('#202e30',.96);mat.bumpMap=grainMap;mat.bumpScale=.009;
  flat(4.55,1.39,.016,.12,mat,.3,1.276,1.18);
  // A restrained stitched edge is actual geometry, visible in grazing task light.
  const seam=material('#52605c',.95);
  for(let i=0;i<42;i++) box(.025,.002,.005,seam,-1.82+i*.104,1.287,1.82);
  contact(2.1,1.15,0,-.51);
  flat(1.43,.87,.11,.11,edge,0,1.34,-.53);
  flat(1.35,.8,.018,.09,graphite,0,1.408,-.53);
  box(.23,.68,.24,silver,0,1.78,-.69);box(.12,.54,.015,edge,0,1.78,-.552);
  // The live render-target and monitor-local signal keep their original dimensions.
  rounded(5.43,3.15,.27,.145,edge,0,3.05,-.72);
  rounded(5.35,3.1,.18,.13,graphite,0,3.05,-.615);
  rounded(5.13,2.9,.04,.085,edge,0,3.09,-.497);
  const screenMaterial=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});materials.add(screenMaterial);
  const screen=mesh(new THREE.PlaneGeometry(4.98,2.76),screenMaterial,0,3.09,-.419);
  screen.castShadow=false;
  box(4.92,.014,.008,material('#485253',.42,.5),0,4.575,-.503);
  for(let i=0;i<4;i++) mesh(new THREE.CylinderGeometry(.013,.013,.006,8),edge,1.91+i*.1,1.571,-.501).rotation.x=Math.PI/2;
  mesh(new THREE.SphereGeometry(.013,8,6),amber,2.41,1.585,-.48);
  box(.22,.012,.006,silver,0,1.585,-.49);
  for(let i=0;i<14;i++) box(.012,.065,.009,edge,-2.42+i*.045,1.573,-.505);
  tube([[.12,1.7,-.78],[.3,1.3,-.97],[.85,1.28,-1.05],[1.5,1.27,-1.2]],.023,edge);

  // Hand-drawn ink, paper grain and a lifted lower edge: a note left by a person,
  // not another HUD label. The letters do not depend on installed cursive fonts.
  const noteTexture=canvasTexture(512,512,(c,w,h) => {
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#e4ca77');g.addColorStop(.22,'#efda91');g.addColorStop(1,'#d7bc70');c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<12000;i++) {c.fillStyle=random()>.5?'rgba(255,250,213,.07)':'rgba(100,72,26,.04)';c.fillRect(random()*w,random()*h,1.2,1.2);}
    c.strokeStyle='#39465b';c.lineWidth=10;c.lineCap='round';c.lineJoin='round';
    c.save();c.translate(48,99);c.rotate(-.045);
    const pen=commands => {c.beginPath();for(const [op,...args] of commands)c[op](...args);c.stroke();};
    pen([['moveTo',72,33],['bezierCurveTo',13,22,0,139,45,145],['bezierCurveTo',100,151,119,46,72,33],['bezierCurveTo',49,26,34,39,28,58]]);
    pen([['moveTo',125,80],['bezierCurveTo',122,117,113,174,108,198],['moveTo',123,99],['bezierCurveTo',157,49,188,92,166,123],['bezierCurveTo',153,141,136,130,124,123]]);
    pen([['moveTo',205,79],['bezierCurveTo',201,124,191,171,189,198],['moveTo',204,99],['bezierCurveTo',237,51,268,87,246,120],['bezierCurveTo',234,139,214,131,203,123]]);
    pen([['moveTo',279,83],['bezierCurveTo',265,143,288,146,316,91],['moveTo',321,80],['bezierCurveTo',312,132,305,195,272,206],['bezierCurveTo',254,213,249,197,260,186]]);
    c.restore();c.strokeStyle='#a04b40';c.lineWidth=8;
    c.beginPath();c.moveTo(270,413);c.bezierCurveTo(244,385,201,352,217,326);c.bezierCurveTo(232,302,258,318,268,336);c.bezierCurveTo(279,302,318,306,322,331);c.bezierCurveTo(327,359,288,394,270,413);c.stroke();
    c.strokeStyle='rgba(91,71,37,.17)';c.lineWidth=1;c.beginPath();c.moveTo(20,492);c.quadraticCurveTo(240,485,489,496);c.stroke();
  });
  const noteMat=material('#ffffff',.95);noteMat.map=noteTexture;noteMat.side=THREE.DoubleSide;noteMat.emissive.set('#d8b46b');noteMat.emissiveIntensity=.09;
  const noteGeo=new THREE.PlaneGeometry(.73,.76,10,14),positions=noteGeo.attributes.position;
  for(let i=0;i<positions.count;i++) {const x=positions.getX(i),y=positions.getY(i),curl=Math.max(0,-y-.09);positions.setZ(i,curl*curl*1.15+.009*Math.sin(x*9)*(1-(y+.38)/.76));}
  noteGeo.computeVertexNormals();
  // Keep the personal note inside the portrait framing; reserve its glass margin below.
  const note=mesh(noteGeo,noteMat,2.68,1.98,-.325);note.rotation.z=-.11;note.rotation.y=-.08;
  // A translucent tape strip catches light without covering the handwriting.
  const tape=material('#d8cba2',.8);tape.transparent=true;tape.opacity=.42;tape.depthWrite=false;
  // Parent the tape to the paper; the strip bridges its top edge onto the glass.
  box(.3,.075,.003,tape,-.08,.365,.007,note).rotation.z=.04;

  // A proper low-profile keyboard: staggered rows, separate navigation cluster,
  // recessed deck, concave-looking caps and sparse, readable physical legends.
  const keyboard=new THREE.Group();scene.add(keyboard);keyboard.position.set(-.32,1.35,1.23);keyboard.rotation.y=-.025;
  flat(2.84,.96,.11,.075,edge,0,0,0,keyboard);flat(2.72,.86,.018,.05,graphite,0,.065,0,keyboard);
  const legend=canvasTexture(1024,384,(c,w,h) => {
    c.fillStyle='#c1c5bb';c.font='21px sans-serif';c.textAlign='center';
    const rows=['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
    rows.forEach((row,r)=>[...row].forEach((key,i)=>c.fillText(key,62+i*58+r*12,72+r*69)));
    c.font='12px sans-serif';c.fillText('esc',32,24);c.fillText('enter',723,213);c.fillText('shift',42,282);
  });
  for(let row=0;row<5;row++) for(let col=0;col<12;col++) {
    if(row===4 && col>1 && col<9)continue;
    const x=-1.24+col*.173+(row>0&&row<4?row*.018:0);
    flat(.147,.133,.043,.016,keymat,x,.103,-.31+row*.158,keyboard);
  }
  flat(1.19,.133,.043,.017,keymat,-.36,.103,.322,keyboard);
  flat(.27,.133,.043,.016,keymat,.79,.103,.164,keyboard);
  for(let row=0;row<5;row++)for(let col=0;col<3;col++)flat(.145,.133,.043,.016,keymat,.96+col*.166,.103,-.31+row*.158,keyboard);
  const legendsMat=material('#ffffff',.8);legendsMat.map=legend;legendsMat.transparent=true;legendsMat.depthWrite=false;
  const legends=mesh(new THREE.PlaneGeometry(2.68,.87),legendsMat,0,.135,0,keyboard);legends.rotation.x=-Math.PI/2;legends.castShadow=false;
  contact(3.1,1.1,-.32,1.23,1.29);
  // A domed optical mouse with a split shell and a rubber wheel.
  contact(.9,.94,1.77,1.35,1.29);
  const mouse=new THREE.Group();scene.add(mouse);mouse.position.set(1.77,1.29,1.35);mouse.rotation.y=-.13;
  const mouseBody=mesh(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2),graphite,0,0,0,mouse);mouseBody.scale.set(.26,.19,.37);
  tube([[0,.186,-.04],[0,.16,-.22],[0,.075,-.34]],.006,edge,mouse,12);
  rod([0,.18,-.16],[0,.18,-.07],.025,edge,mouse);
  tube([[1.78,1.34,1.01],[1.9,1.29,.7],[2.16,1.29,.34],[1.94,1.28,-.23],[1.5,1.28,-1.2]],.012,edge);

  // A pool of task light, a half-used notebook and a pencil provide human scale.
  const notebook=new THREE.Group();scene.add(notebook);notebook.position.set(-2.65,1.317,1.04);notebook.rotation.y=-.12;
  flat(.99,1.18,.065,.035,material('#6b7772',.85),0,.005,0,notebook);
  flat(.93,1.12,.028,.012,paper,.018,.054,-.008,notebook);
  const pageTexture=canvasTexture(512,640,(c,w,h) => {
    c.fillStyle='#d7d2bc';c.fillRect(0,0,w,h);c.strokeStyle='rgba(83,103,105,.23)';c.lineWidth=1;
    for(let y=108;y<610;y+=37){c.beginPath();c.moveTo(54,y);c.lineTo(476,y);c.stroke();}
    c.strokeStyle='rgba(153,77,65,.25)';c.beginPath();c.moveTo(68,25);c.lineTo(68,620);c.stroke();
    c.fillStyle='#526166';c.font='25px sans-serif';c.fillText('Opportunity',91,67);
    // A small sketch, rather than fabricated mission readings or dialogue.
    c.strokeStyle='#6e7972';c.lineWidth=2;c.beginPath();c.moveTo(153,205);c.lineTo(302,218);c.lineTo(352,262);c.lineTo(201,249);c.closePath();c.stroke();
    for(const x of [211,268,324]){c.beginPath();c.ellipse(x,284,14,19,0,0,7);c.stroke();}
    c.beginPath();c.moveTo(273,228);c.lineTo(277,151);c.lineTo(300,155);c.lineTo(302,171);c.lineTo(267,167);c.stroke();
  });
  surface(.91,1.1,pageTexture,.018,.078,-.008,'#ffffff',notebook).rotation.x=-Math.PI/2;
  for(let i=0;i<9;i++) {const ring=mesh(new THREE.TorusGeometry(.036,.007,5,12),silver,-.44,.066,-.46+i*.116,notebook);ring.rotation.y=Math.PI/2;}
  rod([-.28,.11,.44],[-.11,.11,-.36],.018,material('#8e6845',.6),notebook);
  rod([-.11,.11,-.36],[-.095,.11,-.44],.013,graphite,notebook);
  contact(1.5,1.5,-2.65,1.04);
  const lampPaint=material('#46565a',.39,.5);
  mesh(new THREE.CylinderGeometry(.28,.32,.075,32),lampPaint,-3.34,1.32,-.14);
  rod([-3.34,1.36,-.14],[-3.49,2.03,-.3],.045,lampPaint);
  rod([-3.49,2.03,-.3],[-2.98,2.84,-.16],.038,lampPaint);
  rod([-3.42,2.02,-.3],[-2.91,2.83,-.16],.017,silver);
  for(const p of [[-3.49,2.03,-.3],[-2.96,2.84,-.16]])mesh(new THREE.SphereGeometry(.075,12,8),edge,...p);
  // One local assembly keeps the recessed light concentric with the tilted
  // shade. A closed wall profile provides a real inner surface and metal lip.
  const lampHead=new THREE.Group();scene.add(lampHead);
  lampHead.position.set(-2.92,2.71,-.07);lampHead.rotation.set(-.48,0,-.18);
  const shadeProfile=[[.30,-.13],[.12,.13],[.10,.13],[.28,-.13],[.30,-.13]]
    .map(([radius,height])=>new THREE.Vector2(radius,height));
  mesh(new THREE.LatheGeometry(shadeProfile,48),lampPaint,0,0,0,lampHead);
  const diffuser=mesh(new THREE.CircleGeometry(.272,48),emissive('#f6d3a1',1.1),0,-.119,0,lampHead);
  diffuser.rotation.x=Math.PI/2;diffuser.castShadow=false;
  tube([[-3.34,1.34,-.14],[-3.65,1.28,-.4],[-3.8,1.27,-.9],[-3.6,1.1,-1.3]],.016,edge);

  // Ceramic cup and a single-ear communications headset, quietly set aside.
  const mug=material('#bec4b9',.36),coffee=material('#241d18',.26);
  mesh(new THREE.CylinderGeometry(.22,.19,.36,32,1,true),mug,3.31,1.47,.15);
  const rim=mesh(new THREE.TorusGeometry(.216,.014,8,32),mug,3.31,1.653,.15);rim.rotation.x=Math.PI/2;
  mesh(new THREE.CircleGeometry(.202,32),coffee,3.31,1.61,.15).rotation.x=-Math.PI/2;
  const handle=mesh(new THREE.TorusGeometry(.12,.033,8,20),mug,3.54,1.48,.15);handle.scale.set(.8,1,1);
  flat(.58,.58,.02,.19,material('#645847',.96),3.31,1.283,.15);contact(.85,.85,3.31,.15);
  const headset=new THREE.Group();scene.add(headset);headset.position.set(3.13,1.298,1.17);headset.rotation.y=.24;
  const band=mesh(new THREE.TorusGeometry(.31,.023,7,32,Math.PI*1.5),silver,0,.04,0,headset);band.rotation.x=Math.PI/2;
  const padding=mesh(new THREE.TorusGeometry(.32,.045,8,22,Math.PI*.8),edge,0,.04,0,headset);padding.rotation.x=Math.PI/2;
  flat(.2,.28,.12,.07,fabric,-.27,.06,.14,headset);flat(.13,.22,.08,.05,graphite,.25,.04,.16,headset);
  tube([[-.27,.05,.16],[-.32,.05,.35],[-.1,.04,.44],[.08,.04,.41]],.013,silver,headset,16);
  flat(.12,.054,.045,.02,edge,.08,.04,.41,headset);
  tube([[3.12,1.3,1.23],[3.6,1.29,1.5],[3.9,1.29,1.12],[3.78,1.28,.75],[3.9,1.2,-.7]],.013,edge);
  contact(1.15,1,3.13,1.17);

  // Secondary stations recede; their dark screens do not compete with the rover.
  for(const [x,z,angle] of [[-5.9,-3.6,.12],[5.8,-4.2,-.17]]) {
    const station=new THREE.Group();scene.add(station);station.position.set(x,0,z);station.rotation.y=angle;
    flat(3.9,1.9,.14,.12,desk,0,1.12,0,station);
    for(const sx of [-1.5,1.5])box(.13,1.1,1.4,graphite,sx,.55,0,station);
    flat(.65,.5,.05,.04,edge,0,1.24,-.3,station);box(.1,.6,.16,silver,0,1.5,-.3,station);
    rounded(2.35,1.4,.16,.08,graphite,0,2.17,-.3,station);
    rounded(2.12,1.18,.025,.04,material('#152932',.22,.3),0,2.19,-.195,station);
    box(1.86,.012,.008,material('#40555e',.5),0,2.72,-.176,station);
    flat(1.25,.42,.055,.04,edge,0,1.25,.45,station);
    const chair=new THREE.Group();station.add(chair);chair.position.set(.6,0,1.4);chair.rotation.y=-.35;
    rounded(1.06,1.13,.19,.22,fabric,0,1.12,0,chair);rounded(.86,.88,.025,.15,wallInset,0,1.14,.112,chair);
    flat(1.08,.95,.16,.17,fabric,0,.62,.31,chair);rod([0,.14,.25],[0,.58,.25],.055,silver,chair);
    for(const sx of [-.6,.6]){rod([sx,.6,.27],[sx,1,.27],.035,edge,chair);flat(.12,.6,.065,.045,graphite,sx,1,.27,chair);}
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod([0,.13,.25],[Math.cos(a)*.58,.08,.25+Math.sin(a)*.58],.035,graphite,chair);}
  }
  scene.add(new THREE.HemisphereLight('#a8c6d0','#24251f',.9));
  const area=(color,intensity,x,y,z,tx,ty,tz,angle=.8) => {
    const light=new THREE.SpotLight(color,intensity,25,angle,.65,1.3);light.position.set(x,y,z);light.target.position.set(tx,ty,tz);scene.add(light,light.target);return light;
  };
  const keyLight=area('#d5e1df',42,-2,6,3,0,1,0);
  keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.bias=-.0002;keyLight.shadow.normalBias=.012;keyLight.shadow.camera.near=.5;keyLight.shadow.camera.far=22;
  area('#8cb8cc',58,6,5,-3,0,2,0);
  area('#d1b681',34,-5,5,-3,-5.7,4.1,-7,.65);
  area('#90b4c0',34,3,5,-4,5,3,-7);
  const taskLight=area('#ffd49a',16,-2.89,2.56,-.07,-2.65,1.2,1.1,.91);
  taskLight.distance=5;taskLight.decay=1.6;
  area('#9cb7bc',18,-4,5,-3,-6.9,3.9,-7,1.05);
  const screenGlow=new THREE.PointLight('#c59b73',5,5,2);screenGlow.position.set(0,2.8,.2);scene.add(screenGlow);
  // The original game's DOM instrument is projected into this physical glass.
  // Keep the lower edge inset and reserve the right glass margin for the Oppy note.
  function getSignalQuad() {
    screen.updateWorldMatrix(true,false);
    return [[-2.375,-.285],[2.1,-.285],[2.1,-1.335],[-2.375,-1.335]]
      .map(([x,y])=>screen.localToWorld(new THREE.Vector3(x,y,.016)));
  }
  function setSignal() {} // Compatibility: animation remains the original DOM.
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
  return {scene,camera,screen,resize,setSignal,getSignalQuad,update(time) { screenGlow.intensity=5+Math.sin(time*.17)*.035; },dispose() { for(const g of owned)g.dispose(); for(const m of materials)m.dispose(); for(const t of textures)t.dispose(); scene.clear(); }};
}
