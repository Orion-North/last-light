/** Presentation follows observed story progress; it never changes mission history. */
export function discoveredScenes(state, scenes) {
  return scenes.filter((scene, index) => !scene.end &&
    (index < state.sceneIndex || (index === state.sceneIndex && state.phase !== 'observe')));
}

export function transmissionProfile(scene) {
  const mode = scene.receiptMode || (scene.signal > 0 ? 'reply' : 'silence');
  const profile = {
    reply: { mode, action: 'Send home', waiting: 'SENDING · WAITING FOR EARTH', result: 'EARTH RECEIVED', delay: 1200 },
    partial: { mode, action: 'Send home', waiting: 'SENDING · SIGNAL FADING', result: 'PARTIAL IMAGE RECEIVED', delay: 1600 },
    silence: { mode, action: 'Call and listen', waiting: 'CALLING · LISTENING', result: 'NO REPLY', delay: 2000 },
    archive: { mode, action: 'Keep this memory', waiting: '', result: 'CARRIED FORWARD', delay: 0 },
  }[mode];
  // Express the fading link through feel, never through a harder success gate.
  const signal = Number.isFinite(scene.signal) ? Math.max(0, Math.min(100, scene.signal)) : 100;
  return { ...profile, effort: mode === 'archive' ? 0 : 1 - signal / 100 };
}

export function missionConditions(scene) {
  if (scene.signal === 0) return ['EARTH · LISTENING', 'CHANNEL QUIET'];
  const light = scene.power > 70 ? 'SUNLIT' : scene.power > 30 ? 'LIGHT FADING' : 'LITTLE LIGHT';
  const signal = scene.signal > 80 ? 'LINK CLEAR' : scene.signal > 20 ? 'LINK FRAGILE' : 'LINK FADING';
  return [light, signal];
}

/** A few specific memories on the ending; the complete archive remains optional. */
export function endingMemories(memories) {
  return memories.filter((_, index) => index < 3 || index === memories.length - 1);
}
