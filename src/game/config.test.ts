import { describe, expect, it } from 'vitest';
import { validateConfig } from './config';
import { CLASSIC } from './types';

describe('validateConfig', () => {
  it('accepts the classic config', () => {
    expect(() => validateConfig(CLASSIC)).not.toThrow();
  });

  it('rejects non-positive or fractional pegs and guesses', () => {
    expect(() => validateConfig({ ...CLASSIC, pegs: 0 })).toThrow(/pegs/);
    expect(() => validateConfig({ ...CLASSIC, pegs: 2.5 })).toThrow(/pegs/);
    expect(() => validateConfig({ ...CLASSIC, maxGuesses: 0 })).toThrow(/maxGuesses/);
  });

  it('rejects an empty palette', () => {
    expect(() => validateConfig({ ...CLASSIC, colors: [] })).toThrow(/empty/);
  });

  it('rejects a palette with duplicate colors', () => {
    expect(() => validateConfig({ ...CLASSIC, colors: ['red', 'blue', 'red'] })).toThrow(/duplicates/);
  });

  it('rejects more pegs than colors when duplicates are not allowed', () => {
    expect(() => validateConfig({ ...CLASSIC, pegs: 7, allowDuplicates: false })).toThrow(/exceed/);
    expect(() => validateConfig({ ...CLASSIC, pegs: 7, allowDuplicates: true })).not.toThrow();
  });
});
