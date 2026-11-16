// Archival context remains readable alongside the physically rendered monitor.
export function renderEarthStation() {
  return `<div class="earth-station__label">Last known position<small>Reconstruction</small></div>`;
}

/** Map a logical rectangle onto the four projected corners of a physical screen. */
export function signalMonitorTransform(points,width=580,height=160) {
  if(points?.length!==4 || points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const [p0,p1,p2,p3]=points;
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const determinant=dx1*dy2-dx2*dy1;
  if(Math.abs(determinant)<.001)return null;
  const g=(dx3*dy2-dx2*dy3)/determinant,h=(dx1*dy3-dx3*dy1)/determinant;
  return [(p1.x-p0.x+g*p1.x)/width,(p1.y-p0.y+g*p1.y)/width,0,g/width,
    (p3.x-p0.x+h*p3.x)/height,(p3.y-p0.y+h*p3.y)/height,0,h/height,
    0,0,1,0,p0.x,p0.y,0,1];
}

/** Reuse the actual game's signal markup, styles and keyframes on the monitor.
 * The original stays accessible in the story; its visual copy carries no controls.
 */
export function createEarthSignalMonitor(host) {
  const display=document.createElement('div');
  display.className='upload-terminal earth-monitor-signal';
  display.setAttribute('aria-hidden','true');display.hidden=true;host.append(display);
  let source=null,frame=null,observer=null;
  function paintFrame() {
    const matrix=signalMonitorTransform(frame?.corners);
    display.hidden=!source || !matrix || frame?.visible===false;
    if(matrix)display.style.transform=`matrix3d(${matrix.join(',')})`;
  }
  function copyState() {
    if(!source)return;
    for(const name of [...display.attributes].map(a=>a.name))if(name.startsWith('data-'))display.removeAttribute(name);
    for(const attr of source.attributes)if(attr.name.startsWith('data-'))display.setAttribute(attr.name,attr.value);
    // Live trigger pressure and charge use exactly the original animation inputs.
    display.style.cssText=source.style.cssText;
    paintFrame();
  }
  function clear() {
    observer?.disconnect();observer=null;source=null;display.replaceChildren();paintFrame();
  }
  return {
    sync(terminal) {
      if(!terminal){clear();return;}
      if(source===terminal){copyState();return;}
      clear();source=terminal;
      for(const selector of ['.signal-map','.signal-dialogue']) {
        const graphic=source.querySelector(selector);
        if(graphic)display.append(graphic.cloneNode(true));
      }
      observer=new MutationObserver(copyState);observer.observe(source,{attributes:true});copyState();
    },
    clear,
    setFrame(value){frame=value;paintFrame();},
  };
}
