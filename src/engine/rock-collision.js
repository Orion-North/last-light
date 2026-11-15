// Convex outlines remove the empty corners of axis-aligned bounding boxes.
export function convexHull(points) {
  const sorted=points.map(p=>({x:p.x,z:p.z})).sort((a,b)=>a.x-b.x||a.z-b.z);
  const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
  const half=list=>{const out=[];for(const p of list){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=1e-9)out.pop();out.push(p);}return out;};
  return [...half(sorted).slice(0,-1),...half(sorted.reverse()).slice(0,-1)];
}
// Imported material groups can contain disconnected wheels and hardware. Keep
// those islands separate instead of filling the empty space between them.
export function componentHulls(points,indices) {
  const parent=Int32Array.from(points,(_,i)=>i),weld=new Map();
  const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const join=(a,b)=>{parent[root(a)]=root(b);};
  points.forEach((p,i)=>{const key=[p.x,p.y,p.z].map(v=>Math.round(v*10000)).join(',');if(weld.has(key))join(i,weld.get(key));else weld.set(key,i);});
  const at=i=>indices?indices[i]:i,count=indices?.length??points.length;
  for(let i=0;i+2<count;i+=3){join(at(i),at(i+1));join(at(i),at(i+2));}
  const groups=new Map();points.forEach((p,i)=>{const key=root(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);});
  return [...groups.values()].map(group=>({hull:convexHull(group),minY:Math.min(...group.map(p=>p.y))-.02,maxY:Math.max(...group.map(p=>p.y))+.02})).filter(part=>part.hull.length>=3);
}
const rectangle=(x0,x1,z0,z1)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}];
function overlaps(a,b) {
  for(const shape of [a,b])for(let i=0;i<shape.length;i++){
    const p=shape[i],q=shape[(i+1)%shape.length],nx=q.z-p.z,nz=p.x-q.x;
    let a0=Infinity,a1=-Infinity,b0=Infinity,b1=-Infinity;
    for(const v of a){const d=v.x*nx+v.z*nz;a0=Math.min(a0,d);a1=Math.max(a1,d);}
    for(const v of b){const d=v.x*nx+v.z*nz;b0=Math.min(b0,d);b1=Math.max(b1,d);}
    if(a1<=b0+1e-8||b1<=a0+1e-8)return false;
  }
  return true;
}
export function poseBlocked(pose,rocks,footprint,limit=19) {
  const {x,z,heading=0}=pose,c=Math.cos(heading),s=Math.sin(heading);
  // Preserve the original exploration radius, without blocking turns near it.
  if(Math.hypot(x,z)>limit)return true;
  const base=footprint.groundHeight?.(x,z)??0;
  const parts=footprint.parts??[{minY:-Infinity,maxY:Infinity,hull:rectangle(-footprint.halfWidth,footprint.halfWidth,-footprint.halfLength,footprint.halfLength)}];
  const place=part=>{
    const hull=part.hull.map(p=>({x:x+c*p.x+s*p.z,z:z-s*p.x+c*p.z}));
    return {...part,hull,minX:Math.min(...hull.map(p=>p.x)),maxX:Math.max(...hull.map(p=>p.x)),minZ:Math.min(...hull.map(p=>p.z)),maxZ:Math.max(...hull.map(p=>p.z))};
  };
  const placed=parts.map(place);
  return rocks.some(b=>{
    const hull=b.hull??rectangle(b.minX,b.maxX,b.minZ,b.maxZ);
    const matches=part=>b.maxY>base+part.minY+.015&&b.minY<base+part.maxY-.015&&part.maxX>b.minX&&part.minX<b.maxX&&part.maxZ>b.minZ&&part.minZ<b.maxZ&&overlaps(part.hull,hull);
    return placed.some(part=>{
      if(!matches(part))return false;
      if(!part.children)return true;
      part.placedChildren??=part.children.map(place);
      return part.placedChildren.some(matches);
    });
  });
}
function sweepPath(from,to,rocks,footprint,limit) {
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.04),Math.ceil(Math.abs(to.heading-from.heading)/.025));
  let pose={...from};
  for(let i=1;i<=steps;i++){
    const t=i/steps,next={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t,heading:from.heading+(to.heading-from.heading)*t};
    if(poseBlocked(next,rocks,footprint,limit))return {...pose,blocked:true};
    pose=next;
  }
  return {...pose,blocked:false};
}
export function sweepRover(from,to,rocks,footprint,limit=19) {
  const result=sweepPath(from,to,rocks,footprint,limit);
  if(!result.blocked||to.heading===from.heading)return result;
  // A blocked turn must not cancel an otherwise clear reverse/forward escape.
  const translated=sweepPath(from,{...to,heading:from.heading},rocks,footprint,limit);
  if(Math.hypot(translated.x-from.x,translated.z-from.z)>Math.hypot(result.x-from.x,result.z-from.z)+1e-8){
    const turned=sweepPath(translated,{...translated,heading:to.heading},rocks,footprint,limit);
    return {...turned,blocked:translated.blocked||turned.blocked};
  }
  const turned=sweepPath(from,{...from,heading:to.heading},rocks,footprint,limit);
  return Math.abs(turned.heading-from.heading)>Math.abs(result.heading-from.heading)+1e-8?turned:result;
}

