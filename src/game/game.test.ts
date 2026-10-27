import { describe, expect, it } from 'vitest';
import { guessesLeft, makeGuess, newGame, startGame } from './game';
import { CLASSIC, type Code, type Color, type GameConfig, type StartedState } from './types';

// random() always 0 picks the first palette color for every peg.
const SECRET: Code = ['red', 'red', 'red', 'red'];
const WRONG: Code = ['green', 'green', 'green', 'green'];

function started(config: GameConfig = CLASSIC): StartedState {
  return startGame(newGame(), config, () => 0);
}

describe('game', () => {
  it('starts in setup', () => {
    expect(newGame()).toEqual({ status: 'setup' });
  });

  it('moves from setup to playing with a secret', () => {
    const state = started();
    expect(state.status).toBe('playing');
    expect(state.secret).toEqual(SECRET);
    expect(state.guesses).toEqual([]);
    expect(guessesLeft(state)).toBe(CLASSIC.maxGuesses);
  });

  it('uses the classic config by default', () => {
    expect(startGame(newGame()).config).toEqual(CLASSIC);
  });

  it('keeps its own copy of the config', () => {
    const colors: Color[] = ['red', 'green', 'blue'];
    const state = started({ ...CLASSIC, colors });
    colors.push('cyan');
    expect(state.config.colors).toEqual(['red', 'green', 'blue']);
  });

  it('keeps CLASSIC frozen', () => {
    expect(Object.isFrozen(CLASSIC)).toBe(true);
    expect(Object.isFrozen(CLASSIC.colors)).toBe(true);
  });

  it('rejects an invalid config', () => {
    expect(() => startGame(newGame(), { ...CLASSIC, colors: [] })).toThrow();
  });

  it('cannot start a game that is already started', () => {
    expect(() => startGame(started())).toThrow(/playing/);
  });

  it('cannot guess during setup', () => {
    expect(() => makeGuess(newGame(), SECRET)).toThrow(/setup/);
  });

  it('records a guess with feedback', () => {
    const state = makeGuess(started(), ['red', 'green', 'red', 'blue']);
    expect(state.status).toBe('playing');
    expect(state.guesses).toEqual([{
      guess: ['red', 'green', 'red', 'blue'],
      feedback: { correctColorAndPosition: 2, correctColorWrongPosition: 0 },
    }]);
    expect(guessesLeft(state)).toBe(CLASSIC.maxGuesses - 1);
  });

  it('does not mutate the previous state', () => {
    const before = started();
    makeGuess(before, WRONG);
    expect(before.guesses).toEqual([]);
  });

  it('keeps its own copy of the guess', () => {
    const row: Color[] = ['red', 'green', 'red', 'blue'];
    const state = makeGuess(started(), row);
    row.fill('yellow');
    expect(state.guesses[0].guess).toEqual(['red', 'green', 'red', 'blue']);
  });

  it('rejects an invalid guess', () => {
    expect(() => makeGuess(started(), ['red', 'red', 'red'])).toThrow(/Invalid guess/);
    expect(() => makeGuess(started(), ['red', 'red', 'red', 'cyan'])).toThrow(/Invalid guess/);
    expect(() => makeGuess(started({ ...CLASSIC, allowDuplicates: false }), ['red', 'red', 'blue', 'green']))
      .toThrow(/Invalid guess/);
  });

  it('is won when the code is guessed', () => {
    const state = makeGuess(makeGuess(started(), WRONG), SECRET);
    expect(state.status).toBe('won');
    expect(() => makeGuess(state, SECRET)).toThrow(/won/);
  });

  it('is lost when out of guesses', () => {
    let state = started({ ...CLASSIC, maxGuesses: 3 });
    state = makeGuess(state, WRONG);
    state = makeGuess(state, WRONG);
    expect(state.status).toBe('playing');
    state = makeGuess(state, WRONG);
    expect(state.status).toBe('lost');
    expect(guessesLeft(state)).toBe(0);
    expect(() => makeGuess(state, SECRET)).toThrow(/lost/);
  });

  it('is won, not lost, when the last guess is correct', () => {
    const state = makeGuess(started({ ...CLASSIC, maxGuesses: 1 }), SECRET);
    expect(state.status).toBe('won');
  });
});
