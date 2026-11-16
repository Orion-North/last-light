const DEVICES = new Set(['keyboard', 'mouse', 'touch', 'controller']);

// Hardware connection and the input currently used are separate concerns.
export function createActiveInput({ initial = 'keyboard', onChange = () => {} } = {}) {
  let current = DEVICES.has(initial) ? initial : 'keyboard';
  return {
    get current() { return current; },
    use(device) {
      if (!DEVICES.has(device) || device === current) return false;
      const previous = current;
      current = device;
      onChange(current, previous);
      return true;
    },
  };
}
