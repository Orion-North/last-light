// Authored educational comparison, never instrument telemetry.
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = n => Number.isFinite(n) ? n : 0;
export function createGeologyTool(sceneId, saved = null) {
  const berry = sceneId === 'blueberries';
  if (!berry && sceneId !== 'stone-ripples') return null;
  const targets = berry ? [
    { id: 'bedrock', label: 'Exposed bedrock', x: .5, y: -.16, reading: 'Lower relative iron-bearing signal' },
    { id: 'grains', label: 'Grain-rich surface', x: -.45, y: .1, reading: 'Higher relative iron-bearing signal' },
  ] : [
    { id: 'lower', label: 'Lower layer path', x: 0, y: .79, reading: 'Lower layers incline one way' },
    { id: 'upper', label: 'Upper crossing path', x: 0, y: -.05, reading: 'Upper layers cross the lower set' },
  ];
  const paths = berry ? [] : targets.map((target, i) => ({ ...target, points: Array.from({ length: 40 }, (_, j) => { const x = i ? -.83 + j / 39 * 1.66 : -.4 + j / 39 * 1.23; return { x, y: target.y + x * (i ? .32 : -.3), visited: false }; }) }));
  const size = 24, cleared = new Uint8Array(size * size);
  let cursor = { x: 0, y: 0 }, input = {}, stage = berry ? 'brush' : 'trace', samples = [], dwell = 0, holding = null, coverage = 0, needsRelease = true;
  const radius = .22, requiredCoverage = .56;
  let previousCursor = { ...cursor };
  // Restore only durable work. Input, dwell and force always require a fresh release.
  if (saved?.sceneId === sceneId) {
    if (Array.isArray(saved.cleared) && saved.cleared.length === cleared.length)
      saved.cleared.forEach((value, i) => { cleared[i] = value === 1 ? 1 : 0; });
    paths.forEach((path, i) => path.points.forEach((point, j) => {
      point.visited = saved.visited?.[i]?.[j] === true;
    }));
    coverage = berry ? cleared.reduce((a,b) => a+b,0)/cleared.length
      : paths.reduce((sum,path) => sum+path.points.filter(p=>p.visited).length,0)/80;
    if (berry && coverage >= requiredCoverage) {
      stage = 'sample';
      samples = targets.filter(t => Array.isArray(saved.sampleIds) && saved.sampleIds.includes(t.id)).map(t=>({...t}));
    } else if (!berry) samples = paths.filter(path=>path.points.filter(p=>p.visited).length>=32).map(path=>({...targets.find(t=>t.id===path.id)}));
    if (samples.length === 2) stage = saved.stage === 'complete' ? 'complete' : 'compare';
    if (Number.isFinite(saved.cursor?.x) && Number.isFinite(saved.cursor?.y))
      cursor = {x:clamp(saved.cursor.x,-.95,.95),y:clamp(saved.cursor.y,-.95,.95)};
    previousCursor = {...cursor};
  }
  function checkpoint() {
    return {sceneId, stage, cursor:{...cursor}, cleared:Array.from(cleared),
      visited:paths.map(path=>path.points.map(p=>p.visited)), sampleIds:samples.map(s=>s.id)};
  }
  function snapshot() {
    const traceProgress = paths.map(path => Math.min(1, path.points.filter(p => p.visited).length / (path.points.length * .8)));
    const target = targets.find(t => !samples.some(s => s.id === t.id) && Math.hypot(t.x - cursor.x, t.y - cursor.y) < .24) || null;
    return { mode: berry ? 'brush' : 'trace', paths: paths.map((path, i) => ({ ...path, progress: traceProgress[i], complete: samples.some(s => s.id === path.id), points: path.points.map(p => ({ ...p })) })), stage, coverage, requiredCoverage, progress: stage === 'trace' ? traceProgress.reduce((a, b) => a + b, 0) / 2 : stage === 'brush' ? Math.min(1, coverage / requiredCoverage) : stage === 'sample' ? dwell / .7 : stage === 'complete' ? 1 : 0,
      operating: !needsRelease && (input.pressure > .15 || input.measure === true), toolMotion: Math.min(1, Math.hypot(finite(input.x), finite(input.y))),
      samples: samples.map(s => ({ ...s })), targets, target, cursor: { ...cursor }, complete: stage === 'complete',
      hint: stage === 'compare' ? berry ? 'Press × to compare the two readings' : 'Press × to compare the layer directions' : stage === 'complete' ? 'Comparison recorded' : needsRelease ? stage === 'trace' ? 'Release R2 to ready the tracing probe' : stage === 'brush' ? 'Release R2 to ready the brush' : 'Release R2, then move onto a sample ring' : stage === 'trace' ? 'Hold R2 and follow each dotted layer path' : stage === 'brush' ? 'Hold R2 and sweep across the dusty patch' : stage === 'sample' ? target ? `Stop moving, then hold R2 to read ${target.label.toLowerCase()}` : 'Move the probe onto an unread ring' : stage === 'compare' ? 'Press × to compare the two readings' : 'Comparison recorded',
      cleared };
  }
  return {
    snapshot, checkpoint,
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
      if (stage === 'trace' && input.pressure > .15) {
        const path = paths.filter(p => !samples.some(s => s.id === p.id)).map(p => ({ path: p,
          distance: Math.min(...p.points.map(point => Math.hypot(point.x - cursor.x, point.y - cursor.y)))
        })).sort((a, b) => a.distance - b.distance)[0];
        if (path && path.distance < .12) {
          for (const point of path.path.points) if (Math.hypot(point.x - cursor.x, point.y - cursor.y) < .12) point.visited = true;
          coverage = paths.reduce((sum, p) => sum + p.points.filter(point => point.visited).length, 0) / 80;
          if (path.path.points.filter(point => point.visited).length >= 32) {
            const target = targets.find(t => t.id === path.path.id); samples.push({ ...target });
            needsRelease = true;
            if (samples.length === 2) stage = 'compare';
          }
        }
      } else if (stage === 'brush' && input.pressure > .15) {
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
          if (dwell >= .7) { samples.push({ ...target }); dwell = 0; holding = null; needsRelease = true; if (samples.length === 2) stage = 'compare'; }
        } else { dwell = 0; holding = null; }
      }
      return snapshot();
    },
  };
}
