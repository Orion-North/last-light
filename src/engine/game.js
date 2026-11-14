/**
 * The story progresses through deliberate actions, never timers or power failure.
 * Power belongs to the authored scene; choices cannot change the historical end.
 */

/** @returns {{sceneIndex:number, phase:string, memories:Array, selected:string|null, paused:boolean, complete:boolean}} */
export function createState() {
  return {
    sceneIndex: 0,
    phase: 'observe',
    memories: [],
    selected: null,
    paused: false,
    complete: false,
  };
}

/**
 * Return a new state for a legal action, or the original state for a no-op.
 * All content remains data: this function knows nothing about DOM or sound.
 * @param {ReturnType<typeof createState>} state
 * @param {{type:string, choiceId?:string}} action
 * @param {Array} scenes
 */
export function transition(state, action, scenes) {
  if (!state || !action || typeof action.type !== 'string') return state;

  if (action.type === 'RESTART') return createState();
  if (action.type === 'PAUSE') {
    return state.paused ? state : { ...state, paused: true };
  }
  if (action.type === 'RESUME') {
    return state.paused ? { ...state, paused: false } : state;
  }
  if (state.paused || state.complete || !Array.isArray(scenes)) return state;
  if (!['OBSERVE', 'CHOOSE', 'TRANSMIT', 'NEXT'].includes(action.type)) return state;
  if (!Number.isInteger(state.sceneIndex) || state.sceneIndex < 0) return state;
  const scene = scenes[state.sceneIndex];
  if (!scene) return state;

  // Also supports a single-scene epilogue, without requiring a previous NEXT.
  if (scene.end) return { ...state, complete: true, phase: 'complete' };

  switch (action.type) {
    case 'OBSERVE':
      if (state.phase !== 'observe') return state;
      return { ...state, phase: 'choose' };

    case 'CHOOSE': {
      if (state.phase !== 'choose') return state;
      const choice = scene.choices?.find((item) => item.id === action.choiceId);
      if (!choice || !choice.memory) return state;
      const memory = {
        sceneId: scene.id,
        choiceId: choice.id,
        title: choice.memory.title,
        text: choice.memory.text,
      };
      return {
        ...state,
        phase: 'transmit',
        selected: choice.id,
        // Exactly one archive record per scene, even when hydrating old state.
        memories: [...state.memories.filter((item) => item.sceneId !== scene.id), memory],
      };
    }

    case 'TRANSMIT':
      if (state.phase !== 'transmit' || state.selected === null) return state;
      return { ...state, phase: 'received' };

    case 'NEXT': {
      if (state.phase !== 'received') return state;
      const nextIndex = state.sceneIndex + 1;
      const nextScene = scenes[nextIndex];
      if (!nextScene) {
        // A missing epilogue must not leave an otherwise complete story stuck.
        return { ...state, phase: 'complete', complete: true };
      }
      return {
        ...state,
        sceneIndex: nextIndex,
        phase: nextScene.end ? 'complete' : 'observe',
        selected: null,
        complete: Boolean(nextScene.end),
      };
    }

    default:
      return state;
  }
}
