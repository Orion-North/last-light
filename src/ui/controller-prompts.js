const families = ['auto', 'playstation', 'xbox', 'generic'];
export const validPromptStyle = value => families.includes(value);

export function controllerFamily(id = '', override = 'auto') {
  if (validPromptStyle(override) && override !== 'auto') return override;
  if (/xbox|xinput|microsoft|045e/i.test(id)) return 'xbox';
  if (/dualsense|dualshock|playstation|054c|^wireless controller(?:\s*\(|$)/i.test(id)) return 'playstation';
  return 'generic';
}

const faceActions = ['primary', 'back', 'journal'];
const faceLabels = {
  playstation: ['Cross', 'Circle', 'Square'],
  xbox: ['A', 'B', 'X'],
  generic: ['Bottom face button', 'Right face button', 'Left face button'],
};

export function controllerButtonName(action, family = 'generic') {
  const face = faceActions.indexOf(action);
  if (face >= 0) return (faceLabels[family] || faceLabels.generic)[face];
  return { move: 'Left stick', look: 'Right stick', swipe: 'Touchpad', select: 'D-pad',
    shutter: family === 'playstation' ? 'R1' : family === 'xbox' ? 'RB' : 'Right bumper',
    pause: family === 'playstation' ? 'Options' : 'Menu',
    forward: family === 'playstation' ? 'R2' : 'Right trigger',
    reverse: family === 'playstation' ? 'L2' : 'Left trigger' }[action] || 'Controller';
}

/** Original vector prompts. Decorative icons accompany readable action labels. */
export function controllerGlyph(action, family = 'generic') {
  const face = faceActions.indexOf(action);
  let shape;
  if (face >= 0 && family === 'playstation') {
    const marks = ['<path d="m10 10 12 12m0-12L10 22"/>',
      '<circle cx="16" cy="16" r="7.5"/>', '<rect x="9" y="9" width="14" height="14" rx=".5"/>'];
    shape = `<circle cx="16" cy="16" r="14.5" opacity=".45"/>${marks[face]}`;
  } else if (face >= 0 && family === 'xbox') {
    shape = `<circle cx="16" cy="16" r="14"/><text x="16" y="21" text-anchor="middle" fill="currentColor" stroke="none" font-size="15" font-family="sans-serif" font-weight="600">${faceLabels.xbox[face]}</text>`;
  } else if (face >= 0) {
    shape = [[16,24],[24,16],[8,16],[16,8]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4.5" ${i===face?'fill="currentColor"':'opacity=".4"'}/>`).join('');
  } else if (action === 'swipe') {
    shape = '<rect x="3" y="7" width="26" height="18" rx="4"/><path d="M16 22V11m-5 5 5-5 5 5"/>';
  } else if (action === 'move' || action === 'look') {
    shape = `<path d="M16 2v3m0 22v3M2 16h3m22 0h3"/><circle cx="16" cy="16" r="10"/><text x="16" y="20.5" text-anchor="middle" fill="currentColor" stroke="none" font-size="13" font-family="sans-serif">${action==='move'?'L':'R'}</text>`;
  } else if (action === 'select') {
    shape = '<path d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9Z"/>';
  } else if (action === 'shutter') {
    const label = family === 'playstation' ? 'R1' : 'RB';
    shape = `<path d="M4 13Q6 7 14 7h10q4 0 4 5v9H4Z"/><text x="16" y="18" text-anchor="middle" fill="currentColor" stroke="none" font-size="10" font-family="sans-serif">${label}</text>`;
  } else if (action === 'forward' || action === 'reverse') {
    const label = action === 'forward' ? (family==='playstation'?'R2':'RT') : (family==='playstation'?'L2':'LT');
    shape = `<path d="M5 12Q5 4 13 4h10q4 0 4 7v17H5Z"/><text x="16" y="22" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" font-family="sans-serif">${label}</text>`;
  } else {
    shape = '<rect x="5" y="4" width="22" height="24" rx="7"/><path d="M11 12h10m-10 4h10m-10 4h10"/>';
  }
  return `<svg class="controller-glyph" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shape}</svg>`;
}

export function controllerHint(family, moving) {
  const prompts = moving ? [['move','Drive'],['look','Look'],['primary','Interact']]
    : [['move','Select'],['primary','Interact'],['journal','Journal']];
  return prompts.map(([action,label])=>`<span class="controller-hint" aria-label="${controllerButtonName(action,family)}: ${label.toLowerCase()}">${controllerGlyph(action,family)}<span>${label}</span></span>`).join('');
}
