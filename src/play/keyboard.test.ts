import { describe, expect, it } from 'vitest';
import { keyToCommand, type KeyPress } from './keyboard';

function press(key: string, modifiers: Partial<KeyPress> = {}): KeyPress {
  return { key, ctrlKey: false, altKey: false, metaKey: false, ...modifiers };
}

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
