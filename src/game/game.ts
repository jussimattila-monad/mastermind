import { validateConfig } from './config';
import { isValidGuess, score } from './score';
import { generateSecret } from './secret';
import { CLASSIC, type Code, type GameConfig, type GameState, type StartedState } from './types';

export function newGame(): GameState {
  return { status: 'setup' };
}

export function startGame(
  state: GameState,
  config: GameConfig = CLASSIC,
  random?: () => number,
): StartedState {
  if (state.status !== 'setup') {
    throw new Error(`Can't start a game in status '${state.status}'`);
  }
  validateConfig(config);
  // Copy so later changes to the caller's config can't alter a running game.
  const ownConfig = { ...config, colors: [...config.colors] };
  return { status: 'playing', config: ownConfig, secret: generateSecret(ownConfig, random), guesses: [] };
}

export function makeGuess(state: GameState, guess: Code): StartedState {
  if (state.status !== 'playing') {
    throw new Error(`Can't guess in status '${state.status}'`);
  }
  if (!isValidGuess(guess, state.config)) {
    throw new Error(`Invalid guess: ${guess.join(', ')}`);
  }

  const feedback = score(state.secret, guess);
  // Copy the guess so the caller can reuse its array (e.g. an input row) for the next guess.
  const guesses = [...state.guesses, { guess: [...guess], feedback }];
  const status = feedback.correctColorAndPosition === state.config.pegs ? 'won'
    : guesses.length >= state.config.maxGuesses ? 'lost'
    : 'playing';

  return { ...state, status, guesses };
}

export function guessesLeft(state: StartedState): number {
  return state.config.maxGuesses - state.guesses.length;
}
