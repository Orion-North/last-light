// Give each image its own readable beat before returning to the sending ritual.
export const discoveryTiming = Object.freeze({ captured:700, dissolve:700, original:1250, handoff:650 });

/** A DOM update alone does not paint before synchronous WebGL readback. */
export async function waitForDiscoveryPaint(isCurrent, requestFrame = requestAnimationFrame) {
  for(let frame=0;frame<2;frame++) {
    await new Promise(resolve=>requestFrame(resolve));
    if(!isCurrent())return false;
  }
  return true;
}

/** Advance only visible, unpaused time; background stalls never skip a story beat. */
export function advanceDiscoveryHandoff({stage,elapsed=0,imageWait=0},delta,{paused=false,reducedMotion=false,imageLoading=false}={}) {
  const {captured,dissolve,original,handoff}=discoveryTiming;
  const revealDuration=captured+(reducedMotion?0:dissolve)+original;
  const duration=stage==='revealing'?revealDuration:stage==='handoff'?(reducedMotion?100:handoff):0;
  const progressAt=time=>stage==='revealing'?(reducedMotion?Number(time>=captured):Math.max(0,Math.min(1,(time-captured)/dissolve))):Math.min(1,time/duration);
  if(!duration)return {stage,elapsed,progress:1};
  const tick=paused?0:Math.max(0,Math.min(250,delta || 0));
  // Spend loading time looking at the captured frame, never a blank placeholder.
  // Bound a failed/very slow request so the original sending controls still work.
  if(stage==='revealing' && imageLoading && elapsed>=captured && imageWait<1500)
    return {stage,elapsed,imageWait:imageWait+tick,progress:progressAt(elapsed)};
  const next=stage==='revealing' && imageLoading && elapsed<captured && imageWait<1500?Math.min(captured,elapsed+tick):elapsed+tick;
  if(next>=duration)return {stage:stage==='revealing'?'handoff':'uplink',elapsed:0,progress:stage==='revealing'?0:1};
  return {stage,elapsed:next,imageWait,progress:progressAt(next)};
}
