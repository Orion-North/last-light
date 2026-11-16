/** Advance only visible, unpaused time; background stalls never skip a story beat. */
export function advanceDiscoveryHandoff({stage,elapsed=0},delta,{paused=false,reducedMotion=false}={}) {
  const duration=stage==='revealing'?(reducedMotion?500:1400):stage==='handoff'?(reducedMotion?100:700):0;
  if(!duration)return {stage,elapsed,progress:1};
  const next=elapsed+(paused?0:Math.max(0,Math.min(100,delta || 0)));
  if(next>=duration)return {stage:stage==='revealing'?'handoff':'uplink',elapsed:0,progress:stage==='revealing'?0:1};
  return {stage,elapsed:next,progress:next/duration};
}
