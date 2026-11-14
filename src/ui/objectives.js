/** One concrete instruction at a time; historical outcomes are never a player score. */
export function currentObjective({ scene, phase, goal, reached, investigating, transmitting }) {
  if (investigating && !['stone-ripples','blueberries'].includes(scene.id)) return ['dust','last-image'].includes(scene.id)?'Look into the dusty sky and hold still':'Survey the ground and horizon';
  if (investigating) return scene.id === 'blueberries' ? 'Look down at the round grains, then hold still' : 'Face the crossing layers, then hold still';
  if (phase === 'observe' && goal && !reached) return `Drive to ${goal.label}`;
  if (phase === 'observe') return goal && reached ? `Arrived · ${scene.objective}` : scene.objective;
  if (phase === 'choose') return 'Choose what to remember';
  if (phase === 'transmit') return transmitting ? (scene.receiptMode === 'partial' ? 'Watch the image reach Earth' : scene.signal ? 'Listen for Earth’s reply' : 'Listen for Opportunity') : (scene.receiptMode === 'archive' ? 'Add this memory to the archive' : scene.signal ? 'Send your memory to Earth' : 'Call Opportunity from Earth');
  return scene.receiptMode === 'partial' ? 'Part of the image arrived. Continue the journey.' : scene.signal ? 'Your memory is home. Continue the journey.' : 'Carry this memory forward';
}

export function inputMode({ screen, phase, modal, investigating, contacting, travelling }) {
  if (modal || screen !== 'game') return 'menu';
  if (contacting) return 'uplink';
  if (investigating) return 'inspect';
  return phase === 'observe' && travelling ? 'drive' : 'menu';
}
