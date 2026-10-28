import { describe, expect, it } from 'vitest';
import { keyToCommand, paletteKey, type KeyPress } from './keyboard';

function press(key: string, modifiers: Partial<KeyPress> = {}): KeyPress {
  return { key, ctrlKey: false, altKey: false, metaKey: false, ...modifiers };
}

describe('paletteKey', () => {
  it('numbers the first nine positions from 1', () => {
    expect(paletteKey(0)).toBe('1');
    expect(paletteKey(8)).toBe('9');
  });

  it('has no key from the tenth position on', () => {
    expect(paletteKey(9)).toBeUndefined();
    expect(paletteKey(-1)).toBeUndefined();
  });

  it('agrees with keyToCommand', () => {
    for (let index = 0; index < 10; index++) {
      const key = paletteKey(index);
      if (key) {
        expect(keyToCommand(press(key), 10)).toEqual({ type: 'pick', index });
      }
    }
  });
});

describe('keyToCommand', () => {
  it('maps number keys to palette positions', () => {
    expect(keyToCommand(press('1'), 6)).toEqual({ type: 'pick', index: 0 });
    expect(keyToCommand(press('6'), 6)).toEqual({ type: 'pick', index: 5 });
  });

  it('ignores number keys beyond the palette', () => {
    expect(keyToCommand(press('7'), 6)).toBeUndefined();
    expect(keyToCommand(press('0'), 10)).toBeUndefined();
  });

  it('maps editing and submit keys', () => {
    expect(keyToCommand(press('ArrowLeft'), 6)).toEqual({ type: 'move', delta: -1 });
    expect(keyToCommand(press('ArrowRight'), 6)).toEqual({ type: 'move', delta: 1 });
    expect(keyToCommand(press('Backspace'), 6)).toEqual({ type: 'backspace' });
    expect(keyToCommand(press('Delete'), 6)).toEqual({ type: 'clear' });
    expect(keyToCommand(press('Enter'), 6)).toEqual({ type: 'submit' });
  });

  it('ignores other keys', () => {
    expect(keyToCommand(press('a'), 6)).toBeUndefined();
    expect(keyToCommand(press(' '), 6)).toBeUndefined();
    expect(keyToCommand(press('Tab'), 6)).toBeUndefined();
  });

  it('ignores keys pressed with Ctrl, Alt or Meta', () => {
    expect(keyToCommand(press('1', { ctrlKey: true }), 6)).toBeUndefined();
    expect(keyToCommand(press('ArrowLeft', { altKey: true }), 6)).toBeUndefined();
    expect(keyToCommand(press('Enter', { metaKey: true }), 6)).toBeUndefined();
  });
});
