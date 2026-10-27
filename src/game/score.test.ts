import { describe, expect, it } from 'vitest';
import { isValidGuess, score } from './score';
import { CLASSIC, type GameConfig } from './types';

describe('score', () => {
  it('counts all exact matches', () => {
    expect(score(['red', 'green', 'blue', 'yellow'], ['red', 'green', 'blue', 'yellow']))
      .toEqual({ correctColorAndPosition: 4, correctColorWrongPosition: 0 });
  });

  it('counts all colors in the wrong position', () => {
    expect(score(['red', 'green', 'blue', 'yellow'], ['yellow', 'blue', 'green', 'red']))
      .toEqual({ correctColorAndPosition: 0, correctColorWrongPosition: 4 });
  });

  it('returns zero when no colors match', () => {
    expect(score(['red', 'red', 'green', 'green'], ['blue', 'blue', 'yellow', 'yellow']))
      .toEqual({ correctColorAndPosition: 0, correctColorWrongPosition: 0 });
  });

  it('does not count a peg as both exact and wrong-position', () => {
    expect(score(['red', 'red', 'blue', 'blue'], ['red', 'blue', 'red', 'red']))
      .toEqual({ correctColorAndPosition: 1, correctColorWrongPosition: 2 });
  });

  it('limits matches to how often the color is in the guess', () => {
    expect(score(['red', 'red', 'blue', 'blue'], ['green', 'red', 'green', 'green']))
      .toEqual({ correctColorAndPosition: 1, correctColorWrongPosition: 0 });
    expect(score(['red', 'red', 'blue', 'blue'], ['green', 'green', 'green', 'red']))
      .toEqual({ correctColorAndPosition: 0, correctColorWrongPosition: 1 });
  });

  it('lets an exact match take priority over a wrong-position match', () => {
    expect(score(['red', 'green', 'green', 'blue'], ['green', 'green', 'red', 'red']))
      .toEqual({ correctColorAndPosition: 1, correctColorWrongPosition: 2 });
  });

  it('limits wrong-position matches to how often the color is in the secret', () => {
    expect(score(['red', 'green', 'blue', 'yellow'], ['green', 'green', 'green', 'green']))
      .toEqual({ correctColorAndPosition: 1, correctColorWrongPosition: 0 });
    expect(score(['red', 'green', 'blue', 'yellow'], ['blue', 'red', 'red', 'red']))
      .toEqual({ correctColorAndPosition: 0, correctColorWrongPosition: 2 });
  });
});

describe('isValidGuess', () => {
  const noDuplicates: GameConfig = { ...CLASSIC, allowDuplicates: false };

  it('accepts a guess of the right length from the palette', () => {
    expect(isValidGuess(['red', 'red', 'blue', 'purple'], CLASSIC)).toBe(true);
  });

  it('rejects a guess of the wrong length', () => {
    expect(isValidGuess(['red', 'green', 'blue'], CLASSIC)).toBe(false);
    expect(isValidGuess(['red', 'green', 'blue', 'yellow', 'orange'], CLASSIC)).toBe(false);
  });

  it('rejects a supported color that is not in the palette', () => {
    expect(isValidGuess(['red', 'green', 'blue', 'cyan'], CLASSIC)).toBe(false);
  });

  it('rejects duplicates when they are not allowed', () => {
    expect(isValidGuess(['red', 'red', 'blue', 'yellow'], noDuplicates)).toBe(false);
    expect(isValidGuess(['red', 'green', 'blue', 'yellow'], noDuplicates)).toBe(true);
  });
});
