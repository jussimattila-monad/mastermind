import { describe, expect, it } from 'vitest';
import { ALL_COLORS, CLASSIC, makeGuess, newGame, startGame, type Code, type GameConfig, type StartedState } from '../game';
import { buildBoard, type DraftView } from './board';

// random() always 0 picks the first palette color for every peg.
const SECRET: Code = ['red', 'red', 'red', 'red'];
const WRONG: Code = ['green', 'red', 'blue', 'red'];
const EMPTY_DRAFT: DraftView = { slots: [null, null, null, null], active: 0 };

function started(config: GameConfig = CLASSIC): StartedState {
  return startGame(newGame(), config, () => 0);
}

describe('buildBoard', () => {
  it('shows a current row and empty rows for a new game', () => {
    const board = buildBoard(started(), EMPTY_DRAFT);
    expect(board.rows).toHaveLength(CLASSIC.maxGuesses);
    expect(board.rows[0]).toEqual({ kind: 'current', number: 1, pegs: EMPTY_DRAFT.slots, activeSlot: 0 });
    expect(board.rows.slice(1).every(row => row.kind === 'empty' && row.pegs.length === 4)).toBe(true);
    expect(board.rows.map(row => row.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(board.palette).toEqual(CLASSIC.colors.map((color, i) => ({ color, key: String(i + 1) })));
    expect(board.pegs).toBe(4);
    expect(board.guessesLeft).toBe(10);
    expect(board.playing).toBe(true);
    expect(board.result).toBeUndefined();
  });

  it('shows past guesses with feedback before the current row', () => {
    const draft: DraftView = { slots: ['blue', null, null, null], active: 1 };
    const board = buildBoard(makeGuess(started(), WRONG), draft);
    expect(board.rows[0]).toEqual({
      kind: 'past',
      number: 1,
      pegs: WRONG,
      feedback: { correctColorAndPosition: 2, correctColorWrongPosition: 0 },
    });
    expect(board.rows[1]).toEqual({ kind: 'current', number: 2, pegs: draft.slots, activeSlot: 1 });
    expect(board.rows).toHaveLength(10);
    expect(board.guessesLeft).toBe(9);
  });

  it('allows submitting only a complete, valid guess', () => {
    const state = started();
    expect(buildBoard(state, EMPTY_DRAFT).canSubmit).toBe(false);
    expect(buildBoard(state, { slots: ['red', 'red', 'red', null], active: 3 }).canSubmit).toBe(false);
    expect(buildBoard(state, { slots: ['red', 'red', 'red', 'red'], active: 3 }).canSubmit).toBe(true);
    expect(buildBoard(state, { slots: ['red', 'red', 'red', 'cyan'], active: 3 }).canSubmit).toBe(false);
  });

  it('does not allow repeated colors when the config forbids them', () => {
    const state = started({ ...CLASSIC, allowDuplicates: false });
    expect(buildBoard(state, { slots: ['red', 'red', 'blue', 'green'], active: 3 }).canSubmit).toBe(false);
    expect(buildBoard(state, { slots: ['red', 'yellow', 'blue', 'green'], active: 3 }).canSubmit).toBe(true);
  });

  it('keeps the secret out of the view while playing', () => {
    expect(JSON.stringify(buildBoard(started(), EMPTY_DRAFT))).not.toContain('"secret"');
  });

  it('shows the result and no current row when the game is won', () => {
    const state = makeGuess(makeGuess(started(), WRONG), SECRET);
    const full: DraftView = { slots: SECRET, active: 3 };
    const board = buildBoard(state, full);
    expect(board.playing).toBe(false);
    expect(board.canSubmit).toBe(false);
    expect(board.result).toEqual({ outcome: 'won', guessCount: 2, secret: SECRET });
    expect(board.rows.map(row => row.kind)).toEqual(['past', 'past', ...Array(8).fill('empty')]);
  });

  it('shows the result when the game is lost', () => {
    const state = makeGuess(started({ ...CLASSIC, maxGuesses: 1 }), WRONG);
    const board = buildBoard(state, EMPTY_DRAFT);
    expect(board.result).toEqual({ outcome: 'lost', guessCount: 1, secret: SECRET });
    expect(board.rows.map(row => row.kind)).toEqual(['past']);
    expect(board.guessesLeft).toBe(0);
  });

  it('gives only the first nine palette colors a key', () => {
    const colors = [...ALL_COLORS];
    const board = buildBoard(started({ ...CLASSIC, colors }), EMPTY_DRAFT);
    expect(board.palette.map(entry => entry.key)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', undefined]);
  });

  it('follows the config for row count and row length', () => {
    const board = buildBoard(started({ ...CLASSIC, pegs: 5, maxGuesses: 3 }), {
      slots: [null, null, null, null, null],
      active: 0,
    });
    expect(board.rows).toHaveLength(3);
    expect(board.rows.every(row => row.pegs.length === 5)).toBe(true);
  });
});
