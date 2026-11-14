const unit = value => Number.isFinite(value) && value >= 0 && value <= 1;

/** A fresh two-handed squeeze, not a timing challenge. Held entry never sends. */
export function createSqueeze() {
  let armed = false, settled = 0, detent = 0;
  function reset() { armed = false; settled = 0; detent = 0; }
  function sample({left, right, actualSample = true} = {}, delta = 0) {
    if (!actualSample || !unit(left) || !unit(right)) {
      reset();return {left:0,right:0,progress:0,pressure:0,stage:'release',commit:false};
    }
    const pressure = Math.min(left,right);
    if (left <= .15 && right <= .15) {armed = true;settled = 0;detent = 0;}
    if (!armed) return {left,right,pressure:0,progress:0,stage:'release',commit:false};
    if (pressure < .82) settled = 0;
    else settled += Number.isFinite(delta) ? Math.max(0,Math.min(.05,delta)) : 0;
    const progress = Math.min(1,pressure/.82)*.8 + Math.min(1,settled/.35)*.2;
    let cue = null;
    if (pressure >= .82 && detent < 2) {cue='lock';detent=2;}
    else if (pressure >= .35 && detent < 1) {cue='tension';detent=1;}
    const commit = settled >= .35 - 1e-10;
    const result = {left,right,pressure,progress:commit?1:progress,
      stage:commit?'latched':pressure>.15?'pressing':'ready',commit,cue};
    if (commit) reset();
    return result;
  }
  return {sample,reset};
}
