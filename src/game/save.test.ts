import { describe, expect, it } from 'vitest';
import { makeGuess, newGame, startGame } from './game';
import { restoreGame, serializeGame } from './save';
import { CLASSIC, type Code, type GameConfig, type StartedState } from './types';

// random() always 0 picks the first palette color for every peg.
const SECRET: Code = ['red', 'red', 'red', 'red'];
const WRONG: Code = ['green', 'blue', 'red', 'green'];

function started(config: GameConfig = CLASSIC): StartedState {
  return startGame(newGame(), config, () => 0);
}

// Round trip through JSON, as localStorage would.
function roundTrip(state: StartedState): StartedState | undefined {
  return restoreGame(JSON.parse(JSON.stringify(serializeGame(state))));
}

describe('serializeGame / restoreGame', () => {
  it('restores a game in progress', () => {
    const state = makeGuess(started(), WRONG);
    expect(roundTrip(state)).toEqual(state);
  });

  it('restores a game with no guesses', () => {
    const state = started();
    expect(roundTrip(state)).toEqual(state);
  });

  it('restores a won game', () => {
    const state = makeGuess(makeGuess(started(), WRONG), SECRET);
    expect(state.status).toBe('won');
    expect(roundTrip(state)).toEqual(state);
  });

  it('restores a lost game', () => {
    const state = makeGuess(started({ ...CLASSIC, maxGuesses: 1 }), WRONG);
    expect(state.status).toBe('lost');
    expect(roundTrip(state)).toEqual(state);
  });

  it('saves only the inputs', () => {
    const saved = serializeGame(makeGuess(started(), WRONG));
    expect(saved).toEqual({ version: 1, config: CLASSIC, secret: SECRET, guesses: [WRONG] });
  });

  it('rejects data that is not a saved game', () => {
    for (const data of [undefined, null, 'game', 42, [], {}]) {
      expect(restoreGame(data)).toBeUndefined();
    }
  });

  const valid = serializeGame(makeGuess(started(), WRONG));

  it('rejects an unknown version', () => {
    expect(restoreGame({ ...valid, version: 2 })).toBeUndefined();
  });

  it('rejects a malformed or invalid config', () => {
    expect(restoreGame({ ...valid, config: null })).toBeUndefined();
    expect(restoreGame({ ...valid, config: { ...CLASSIC, pegs: '4' } })).toBeUndefined();
    expect(restoreGame({ ...valid, config: { ...CLASSIC, colors: ['red', 'magenta'] } })).toBeUndefined();
    expect(restoreGame({ ...valid, config: { ...CLASSIC, colors: [] } })).toBeUndefined();
  });

  it('rejects an invalid secret', () => {
    expect(restoreGame({ ...valid, secret: ['red', 'red', 'red'] })).toBeUndefined();
    expect(restoreGame({ ...valid, secret: ['red', 'red', 'red', 'cyan'] })).toBeUndefined();
    expect(restoreGame({ ...valid, secret: 'red' })).toBeUndefined();
  });

  it('rejects an invalid guess', () => {
    expect(restoreGame({ ...valid, guesses: [['red', 'red']] })).toBeUndefined();
    expect(restoreGame({ ...valid, guesses: ['red'] })).toBeUndefined();
    expect(restoreGame({ ...valid, guesses: null })).toBeUndefined();
  });

  it('rejects guesses after the game ended', () => {
    expect(restoreGame({ ...valid, guesses: [SECRET, WRONG] })).toBeUndefined();
    const oneGuess = { ...CLASSIC, maxGuesses: 1 };
    expect(restoreGame({ ...valid, config: oneGuess, guesses: [WRONG, WRONG] })).toBeUndefined();
  });
});
