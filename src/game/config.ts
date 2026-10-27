import type { GameConfig } from './types';

export function validateConfig(config: GameConfig): void {
  if (!Number.isInteger(config.pegs) || config.pegs < 1) {
    throw new Error(`pegs must be a positive integer, got ${config.pegs}`);
  }
  if (!Number.isInteger(config.maxGuesses) || config.maxGuesses < 1) {
    throw new Error(`maxGuesses must be a positive integer, got ${config.maxGuesses}`);
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
