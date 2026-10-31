import { describe, expect, it } from 'vitest';
import { DEFAULT_CUSTOM, MAX_GUESSES, MAX_PEGS, validateConfig } from '../game';
import { ConfigDraft } from './config-draft';

describe('ConfigDraft', () => {
  it('starts as the config it is given', () => {
    const draft = new ConfigDraft(DEFAULT_CUSTOM);
    expect(draft.error).toBeUndefined();
    expect(draft.canSave).toBe(true);
    expect(draft.toConfig()).toEqual(DEFAULT_CUSTOM);
  });

  it('builds a config that passes validateConfig', () => {
    const draft = new ConfigDraft(DEFAULT_CUSTOM);
    draft.pegs = MAX_PEGS;
    draft.maxGuesses = MAX_GUESSES;
    draft.toggleColor('black');
    const config = draft.toConfig();
    expect(config).toBeDefined();
    if (config) {
      expect(() => validateConfig(config)).not.toThrow();
    }
  });

  it('toggles colors and keeps the palette in the standard order', () => {
    const draft = new ConfigDraft({ ...DEFAULT_CUSTOM, colors: ['blue', 'red', 'green', 'yellow'] });
    expect(draft.colors).toEqual(['red', 'green', 'blue', 'yellow']);
    draft.toggleColor('purple');
    draft.toggleColor('green');
    expect(draft.colors).toEqual(['red', 'blue', 'yellow', 'purple']);
  });

  it('replaces the colors array instead of mutating it', () => {
    const draft = new ConfigDraft(DEFAULT_CUSTOM);
    const before = draft.colors;
    draft.toggleColor('red');
    expect(draft.colors).not.toBe(before);
    expect(before).toHaveLength(6);
  });

  it('rejects pegs outside 1 to MAX_PEGS and non-integers', () => {
    const draft = new ConfigDraft(DEFAULT_CUSTOM);
    for (const pegs of [0, MAX_PEGS + 1, 2.5, Number.NaN]) {
      draft.pegs = pegs;
      expect(draft.error?.key).toBe('pegs');
      expect(draft.toConfig()).toBeUndefined();
    }
  });

  it('rejects guesses outside 1 to MAX_GUESSES and non-integers', () => {
    const draft = new ConfigDraft(DEFAULT_CUSTOM);
    for (const maxGuesses of [0, MAX_GUESSES + 1, 1.5, Number.NaN]) {
      draft.maxGuesses = maxGuesses;
      expect(draft.error?.key).toBe('guesses');
    }
  });

  it('needs at least two colors', () => {
    const draft = new ConfigDraft({ ...DEFAULT_CUSTOM, colors: ['red', 'blue'] });
    expect(draft.error).toBeUndefined();
    draft.toggleColor('blue');
    expect(draft.error).toEqual({ key: 'colors', params: { min: 2 } });
    expect(draft.canSave).toBe(false);
  });

  it('needs enough colors for the pegs unless duplicates are allowed', () => {
    const draft = new ConfigDraft({ ...DEFAULT_CUSTOM, pegs: 6, colors: ['red', 'blue', 'green'] });
    expect(draft.error).toBeUndefined();
    draft.allowDuplicates = false;
    expect(draft.error).toEqual({ key: 'duplicates', params: { pegs: 6, colors: 3 } });
    draft.pegs = 3;
    expect(draft.error).toBeUndefined();
  });
});
