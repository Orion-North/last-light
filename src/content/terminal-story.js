/** Opportunity's imagined inner voice, never a transcript or post-contact reply. */
const thoughts = {
  'first-morning': 'I am Opportunity. I came to look for signs of ancient water on Mars. My cameras are their eyes here.',
  'stone-ripples': 'They sent me to a dry world to look for water. These crossing lines in Last Chance might tell me where it went.',
  blueberries: 'They call these little grains blueberries. A name from their world, for something I have yet to understand in mine.',
  marathon: 'Eleven years since that first crater. My wheels have carried me a marathon, and they are still asking what lies ahead.',
  'ordinary-day': 'Fourteen years, and I still have an ordinary afternoon to show them. Sunlight on stone. I am here, looking.',
  dust: 'Dust is hiding the Sun. Less light reaches my panels. I have known dark days before, but I need them to see this sky.',
  'smaller-world': 'The valley is fading into dust. I think of what I have already shown them. My world was never only what I could see from here.',
  'last-image': 'The Sun is somewhere behind this dust. I can still turn toward it. Looking has always been something I could give them.',
};

const discoveries = {
  'stone-ripples': 'These crossing layers hold the trace of ancient flowing water. I can show them a wetter past inside this dry stone.',
  blueberries: 'The grains contain hematite. My comparison with brushed rock gives them another clue to ancient water.',
  marathon: 'My small drives have become 42.195 kilometres. I will show them the tracks. Eleven years, one careful turn at a time.',
  'ordinary-day': 'I found a bright edge of stone. It is no new discovery, but I want them to see the light here while it is still here.',
  dust: 'Dust blocks the sunlight my panels need. I will show them how the sky has changed. The light has always come back before.',
  'smaller-world': 'The layers and hematite grains helped them find a wetter Mars. I can return to those discoveries. They are already home.',
  'last-image': 'There is only a little light in this frame. I will send what I can. They have so much more of the journey than this.',
};

const received = {
  'first-morning': 'They see what I see. My first morning is on another world, but someone has said good morning back.',
  'stone-ripples': 'They see the water in these layers too. I looked closely at a few fine lines, and their picture of Mars has changed.',
  blueberries: 'They found hematite in the grains. My careful work has given them another clue. There is more here to understand together.',
  marathon: 'They counted the distance too. A marathon behind me, another horizon ahead. They still want to see what I will find.',
  'ordinary-day': 'They received it. They will be there for the next one. I have made this small, ordinary afternoon something we share.',
  dust: 'They are watching the storm with me. I cannot see them from here, but their answer still crosses the dark.',
  'smaller-world': 'They have my discoveries. They are listening. Whatever happens to this sky, the things we found are already with them.',
};

const voice = text => ({ speaker: 'rover', channel: 'OPPORTUNITY · imagined', text });

/** One imagined thought. Signal receipts and Earth-side narration belong outside it. */
export function storyLine({ scene, phase, travelling = false, investigating = false,
  toolStage = '', transmitting = false, selected = null, recalled = null }) {
  if (!scene || scene.act === 3 || scene.end || phase === 'complete' || investigating) return voice('');
  if (phase === 'received') return voice(scene.receiptMode === 'partial' ? '' : received[scene.id] || '');
  if (phase === 'transmit' && transmitting) return voice(scene.receiptMode === 'partial'
    ? 'This little light is all I can send now.'
    : 'A little of my world is on its way to them.');
  if (phase === 'choose' || phase === 'transmit') {
    if (scene.id === 'first-morning') return voice(selected?.shortReply
      || 'My first view will reach people who have never stood here. I can show them the far crater rim, or the soil beneath my wheels.');
    if (scene.id === 'smaller-world' && recalled) return voice(recalled.choiceId === 'ground'
      ? 'I remember the soil beneath my wheels. I had arrived. That first view is still with them; the storm cannot take it back.'
      : 'I remember the first crater rim, with so much ahead. That view is still with them; the storm cannot take it back.');
    return voice(discoveries[scene.id] || '');
  }
  return voice(thoughts[scene.id] || '');
}
