import * as THREE from 'three';
import {buildValley,valleyProfile} from './mission-valley-model.js';

// Authored teaching reconstructions, never survey geometry or NASA image planes.
// Each set uses physical relief, individual fragments and mission-image framing.
const profiles = {
  'stone-ripples': {eye:{x:0,y:5.8,z:7},target:{x:0,y:.15,z:0},fov:28,aspect:447/333,yawLimit:.13,pitchLimit:.10},
  blueberries: {eye:{x:0,y:7.5,z:.5},target:{x:0,y:0,z:0},fov:47,aspect:768/512,yawLimit:.10,pitchLimit:.08},
  'first-morning': {eye:{x:0,y:1.7,z:4},target:{x:0,y:0,z:-5},fov:48,aspect:1,yawLimit:.14,pitchLimit:.10},
  'ordinary-day': valleyProfile,
  'last-image': {eye:{x:0,y:0,z:0},target:{x:0,y:.3,z:-10},fov:48,aspect:1,missingDataFraction:.25,yawLimit:.08,pitchLimit:.06},
};
const palette = {sand:0x707775,stone:0x999b96,ochre:0xac7650,dark:0x4a423a};
function rng(seed=17){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

export function createMissionPhotoScene() {
  const scene=new THREE.Scene(),sets=new Map();let active=null;
  const materials=new Set(),geometries=new Set(),textures=new Set();let detailTexture=null,weatherTexture=null,rockNormal=null,rockRoughness=null,disposed=false;const rockMaterials=new Set();
  const mat=(color,extra={})=>{detailTexture ||= surfaceTexture(47);const material=new THREE.MeshStandardMaterial({color,roughness:1,map:detailTexture,bumpMap:detailTexture,bumpScale:.035,...extra});materials.add(material);return material;};
  const mesh=(geometry,material,parent)=>{geometries.add(geometry);const object=new THREE.Mesh(geometry,material);object.receiveShadow=true;object.castShadow=true;parent.add(object);return object;};
  const hemi=new THREE.HemisphereLight(0xf2e5cc,0x484137,2.1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe9cc,3.0);sun.position.set(-5,8,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:45});sun.shadow.bias=-.0003;sun.shadow.normalBias=.015;scene.add(sun);
  function ground(parent,color,size=18,roughness=.035,seed=2){
    const random=rng(seed),geometry=new THREE.PlaneGeometry(size,size,60,60);geometry.rotateX(-Math.PI/2);
    const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,(random()-.5)*roughness);p.needsUpdate=true;geometry.computeVertexNormals();return mesh(geometry,mat(color),parent);
  }
  function grains(parent,{count=500,extent=7,radius=.025,color=palette.dark,seed=19,y=.03,exclude=null}={}){
    const random=rng(seed),geometry=new THREE.IcosahedronGeometry(1,1),material=mat(color),objects=new THREE.InstancedMesh(geometry,material,count),dummy=new THREE.Object3D();geometries.add(geometry);objects.castShadow=true;objects.receiveShadow=true;let actual=0;
    for(let i=0;i<count;i++){const x=(random()-.5)*extent,z=(random()-.5)*extent;if(exclude?.(x,z))continue;const r=radius*(.55+random()*.9);dummy.position.set(x,y+r*.65,z);dummy.scale.set(r,r*(.6+random()*.4),r);dummy.rotation.set(random(),random()*6,random());dummy.updateMatrix();objects.setMatrixAt(actual++,dummy.matrix);}objects.count=actual;parent.add(objects);
  }
  function rockSurface(material){
    if(!weatherTexture){
      const size=256,random=rng(414),data=new Uint8Array(size*size*4);
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const broad=Math.sin(x*.045+Math.sin(y*.032)*1.8)*.5+Math.cos(y*.055+x*.019)*.3;
        const medium=Math.sin(x*.21+Math.cos(y*.17)*3)*Math.sin(y*.19)*.22;
        const value=THREE.MathUtils.clamp(174+54*broad+34*medium+(random()-.5)*37,65,235),i=(y*size+x)*4;
        data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
      }
      weatherTexture=new THREE.DataTexture(data,size,size);weatherTexture.wrapS=weatherTexture.wrapT=THREE.RepeatWrapping;weatherTexture.repeat.set(1.25,1.25);weatherTexture.magFilter=THREE.LinearFilter;weatherTexture.minFilter=THREE.LinearMipmapLinearFilter;weatherTexture.generateMipmaps=true;weatherTexture.needsUpdate=true;textures.add(weatherTexture);
      // Browser-only async CC0 surface detail. Procedural relief remains usable
      // offline and in pure-Three Node geometry tests; no image is a scene plane.
      if(typeof document!=='undefined'){
        const loader=new THREE.TextureLoader();
        for(const [field,file] of [['normalMap','normal.jpg'],['roughnessMap','roughness.jpg']]){
          const texture=loader.load(new URL(`../../public/textures/rock/${file}`,import.meta.url).href,loaded=>{
            if(disposed){loaded.dispose();return;}
            loaded.wrapS=loaded.wrapT=THREE.RepeatWrapping;loaded.repeat.set(1.35,1.35);
            for(const rock of rockMaterials){rock[field]=loaded;rock.normalScale.set(.75,.75);rock.needsUpdate=true;}
          },undefined,()=>{});textures.add(texture);
          if(field==='normalMap')rockNormal=texture;else rockRoughness=texture;
        }
      }
    }
    rockMaterials.add(material);material.map=weatherTexture;material.bumpMap=weatherTexture;material.bumpScale=.065;material.normalMap=rockNormal;material.roughnessMap=rockRoughness;material.normalScale.set(.75,.75);material.needsUpdate=true;return material;
  }
  function slab(parent,points,height,color,{x=0,z=0,y=0,seed=3,bands=1,rounded=false}={}){
    if(rounded){const curve=new THREE.CatmullRomCurve3(points.map(([px,pz])=>new THREE.Vector3(px,0,pz)),true,'catmullrom',.25);points=curve.getPoints(points.length*5).slice(0,-1).map(p=>[p.x,p.z]);}
    const random=rng(seed),vertices=[],indices=[],colors=[];const n=points.length,base=new THREE.Color(color);
    for(let j=0;j<=bands;j++){
      const t=j/bands,shrink=1-.12*t+(bands>2?(j%2?-.025:.012):0);
      for(let i=0;i<n;i++){const [px,pz]=points[i];vertices.push(px*shrink+x,y+height*t+(random()-.5)*height*.09,pz*shrink+z);const tint=base.clone().multiplyScalar(j%2?.72:.98);colors.push(tint.r,tint.g,tint.b);}
    }
    for(let j=0;j<bands;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;indices.push(a,c,b,b,c,d);}
    const center=vertices.length/3;vertices.push(points.reduce((s,p)=>s+p[0],0)/n+x,y+height*1.06,points.reduce((s,p)=>s+p[1],0)/n+z);colors.push(base.r,base.g,base.b);
    for(let i=0;i<n;i++)indices.push(center,bands*n+(i+1)%n,bands*n+i);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((v,i)=>i%3===0?[v*.7,vertices[i+2]*.7]:[]),2));geometry.computeVertexNormals();return mesh(geometry,rockSurface(mat(0xffffff,{vertexColors:true,side:THREE.DoubleSide})),parent);
  }
  function crack(parent,points,width=.012,color=0x594737,jitter=0){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z,y=.19],i)=>new THREE.Vector3(x+Math.sin(i*7.3)*jitter,y,z+Math.cos(i*5.9)*jitter)));return mesh(new THREE.TubeGeometry(curve,points.length*4,width,3,false),mat(color),parent);
  }
  function lastChance(group){
    ground(group,palette.sand,18,.025);const outline=[[-1.75,-.32],[-1.5,-.68],[-.75,-.83],[.1,-.76],[.85,-.43],[1.36,.18],[1.45,.48],[.8,.57],[-.35,.61],[-1.45,.5],[-1.8,.12]];
    slab(group,outline,.56,palette.stone,{x:-.5,z:0,bands:8,seed:5,rounded:true});
    // Low crossing ribbons follow the wedge rather than floating above it.
    for(let i=0;i<7;i++)crack(group,[[-2.18,.12+i*.052,.13+i*.052],[-1.2,.22+i*.048,.13+i*.05],[-.3,.32+i*.035,.12+i*.045],[.87,.45,.09+i*.035]],.018,i%2?0x626867:0xa5aaa7);
    slab(group,[[-1.3,-.6],[1.3,-.65],[1.5,.3],[.8,.55],[-1.15,.45]],.65,0x999b96,{x:2.65,z:-2.3,bands:7,seed:7,rounded:true});
    slab(group,[[-1.3,-.18],[.8,-.23],[1.3,.02],[.5,.22],[-1,.19]],.10,0x858d8d,{x:-.15,z:1.45,bands:2});
    slab(group,[[-.7,-.3],[.55,-.18],[.7,.23],[-.3,.4]],.09,0x858c8c,{x:-1,z:2.7});
    grains(group,{count:420,extent:11,radius:.025,color:0x65675d,exclude:(x,z)=>x>-2.3&&x<1&&Math.abs(z)<.8});
  }
  function berryBowl(group){
    ground(group,0x715542,14,.025);const camera=new THREE.PerspectiveCamera(47,768/512,.01,120);camera.position.set(0,7.5,.5);camera.lookAt(0,0,0);camera.updateMatrixWorld();const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();const uvPoint=([u,v])=>{ray.setFromCamera(new THREE.Vector2(u*2-1,1-v*2),camera);ray.ray.intersectPlane(plane,hit);return[hit.x,hit.z];};const p=[[.27,.22],[.4,.15],[.61,.20],[.71,.14],[.83,.27],[.85,.48],[.99,.70],[1.06,1.04],[.26,1.04],[.17,.78],[.19,.60],[.26,.4]].map(uvPoint);
    slab(group,p,.18,palette.ochre,{bands:2});
    const circle=new THREE.CircleGeometry(.57,64);circle.rotateX(-Math.PI/2);const patch=mesh(circle,mat(0xbd8e70),group);patch.position.set(-.50,.194,0);
    // Fine relief in the brushed contact patch, with its darker center preserved.
    const random=rng(71),patchGeometry=new THREE.IcosahedronGeometry(1,0),patchGrains=new THREE.InstancedMesh(patchGeometry,mat(0xffffff),80),dummy=new THREE.Object3D();geometries.add(patchGeometry);for(let i=0;i<80;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.54;dummy.position.set(-.50+Math.cos(a)*r,.205,Math.sin(a)*r);dummy.scale.setScalar(.009+random()*.013);dummy.updateMatrix();patchGrains.setMatrixAt(i,dummy.matrix);patchGrains.setColorAt(i,new THREE.Color(i%2?0xa87b5f:0xc49878));}group.add(patchGrains);
    for(const points of [[[-2.2,-1.7],[-1,-1.9],[-.5,-1.25],[.6,-1.45],[1.4,-1.8]],[[.6,-1.45],[.85,-.35],[1.2,.5],[1.05,2.5]],[[-1,-1.9],[-1.55,-.3],[-1.65,1],[-1.1,2.35]],[[-1.65,1],[-.7,1.5],[.2,1.6],[1.05,2.5]],[[1.2,.5],[2.4,.95]]])crack(group,points,.006,0x89654c,.035);
    slab(group,[[-.7,-.5],[.6,-.55],[.9,.15],[.5,.5],[-.4,.4]],.24,0xb78157,{x:3.1,z:-2.2});
    slab(group,[[-.45,-.6],[.35,-.45],[.5,.5],[-.15,.6]],.28,0xb47b52,{x:3.1,z:.2});
    grains(group,{count:1150,extent:9.0,radius:.032,color:0x45423d,y:.19,seed:21,exclude:(x,z)=>Math.hypot(x+.50,z)<.62 || (x<.3 && x>-2.8 && z>-.9 && z<1.5 && Math.sin(x*39+z*73)>.0)});
    const grainCluster=new THREE.Group();grainCluster.position.set(1.05,0,0);grainCluster.scale.set(.72,1,1);group.add(grainCluster);
    grains(grainCluster,{count:120,extent:1.8,radius:.042,color:0x484641,y:.19,seed:227,exclude:(x,z)=>Math.hypot(x*.72+1.55,z)<.65});
    // Rover deck intrudes only at the photograph's lower edge.
    const deck=mesh(new THREE.BoxGeometry(9,.07,.28),mat(0x494b47),group);deck.position.set(0,.30,3.02);
  }
  function surfaceTexture(seed=90){
    const size=256,random=rng(seed),data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const n=random(),low=Math.sin(x*.17+Math.sin(y*.11)*2)*.04+Math.sin(y*.23)*.025;
      const value=Math.max(0,Math.min(255,Math.round(150+(n-.5)*110+low*255)));const i=(y*size+x)*4;
      data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
    }
    const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;textures.add(texture);return texture;
  }
  function firstMorning(group){
    const texture=surfaceTexture(90),soil=mat(0x727272,{map:texture,bumpMap:texture,bumpScale:.065});
    const terrain=new THREE.PlaneGeometry(90,58,120,100);terrain.rotateX(-Math.PI/2);terrain.translate(0,0,-19);
    const p=terrain.attributes.position,random=rng(31);
    // A continuous bowl surface rises into the rim; there is no separate strip.
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),t=THREE.MathUtils.smoothstep(-z,10,39);
      p.setY(i,t*(1.1-x*.025)+(random()-.5)*.022);
    }
    p.needsUpdate=true;terrain.computeVertexNormals();mesh(terrain,soil,group);
    const camera=new THREE.PerspectiveCamera(profiles['first-morning'].fov,1,.01,120);camera.position.set(0,1.7,4);camera.lookAt(0,0,-5);camera.updateMatrixWorld();
    const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
    const project=([u,v])=>{ray.setFromCamera(new THREE.Vector2(u*2-1,1-v*2),camera);ray.ray.intersectPlane(plane,hit);return [hit.x,hit.z];};
    // Outlines follow the actual first-sol bedrock groups, then become relief.
    const outlines=[
      [[.44,.48],[.52,.47],[.56,.49],[.51,.51],[.45,.50]],
      [[.54,.49],[.66,.48],[.76,.50],[.73,.52],[.59,.52]],
      [[.78,.47],[.85,.46],[.88,.49],[.85,.51],[.78,.50]],
      [[.79,.51],[.86,.50],[.89,.54],[.83,.55],[.78,.54]],
      [[.90,.49],[.95,.49],[.98,.51],[.96,.54],[.90,.52]],
      [[.94,.54],[.99,.52],[1,.58],[.96,.60],[.92,.58]],
      [[.31,.52],[.36,.52],[.38,.54],[.33,.55]],
      [[.25,.56],[.34,.55],[.38,.58],[.35,.60],[.27,.59]],
      [[.36,.56],[.44,.55],[.50,.58],[.48,.60],[.39,.59]],
      [[.48,.56],[.56,.54],[.63,.56],[.59,.59],[.51,.59]],
      [[.59,.57],[.68,.56],[.75,.58],[.72,.61],[.63,.61]],
      [[.77,.57],[.83,.56],[.88,.59],[.85,.61],[.78,.60]],
      [[.88,.60],[.98,.59],[1,.64],[.95,.65],[.90,.63]],
      [[.36,.61],[.44,.60],[.50,.63],[.46,.65],[.37,.64]],
      [[.48,.61],[.55,.60],[.62,.63],[.58,.65],[.50,.65]],
      [[.62,.62],[.71,.60],[.77,.63],[.73,.66],[.65,.65]],
      [[.74,.65],[.84,.63],[.90,.66],[.87,.69],[.77,.68]],
      [[.82,.70],[.93,.68],[1,.72],[.99,.75],[.88,.74]],
      [[.45,.67],[.51,.66],[.55,.68],[.53,.70],[.47,.70]],
      [[.53,.72],[.58,.71],[.63,.74],[.60,.77],[.55,.75]],
      [[.64,.76],[.75,.75],[.83,.80],[.80,.82],[.71,.81]],
      [[.77,.81],[.87,.79],[.95,.84],[.91,.86],[.82,.85]],
      [[.91,.76],[.98,.76],[1,.79],[1,.83],[.94,.81]],
    ];
    
    outlines.forEach((outline,i)=>{
      const points=outline.map(project),object=slab(group,points,.018+(i%4)*.009,0xaaaaaa,{bands:2,seed:i+90});
      // World-space mapping gives real microrelief rather than image projection.
      const position=object.geometry.attributes.position,uv=[];for(let j=0;j<position.count;j++)uv.push(position.getX(j)*1.7,position.getZ(j)*1.7);
      object.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));object.material.needsUpdate=true;
    });
    grains(group,{count:2400,extent:35,radius:.012,color:0x404040});
  }
  function dustSky(group){
    // An opaque dust sky, not a field of stars. Pixel loss is a sensor effect
    // implemented by the renderer through profile.missingDataFraction.
    const geometry=new THREE.SphereGeometry(45,32,20);
    const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vDirection; float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} void main(){float n=noise(gl_FragCoord.xy); float dust=.075+.045*(1.0-normalize(vDirection).y);float sensor=pow(n,10.0)*.24;gl_FragColor=vec4(vec3(dust+sensor),1.0);}'});materials.add(material);mesh(geometry,material,group);
  }
  function setScene(id){
    if(!profiles[id])return null;if(active)active.visible=false;
    if(!sets.has(id)){const group=new THREE.Group();group.name=`mission-photo-${id}`;sets.set(id,group);scene.add(group);if(id==='stone-ripples')lastChance(group);else if(id==='blueberries')berryBowl(group);else if(id==='last-image')dustSky(group);else if(id==='first-morning')firstMorning(group);else buildValley(group,{mesh,mat});}
    active=sets.get(id);active.visible=true;scene.background=new THREE.Color(id==='last-image'?0x111111:id==='blueberries'?0x715542:id==='stone-ripples'?0x77786d:0xffffff);const grayscale=['first-morning','ordinary-day','last-image','stone-ripples'].includes(id);hemi.color.set(grayscale?0xffffff:0xf2e5cc);hemi.groundColor.set(grayscale?0x444444:0x484137);sun.color.set(grayscale?0xffffff:0xffe9cc);hemi.intensity=id==='last-image'?0:2.1;sun.intensity=id==='last-image'?0:3;return {...profiles[id],exposure:1.15,near:.01,far:120};
  }
  function dispose(){disposed=true;for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();scene.clear();sets.clear();active=null;}
  return {scene,setScene,dispose};
}
