/** Advance only visible, unpaused time; background stalls never skip a story beat. */
export function advanceDiscoveryHandoff({stage,elapsed=0,imageWait=0},delta,{paused=false,reducedMotion=false,imageLoading=false}={}) {
  const duration=stage==='revealing'?(reducedMotion?350:900):stage==='handoff'?(reducedMotion?100:450):0;
  if(!duration)return {stage,elapsed,progress:1};
  const tick=paused?0:Math.max(0,Math.min(250,delta || 0));
  // Keep the captured view while the mission image loads, but never block progress.
  if(stage==='revealing' && imageLoading && imageWait<1000)return {stage,elapsed,imageWait:imageWait+tick,progress:elapsed/duration};
  const next=elapsed+tick;
  if(next>=duration)return {stage:stage==='revealing'?'handoff':'uplink',elapsed:0,progress:stage==='revealing'?0:1};
  return {stage,elapsed:next,imageWait,progress:next/duration};
}
