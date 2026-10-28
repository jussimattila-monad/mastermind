export type Command =
  | { readonly type: 'pick'; readonly index: number }
  | { readonly type: 'move'; readonly delta: -1 | 1 }
  | { readonly type: 'backspace' }
  | { readonly type: 'clear' }
  | { readonly type: 'submit' };

export type KeyPress = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>;

// The number key for a palette position (1 for the first), or undefined from the tenth on.
export function paletteKey(index: number): string | undefined {
  return Number.isInteger(index) && index >= 0 && index < 9 ? String(index + 1) : undefined;
}

// Number keys pick the palette color at that position, see paletteKey.
export function keyToCommand(event: KeyPress, colorCount: number): Command | undefined {
  // Leave browser and OS shortcuts (Ctrl+1, Alt+←, …) alone.
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return undefined;
  }
  if (/^[1-9]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    return index < colorCount ? { type: 'pick', index } : undefined;
  }
  switch (event.key) {
    case 'ArrowLeft':
      return { type: 'move', delta: -1 };
    case 'ArrowRight':
      return { type: 'move', delta: 1 };
    case 'Backspace':
      return { type: 'backspace' };
    case 'Delete':
      return { type: 'clear' };
    case 'Enter':
      return { type: 'submit' };
    default:
      return undefined;
  }
}
