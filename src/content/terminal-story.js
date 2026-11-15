/** Opportunity's imagined inner voice, never a transcript or post-contact reply. */
const thoughts = {
  'stone-ripples': 'Why do these layers cross?',
  blueberries: 'They call them blueberries. I have never seen the ones on Earth.',
  marathon: '',
  'ordinary-day': '',
  dust: 'Dust blocks the sunlight my panels need.',
  'smaller-world': '',
  'last-image': '',
};

// What the player observed, before Earth receives and interprets the record.
const observations = {
  'stone-ripples': 'The upper layers cross the lower ones.',
  blueberries: 'The grains read differently from the brushed rock.',
  marathon: 'Forty-two kilometres. There is more ground ahead.',
  'ordinary-day': 'Sunlight on the ground beside my wheels. I’ll send that.',
  dust: 'I’ll send this sky.',
  'last-image': 'The Sun is somewhere behind this dust. I’ll send what light remains.',
};

// Mission-source interpretations, expressed as invented thoughts, not telemetry.
const received = {
  'first-morning': 'They have my first view.',
  'stone-ripples': 'Those crossing layers are evidence that water once flowed here.',
  blueberries: 'Hematite in the grains. Another clue that water helped form them.',
};

const voice = text => ({ speaker: 'rover', channel: 'OPPORTUNITY · imagined', text });

/** Controls never depend on a thought; the voice stops at contact loss. */
export function storyLine({ scene, phase, travelling = false, investigating = false,
  toolStage = '', transmitting = false, selected = null, recalled = null, purposeKnown = false }) {
  if (!scene || scene.act === 3 || scene.end || phase === 'complete'
    || (phase === 'observe' && travelling) || investigating || transmitting) return voice('');
  if (phase === 'received') return voice(scene.receiptMode === 'partial' ? '' : received[scene.id] || '');
  if (phase === 'choose' || phase === 'transmit') {
    if (scene.id === 'first-morning') return voice(selected?.shortReply || 'What shall I show them first?');
    if (scene.id === 'smaller-world' && recalled) return voice(recalled.choiceId === 'ground'
      ? 'I remember the soil beneath my wheels. That was the first view I sent.'
      : 'I remember the first crater rim. That was the first view I sent.');
    return voice(observations[scene.id] || '');
  }
  if (scene.id === 'first-morning') return voice(purposeKnown
    ? 'What shall I show them first?'
    : 'I am Opportunity. I came to Mars to look for signs of ancient water and send what I find to Earth.');
  return voice(thoughts[scene.id] || '');
}
