import type { GameConfig } from './types';

// Upper bounds keep a hand-edited or corrupt saved game from building a board too large to render.
export const MAX_PEGS = 10;
export const MAX_GUESSES = 20;

export function validateConfig(config: GameConfig): void {
  if (!Number.isInteger(config.pegs) || config.pegs < 1 || config.pegs > MAX_PEGS) {
    throw new Error(`pegs must be an integer from 1 to ${MAX_PEGS}, got ${config.pegs}`);
  }
  if (!Number.isInteger(config.maxGuesses) || config.maxGuesses < 1 || config.maxGuesses > MAX_GUESSES) {
    throw new Error(`maxGuesses must be an integer from 1 to ${MAX_GUESSES}, got ${config.maxGuesses}`);
  }
  if (config.colors.length === 0) {
    throw new Error('colors must not be empty');
  }
  if (new Set(config.colors).size !== config.colors.length) {
    throw new Error('colors must not contain duplicates');
  }
  if (!config.allowDuplicates && config.pegs > config.colors.length) {
    throw new Error(
      `pegs (${config.pegs}) can't exceed the number of colors (${config.colors.length}) without duplicates`,
    );
  }
}
