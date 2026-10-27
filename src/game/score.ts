import type { Code, Color, Feedback, GameConfig } from './types';

export function score(secret: Code, guess: Code): Feedback {
  let correctColorAndPosition = 0;
  const secretLeft = new Map<Color, number>();
  const guessLeft = new Map<Color, number>();

  secret.forEach((color, i) => {
    if (color === guess[i]) {
      correctColorAndPosition++;
    } else {
      secretLeft.set(color, (secretLeft.get(color) ?? 0) + 1);
      guessLeft.set(guess[i], (guessLeft.get(guess[i]) ?? 0) + 1);
    }
  });

  let correctColorWrongPosition = 0;
  for (const [color, count] of guessLeft) {
    correctColorWrongPosition += Math.min(count, secretLeft.get(color) ?? 0);
  }

  return { correctColorAndPosition, correctColorWrongPosition };
}

export function isValidGuess(guess: Code, config: GameConfig): boolean {
  return guess.length === config.pegs
    && guess.every(color => config.colors.includes(color))
    && (config.allowDuplicates || new Set(guess).size === guess.length);
}
