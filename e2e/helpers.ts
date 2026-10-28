import type { Page } from '@playwright/test';
import { CLASSIC, type Code, type SavedGame } from '../src/game';

export const SECRET: Code = ['red', 'green', 'blue', 'yellow'];

export function savedGame(guesses: readonly Code[] = [], secret: Code = SECRET): SavedGame {
  return { version: 1, config: CLASSIC, secret, guesses };
}

// Stores a game before the app loads, so its secret is known. Only on the first load of the
// tab: a reload then shows what the app saved itself.
export async function seedGame(page: Page, game: unknown): Promise<void> {
  await page.addInitScript(value => {
    if (!sessionStorage.getItem('e2e:seeded')) {
      sessionStorage.setItem('e2e:seeded', '1');
      localStorage.setItem('mastermind:game', value);
    }
  }, JSON.stringify(game));
}

// Picks each color with its palette button, named in English ('red' → 'Red').
export async function enterGuess(page: Page, guess: Code): Promise<void> {
  const palette = page.getByRole('group', { name: 'Colors' });
  for (const color of guess) {
    const name = color.charAt(0).toUpperCase() + color.slice(1);
    await palette.getByRole('button', { name, exact: true }).click();
  }
}

export function row(page: Page, n: number) {
  return page.getByRole('group', { name: `Guess ${n}`, exact: true });
}
