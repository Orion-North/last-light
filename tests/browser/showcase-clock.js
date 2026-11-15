// Export-only virtual time. Installed by the local showcase fixture, never the game.
export function installClock(win) {
  let now=0,serial=0;
  const frames=new Map(),timers=new Map(),animationStarts=new WeakMap();
  Object.defineProperty(win.performance,'now',{value:()=>now});
  win.requestAnimationFrame=fn=>{const id=++serial;frames.set(id,fn);return id;};
  win.cancelAnimationFrame=id=>frames.delete(id);
  const timer=(fn,ms,args,repeat)=>{const id=++serial;timers.set(id,{fn,at:now+Math.max(1,Number(ms)||1),args,repeat});return id;};
  win.setTimeout=(fn,ms,...args)=>timer(fn,ms,args,0);
  win.setInterval=(fn,ms,...args)=>timer(fn,ms,args,Math.max(1,Number(ms)||1));
  win.clearTimeout=win.clearInterval=id=>timers.delete(id);
  return {
    get now(){return now;},
    tick(ms=1000/24){
      now+=ms;
      for(let pass=0;pass<8;pass++){
        const due=[...timers].filter(([,t])=>t.at<=now);if(!due.length)break;
        for(const [id,t] of due){if(!timers.has(id))continue;if(t.repeat)t.at+=t.repeat;else timers.delete(id);t.fn(...t.args);}
      }
      const ready=[...frames];frames.clear();for(const [,fn] of ready)fn(now);
      for(const animation of win.document.getAnimations()){
        if(!animationStarts.has(animation))animationStarts.set(animation,now);
        animation.pause();animation.currentTime=now-animationStarts.get(animation);
      }
    },
  };
}
