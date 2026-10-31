export * from './types';
export { MAX_GUESSES, MAX_PEGS, MIN_COLORS, validateConfig } from './config';
// score and generateSecret assume valid input; components go through startGame/makeGuess.
export { isValidGuess } from './score';
export { guessesLeft, makeGuess, newGame, startGame } from './game';
export { parseConfig, restoreGame, serializeGame, type SavedGame } from './save';