export function clearRoverPose(pose,rocks,footprint,limit=19) {
  if(!poseBlocked(pose,rocks,footprint,limit))return {...pose};
  for(let radius=.15;radius<=limit*2;radius+=.15){
    const count=Math.max(12,Math.ceil(2*Math.PI*radius/.15));
    for(let i=0;i<count;i++){
      const angle=i/count*2*Math.PI,next={...pose,x:pose.x+Math.cos(angle)*radius,z:pose.z+Math.sin(angle)*radius};
      if(!poseBlocked(next,rocks,footprint,limit))return next;
    }
  }
  return null;
}

// Ray/expanded-box intersection keeps the camera near plane out of a rock.
export function clearCamera(target,desired,rocks,padding=.24,groundHeight=()=>-Infinity) {
  let end={...desired};
  for(let pass=0;pass<4;pass++){
    let closest=1;
    for(const b of rocks){
      const inside=p=>p.x>b.minX-padding&&p.x<b.maxX+padding&&p.y>b.minY-padding&&p.y<b.maxY+padding&&p.z>b.minZ-padding&&p.z<b.maxZ+padding;
      // Authored inspection targets deliberately sit on/inside their subject.
      if(inside(target)){
        if(inside(end))end.y=b.maxY+padding+.01;
        continue;
      }
      let near=0,far=1;
      for(const [axis,min,max] of [['x','minX','maxX'],['y','minY','maxY'],['z','minZ','maxZ']]){
        const delta=end[axis]-target[axis],lo=b[min]-padding,hi=b[max]+padding;
        if(Math.abs(delta)<1e-9){if(target[axis]<lo||target[axis]>hi){near=2;break;}}
        else {const a=(lo-target[axis])/delta,c=(hi-target[axis])/delta;near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));}
      }
      if(near<=far&&near>=0&&near<closest)closest=near;
    }
    if(closest===1)break;
    const t=Math.max(0,closest-.005);
    end={x:target.x+(end.x-target.x)*t,y:target.y+(end.y-target.y)*t,z:target.z+(end.z-target.z)*t};
  }
  // Lifting above uphill terrain must not put the near plane into another rock.
  end.y=Math.max(end.y,groundHeight(end.x,end.z)+.35);
  for(let pass=0;pass<=rocks.length;pass++){
    let lifted=false;
    for(const b of rocks)if(end.x>b.minX-padding&&end.x<b.maxX+padding&&end.y>b.minY-padding&&end.y<b.maxY+padding&&end.z>b.minZ-padding&&end.z<b.maxZ+padding){end.y=b.maxY+padding+.01;lifted=true;}
    if(!lifted)break;
  }
  return end;
}
