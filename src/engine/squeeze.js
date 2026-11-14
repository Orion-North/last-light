const unit = value => Number.isFinite(value) && value >= 0 && value <= 1;

/** A fresh two-handed squeeze, not a timing challenge. Held entry never sends. */
export function createSqueeze() {
  let armed = false, charged = false, settled = 0, detent = 0;
  function reset() { armed = false; charged = false; settled = 0; detent = 0; }
  function sample({left, right, actualSample = true} = {}, delta = 0) {
    if (!actualSample || !unit(left) || !unit(right)) {
      reset();return {left:0,right:0,progress:0,charge:0,pressure:0,stage:'release',commit:false};
    }
    const pressure = Math.min(left,right);
    const released = left <= .15 && right <= .15;
    // A real release launches a charged memory. Neutral lifecycle samples cancel.
    if (charged) {
      if (released) reset();
      return {left,right,pressure,progress:1,charge:1,stage:released?'latched':'charged',commit:released,cue:null};
    }
    if (released) {armed = true;settled = 0;detent = 0;}
    if (!armed) return {left,right,pressure:0,progress:0,charge:0,stage:'release',commit:false};
    if (pressure < .82) settled = 0;
    else settled += Number.isFinite(delta) ? Math.max(0,Math.min(.05,delta)) : 0;
    const charge = Math.min(1,settled/.55);
    const progress = Math.min(1,pressure/.82)*.65 + charge*.35;
    let cue = null;
    if (pressure >= .82 && detent < 2) {cue='lock';detent=2;}
    else if (pressure >= .35 && detent < 1) {cue='tension';detent=1;}
    charged = settled >= .55 - 1e-10;
    if (charged) cue = 'charged';
    return {left,right,pressure,progress:charged?1:progress,charge:charged?1:charge,
      stage:charged?'charged':pressure>.15?'pressing':'ready',commit:false,cue};
  }
  return {sample,reset};
}
