import { expect, test } from '@playwright/test';
import { enterGuess, row, savedGame, seedGame } from './helpers';

test('restores the game in progress after a reload', async ({ page }) => {
  await seedGame(page, savedGame([['orange', 'orange', 'orange', 'orange']]));
  await page.goto('./');
  await expect(page.getByText('9 guesses left')).toBeVisible();

  await enterGuess(page, ['red', 'red', 'red', 'red']);
  await page.getByRole('button', { name: 'Guess', exact: true }).click();
  await page.reload();

  await expect(page.getByText('8 guesses left')).toBeVisible();
  await expect(row(page, 2).getByRole('img', { name: '1 right place, 0 wrong place' })).toBeVisible();
});

test('starts at the welcome screen when the saved game is invalid', async ({ page }) => {
  await seedGame(page, { ...savedGame(), secret: ['red', 'not-a-color', 'blue', 'yellow'] });
  await page.goto('./');

  await expect(page.getByRole('heading', { name: 'Welcome to Mastermind' })).toBeVisible();
});

test('forgets the game after quitting', async ({ page }) => {
  await seedGame(page, savedGame());
  await page.goto('./');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Quit' }).click();
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Welcome to Mastermind' })).toBeVisible();
});
