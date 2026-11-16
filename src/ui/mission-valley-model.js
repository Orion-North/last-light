import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Relief reconstruction composed from the published valley observation.
// Screen coordinates guide modeling only; no mission photograph is textured here.
export const valleyProfile={eye:{x:0,y:2.4,z:4},target:{x:0,y:.1,z:-3},fov:60,aspect:1,yawLimit:.10,pitchLimit:.08,exposure:1.15};

export function buildValley(group,{mesh,mat}) {
  let seed=4761;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const camera=new THREE.PerspectiveCamera(valleyProfile.fov,1,.01,120);
  camera.position.set(0,2.4,4);camera.lookAt(0,.1,-3);camera.updateMatrixWorld();
  const ray=new THREE.Raycaster(),soilPlane=new THREE.Plane(new THREE.Vector3(0,1,.45).normalize(),0);
  const deckPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.05);
  const project=(u,v,plane=soilPlane,lift=0)=>{
    ray.setFromCamera(new THREE.Vector2(u*2-1,1-v*2),camera);
    const point=ray.ray.intersectPlane(plane,new THREE.Vector3());
    if(!point)throw new Error('Valley composition ray misses surface');
    point.y+=lift;return point;
  };
  const surface=(points,material,parent=group)=>{
    const geometry=new THREE.BufferGeometry(),positions=points.flatMap(p=>[p.x,p.y,p.z]);
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(points.flatMap(p=>[p.x*.6,p.z*.6]),2));
    geometry.setIndex(points.length===4?[0,2,1,0,3,2]:[0,2,1]);geometry.computeVertexNormals();
    return mesh(geometry,material,parent);
  };
  // A continuous uphill sheet has a tilted far boundary: only a tiny white
  // wedge remains at upper left. Fine relief and per-vertex tones break its plane.
  const n=100,vertices=[],uv=[],colors=[],indices=[];
  for(let row=0;row<=n;row++)for(let col=0;col<=n;col++){
    const u=col/n,top=.075-u*.225,v=top+(1.12-top)*row/n;
    const p=project(u,v);const relief=(random()-.5)*.025+Math.sin(p.x*3.7+p.z*2)*.009;
    p.y+=relief;vertices.push(p.x,p.y,p.z);uv.push(p.x*.65,p.z*.65);
    const tone=.72+random()*.36;colors.push(tone,tone,tone);
    if(row<n&&col<n){const a=row*(n+1)+col;indices.push(a,a+n+2,a+1,a,a+n+1,a+n+2);}
  }
  const terrain=new THREE.BufferGeometry();terrain.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));terrain.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();
  mesh(terrain,mat(0x505050,{vertexColors:true,side:THREE.DoubleSide,bumpScale:.07}),group);

  // Thousands of irregular pebbles remain real geometry and cast small shadows.
  const holder=mesh(new THREE.IcosahedronGeometry(1,0),mat(0x656565,{bumpScale:.025}),group);group.remove(holder);
  const stones=new THREE.InstancedMesh(holder.geometry,holder.material,3000),dummy=new THREE.Object3D();
  for(let i=0;i<stones.count;i++){
    const u=random()*1.14-.07,v=.025+random()*.96,p=project(u,v);
    const scale=.009+Math.pow(random(),4)*.11;
    dummy.position.copy(p);dummy.position.y+=scale*.23;dummy.scale.set(scale*(.8+random()),scale*.45,scale*(.7+random()));dummy.rotation.set(random(),random()*6.28,random());dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
    stones.setColorAt(i,new THREE.Color().setScalar(.65+random()*.65));
  }
  stones.castShadow=stones.receiveShadow=true;group.add(stones);

  // Impression fragments vary in width, depth and spacing; no continuous rails.
  const rutMaterial=mat(0x484848,{bumpScale:.025,side:THREE.DoubleSide}),ribMaterial=mat(0x5a5a5a,{bumpScale:.045,side:THREE.DoubleSide});
  const paths=[[[.10,.77],[.13,.57],[.23,.39],[.25,.18]],[[.64,.51],[.54,.40],[.43,.29],[.35,.15]]];
  for(const path of paths){
    const curve=new THREE.CatmullRomCurve3(path.map(([u,v])=>new THREE.Vector3(u,v,0)));
    for(let i=0;i<95;i++){
      if(random()<.21)continue;
      const t=i/95,p=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector2(-tangent.y,tangent.x).normalize();
      const half=(.014+(1-t)*.018)*(.7+random()*.5),thickness=.0017+random()*.0028;
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>project(p.x+normal.x*half*a+tangent.x*thickness*b,p.y+normal.y*half*a+tangent.y*thickness*b,soilPlane,.007));
      surface(corners,i%4===0?rutMaterial:ribMaterial);
    }
  }

  // Perspective trapezoid, physically horizontal at the mast's foreground.
  const deckMaterial=mat(0x898989,{metalness:.18,roughness:.78,map:null,bumpMap:null,side:THREE.DoubleSide});
  const cellMaterial=mat(0x777777,{metalness:.22,roughness:.68,map:null,bumpMap:null,side:THREE.DoubleSide});
  const panelPoint=(s,t,lift=0)=>project(.22+(.82-.22)*s+(-.32+.60*s)*t,.70+.39*t,deckPlane,lift);
  surface([panelPoint(0,0),panelPoint(1,0),panelPoint(1,1),panelPoint(0,1)],deckMaterial);
  for(let row=0;row<9;row++)for(let col=0;col<10;col++){
    const s0=(col+.045)/10,s1=(col+.955)/10,t0=(row+.055)/9,t1=(row+.945)/9;
    surface([panelPoint(s0,t0,.004),panelPoint(s1,t0,.004),panelPoint(s1,t1,.004),panelPoint(s0,t1,.004)],cellMaterial);
  }
  const hardware=mat(0x777777,{map:null,bumpMap:null,metalness:.55,roughness:.5});
  for(const [u,v] of [[.23,.735],[.79,.715]]){
    const position=project(u,v,deckPlane,.04);
    const hinge=mesh(new THREE.CylinderGeometry(.055,.055,.30,14),hardware,group);hinge.rotation.z=Math.PI/2;hinge.position.copy(position);
    for(const offset of [-.13,.13]){
      const bracket=mesh(new THREE.BoxGeometry(.055,.18,.10),hardware,group);bracket.position.copy(position).add(new THREE.Vector3(offset,.015,0));
    }
  }
  const calibration=project(.395,.72,deckPlane,.025);
  const plate=mesh(new THREE.BoxGeometry(.30,.025,.26),mat(0xb7b7b7,{map:null,bumpMap:null,metalness:.2}),group);plate.position.copy(calibration);
  const post=mesh(new THREE.CylinderGeometry(.024,.047,.22,12),mat(0x414141,{map:null,bumpMap:null}),group);post.position.copy(calibration).add(new THREE.Vector3(0,.12,0));
  const cap=mesh(new THREE.CylinderGeometry(.046,.046,.018,14),hardware,group);cap.position.copy(calibration).add(new THREE.Vector3(0,.235,0));
  // Static contact fragments and panel cells share batches rather than costing
  // one draw call apiece. Their relief stays in the merged vertex positions.
  for(const material of [rutMaterial,ribMaterial,cellMaterial,hardware]) {
    const objects=group.children.filter(object=>object.isMesh && !object.isInstancedMesh && object.material===material);
    if(objects.length<2)continue;
    const baked=objects.map(object=>{object.updateMatrix();return object.geometry.clone().applyMatrix4(object.matrix);});
    const geometry=mergeGeometries(baked,false);baked.forEach(item=>item.dispose());
    if(geometry){objects.forEach(object=>group.remove(object));mesh(geometry,material,group);}
  }

}
