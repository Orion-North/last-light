// Authored educational comparison, never instrument telemetry.
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = n => Number.isFinite(n) ? n : 0;
export function createGeologyTool(sceneId) {
  const berry = sceneId === 'blueberries';
  if (!berry && sceneId !== 'stone-ripples') return null;
  const targets = berry ? [
    { id: 'bedrock', label: 'Exposed bedrock', x: .5, y: -.16, reading: 'Lower relative iron-bearing signal' },
    { id: 'grains', label: 'Grain-rich surface', x: -.45, y: .1, reading: 'Higher relative iron-bearing signal' },
  ] : [
    { id: 'lower', label: 'Lower inclined layers', x: -.4, y: .4, reading: 'Layers incline one way' },
    { id: 'upper', label: 'Upper crossing layers', x: .4, y: -.4, reading: 'Layers cross the lower set' },
  ];
  const size = 24, cleared = new Uint8Array(size * size);
  let cursor = { x: 0, y: 0 }, input = {}, stage = 'brush', samples = [], dwell = 0, holding = null, coverage = 0, needsRelease = true;
  const radius = .22, requiredCoverage = .56;
  let previousCursor = { ...cursor };
  function snapshot() {
    const target = targets.find(t => !samples.some(s => s.id === t.id) && Math.hypot(t.x - cursor.x, t.y - cursor.y) < .24) || null;
    return { stage, coverage, requiredCoverage, progress: stage === 'brush' ? Math.min(1, coverage / requiredCoverage) : stage === 'sample' ? dwell / .7 : stage === 'complete' ? 1 : 0,
      operating: !needsRelease && (input.pressure > .15 || input.measure === true), toolMotion: Math.min(1, Math.hypot(finite(input.x), finite(input.y))),
      samples: samples.map(s => ({ ...s })), targets, target, cursor: { ...cursor }, complete: stage === 'complete',
      hint: needsRelease ? stage === 'brush' ? 'Release R2 to ready the brush' : 'Release R2, then move onto a sample ring' : stage === 'brush' ? 'Hold R2 and sweep across the dusty patch' : stage === 'sample' ? target ? `Stop moving, then hold R2 to read ${target.label.toLowerCase()}` : 'Move the probe onto an unread ring' : stage === 'compare' ? 'Press × to compare the two readings' : 'Comparison recorded',
      cleared };
  }
  return {
    snapshot,
    setInput(value = {}) { input = { x: clamp(finite(value.x), -1, 1), y: clamp(finite(value.y), -1, 1), pressure: clamp(finite(value.pressure), 0, 1), measure: value.measure === true }; if (needsRelease && value.actualSample !== false && input.pressure <= .15 && !input.measure) needsRelease = false; },
    setCursor(x, y) { if (Number.isFinite(x) && Number.isFinite(y)) cursor = { x: clamp(x, -.95, .95), y: clamp(y, -.95, .95) }; },
    stop() { input = {}; dwell = 0; holding = null; needsRelease = true; previousCursor = { ...cursor }; },
    compare() { if (stage !== 'compare') return false; stage = 'complete'; return true; },
    update(seconds, paused = false) {
      if (paused) { this.stop(); return snapshot(); }
      if (needsRelease) { previousCursor = { ...cursor }; return snapshot(); }
      const dt = clamp(finite(seconds), 0, .05);
      cursor.x = clamp(cursor.x + finite(input.x) * dt * 1.15, -.95, .95);
      cursor.y = clamp(cursor.y + finite(input.y) * dt * 1.15, -.95, .95);
      const cursorSpeed = dt > 0 ? Math.hypot(cursor.x - previousCursor.x, cursor.y - previousCursor.y) / dt : Infinity;
      previousCursor = { ...cursor };
      if (stage === 'brush' && input.pressure > .15) {
        for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
          if (Math.hypot(-1 + (i + .5) * 2 / size - cursor.x, -1 + (j + .5) * 2 / size - cursor.y) < radius) cleared[j * size + i] = 1;
        }
        coverage = cleared.reduce((a, b) => a + b, 0) / cleared.length;
        if (coverage >= requiredCoverage) { stage = 'sample'; dwell = 0; needsRelease = true; }
      } else if (stage === 'sample') {
        const target = snapshot().target;
        if (target && (input.pressure > .15 || input.measure) && Math.hypot(finite(input.x), finite(input.y)) < .18 && cursorSpeed < .207) {
          if (holding !== target.id) dwell = 0;
          holding = target.id; dwell += dt;
          if (dwell >= .7) { samples.push({ ...target }); dwell = 0; holding = null; if (samples.length === 2) stage = 'compare'; }
        } else { dwell = 0; holding = null; }
      }
      return snapshot();
    },
  };
}
