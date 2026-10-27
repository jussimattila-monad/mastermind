export * from './types';
export { validateConfig } from './config';
// score and generateSecret assume valid input; components go through startGame/makeGuess.
export { isValidGuess } from './score';
export { guessesLeft, makeGuess, newGame, startGame } from './game';
