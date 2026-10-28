import { describe, expect, it } from 'vitest';
import { GuessDraft } from './guess-draft';

describe('GuessDraft', () => {
  it('starts empty with the first slot active', () => {
    const draft = new GuessDraft(4);
    expect(draft.slots).toEqual([null, null, null, null]);
    expect(draft.active).toBe(0);
    expect(draft.code).toBeUndefined();
  });

  it('fills slots in order and returns the complete code', () => {
    const draft = new GuessDraft(4);
    draft.pick('red');
    draft.pick('green');
    draft.pick('blue');
    expect(draft.active).toBe(3);
    expect(draft.code).toBeUndefined();
    draft.pick('yellow');
    expect(draft.code).toEqual(['red', 'green', 'blue', 'yellow']);
  });

  it('stays on the last slot when the row is full', () => {
    const draft = new GuessDraft(2);
    draft.pick('red');
    draft.pick('green');
    expect(draft.active).toBe(1);
    draft.pick('blue');
    expect(draft.slots).toEqual(['red', 'blue']);
  });

  it('moves to the next empty slot, wrapping around', () => {
    const draft = new GuessDraft(4);
    draft.select(2);
    draft.pick('red');
    expect(draft.active).toBe(3);
    draft.pick('green');
    expect(draft.active).toBe(0);
    draft.pick('blue');
    expect(draft.active).toBe(1);
  });

  it('replaces a selected slot in the middle of a full row', () => {
    const draft = new GuessDraft(4);
    for (const color of ['red', 'green', 'blue', 'yellow'] as const) {
      draft.pick(color);
    }
    draft.select(1);
    draft.pick('purple');
    expect(draft.slots).toEqual(['red', 'purple', 'blue', 'yellow']);
    expect(draft.active).toBe(2);
  });

  it('ignores selecting a slot that does not exist', () => {
    const draft = new GuessDraft(4);
    draft.select(4);
    draft.select(-1);
    draft.select(1.5);
    expect(draft.active).toBe(0);
  });

  it('clears a slot and makes it active', () => {
    const draft = new GuessDraft(3);
    draft.pick('red');
    draft.pick('green');
    draft.clear(0);
    expect(draft.slots).toEqual([null, 'green', null]);
    expect(draft.active).toBe(0);
  });

  it('clears the active slot by default', () => {
    const draft = new GuessDraft(3);
    draft.pick('red');
    draft.select(0);
    draft.clear();
    expect(draft.slots).toEqual([null, null, null]);
  });

  it('backspace clears the previous slot when the active one is empty', () => {
    const draft = new GuessDraft(4);
    draft.pick('red');
    draft.pick('green');
    draft.backspace();
    expect(draft.slots).toEqual(['red', null, null, null]);
    expect(draft.active).toBe(1);
    draft.backspace();
    draft.backspace();
    expect(draft.slots).toEqual([null, null, null, null]);
    expect(draft.active).toBe(0);
  });

  it('backspace clears the active slot when it is filled', () => {
    const draft = new GuessDraft(2);
    draft.pick('red');
    draft.pick('green');
    draft.backspace();
    expect(draft.slots).toEqual(['red', null]);
    expect(draft.active).toBe(1);
  });

  it('moves the active slot within the row', () => {
    const draft = new GuessDraft(3);
    draft.move(-1);
    expect(draft.active).toBe(0);
    draft.move(1);
    draft.move(1);
    draft.move(1);
    expect(draft.active).toBe(2);
  });

  it('replaces the slots array on every change', () => {
    const draft = new GuessDraft(2);
    const before = draft.slots;
    draft.pick('red');
    expect(draft.slots).not.toBe(before);
    expect(before).toEqual([null, null]);
  });

  it('resets to an empty row', () => {
    const draft = new GuessDraft(2);
    draft.pick('red');
    draft.reset();
    expect(draft.slots).toEqual([null, null]);
    expect(draft.active).toBe(0);
  });
});
