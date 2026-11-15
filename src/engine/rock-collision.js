// Conservative horizontal rover footprint against world-space rock bounds.
export function poseBlocked(pose, rocks, footprint, limit = 19) {
  const {x,z,heading=0}=pose, {halfWidth,halfLength}=footprint;
  const c=Math.cos(heading),s=Math.sin(heading);
  for(const side of [-1,1])for(const end of [-1,1]){
    if(Math.hypot(x+c*halfWidth*side+s*halfLength*end,z-s*halfWidth*side+c*halfLength*end)>limit)return true;
  }
  return rocks.some(b=>{
    const bx=(b.minX+b.maxX)/2,bz=(b.minZ+b.maxZ)/2;
    const rx=(b.maxX-b.minX)/2,rz=(b.maxZ-b.minZ)/2,dx=bx-x,dz=bz-z;
    return Math.abs(dx)<rx+Math.abs(c)*halfWidth+Math.abs(s)*halfLength &&
      Math.abs(dz)<rz+Math.abs(s)*halfWidth+Math.abs(c)*halfLength &&
      Math.abs(dx*c-dz*s)<halfWidth+rx*Math.abs(c)+rz*Math.abs(s) &&
      Math.abs(dx*s+dz*c)<halfLength+rx*Math.abs(s)+rz*Math.abs(c);
  });
}

// Sweep translation AND rotation so an antenna/deck corner cannot turn into a rock.
export function sweepRover(from,to,rocks,footprint,limit=19) {
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.04),Math.ceil(Math.abs(to.heading-from.heading)/.025));
  let pose={...from};
  for(let i=1;i<=steps;i++){
    const t=i/steps,next={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t,heading:from.heading+(to.heading-from.heading)*t};
    if(poseBlocked(next,rocks,footprint,limit))return {...pose,blocked:true};
    pose=next;
  }
  return {...pose,blocked:false};
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
