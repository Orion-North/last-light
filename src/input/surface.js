// Samples the rendered surface near six wheel contacts, not a random vibration loop.
export function sampleSurface(height, {x, z, heading, speed, blocked=false}) {
  const clamp=n=>Math.max(0,Math.min(1,n));
  const sin=Math.sin(heading),cos=Math.cos(heading),span=.3;
  let curvature=0,slope=0;
  for(const side of [-.535,.535]) for(const axle of [-.55,-.02,.73]) {
    const wx=x+cos*side+sin*axle,wz=z-sin*side+cos*axle;
    const mid=height(wx,wz),front=height(wx+sin*span,wz+cos*span),back=height(wx-sin*span,wz-cos*span);
    curvature+=Math.abs(front+back-2*mid);
    slope+=Math.abs(front-back)/(2*span);
  }
  return {speed:Math.max(0,speed),roughness:clamp(curvature/6*20),slip:blocked?1:clamp(slope/6*.4),blocked};
}
