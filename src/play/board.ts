import { guessesLeft, isValidGuess, type Code, type Color, type Feedback, type StartedState } from '../game';
import type { Slot } from './guess-draft';

// Plain data describing what the board shows. Templates bind to this and nothing else,
// so the board's look can change without touching the rules or the input logic.

export interface RowView {
  readonly kind: 'past' | 'current' | 'empty';
  // 1-based, as shown to the player.
  readonly number: number;
  readonly pegs: readonly Slot[];
  // Only on the current row.
  readonly activeSlot?: number;
  // Only on past rows.
  readonly feedback?: Feedback;
}

export interface ResultView {
  readonly outcome: 'won' | 'lost';
  readonly guessCount: number;
  readonly secret: Code;
}

export interface BoardView {
  readonly rows: readonly RowView[];
  readonly palette: readonly Color[];
  readonly pegs: number;
  readonly guessesLeft: number;
  readonly playing: boolean;
  readonly canSubmit: boolean;
  // Only once the game is over, so the secret is never in the view while playing.
  readonly result?: ResultView;
}

export interface DraftView {
  readonly slots: readonly Slot[];
  readonly active: number;
}

export function buildBoard(state: StartedState, draft: DraftView): BoardView {
  const { config } = state;
  const playing = state.status === 'playing';

  const rows: RowView[] = state.guesses.map((result, i) => ({
    kind: 'past',
    number: i + 1,
    pegs: result.guess,
    feedback: result.feedback,
  }));
  if (playing) {
    rows.push({ kind: 'current', number: rows.length + 1, pegs: draft.slots, activeSlot: draft.active });
  }
  while (rows.length < config.maxGuesses) {
    rows.push({ kind: 'empty', number: rows.length + 1, pegs: Array<Slot>(config.pegs).fill(null) });
  }

  const code = draft.slots.filter((slot): slot is Color => slot !== null);
  const canSubmit = playing && code.length === draft.slots.length && isValidGuess(code, config);

  return {
    rows,
    palette: config.colors,
    pegs: config.pegs,
    guessesLeft: guessesLeft(state),
    playing,
    canSubmit,
    result: state.status === 'playing' ? undefined : {
      outcome: state.status,
      guessCount: state.guesses.length,
      secret: state.secret,
    },
  };
}
