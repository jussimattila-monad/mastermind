import { validateConfig } from './config';
import { makeGuess } from './game';
import { isValidGuess } from './score';
import { ALL_COLORS, type Code, type Color, type GameConfig, type StartedState } from './types';

// Only the inputs are saved; feedback and status are derived again on restore.
export interface SavedGame {
  readonly version: 1;
  readonly config: GameConfig;
  readonly secret: Code;
  readonly guesses: readonly Code[];
}

export function serializeGame(state: StartedState): SavedGame {
  return {
    version: 1,
    config: state.config,
    secret: state.secret,
    guesses: state.guesses.map(result => result.guess),
  };
}

// Returns undefined for anything that isn't a valid, consistent saved game
// (e.g. corrupt storage, or guesses recorded after the game ended).
export function restoreGame(data: unknown): StartedState | undefined {
  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.guesses)) {
    return undefined;
  }
  const config = toConfig(data.config);
  const secret = toCode(data.secret);
  if (!config || !secret) {
    return undefined;
  }
  const guesses: Code[] = [];
  for (const item of data.guesses) {
    const guess = toCode(item);
    if (!guess) {
      return undefined;
    }
    guesses.push(guess);
  }

  try {
    validateConfig(config);
    if (!isValidGuess(secret, config)) {
      return undefined;
    }
    // Replaying through makeGuess re-validates every guess and recomputes feedback and status.
    let state: StartedState = { status: 'playing', config, secret, guesses: [] };
    for (const guess of guesses) {
      state = makeGuess(state, guess);
    }
    return state;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isColor(value: unknown): value is Color {
  return (ALL_COLORS as readonly unknown[]).includes(value);
}

function toCode(value: unknown): Code | undefined {
  return Array.isArray(value) && value.every(isColor) ? [...value] : undefined;
}

function toConfig(value: unknown): GameConfig | undefined {
  if (!isRecord(value)
    || typeof value.pegs !== 'number'
    || typeof value.maxGuesses !== 'number'
    || typeof value.allowDuplicates !== 'boolean') {
    return undefined;
  }
  const colors = toCode(value.colors);
  if (!colors) {
    return undefined;
  }
  return { pegs: value.pegs, colors, maxGuesses: value.maxGuesses, allowDuplicates: value.allowDuplicates };
}
