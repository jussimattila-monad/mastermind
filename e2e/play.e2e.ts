import { expect, test } from '@playwright/test';
import { enterGuess, row, savedGame, SECRET, seedGame } from './helpers';

test.describe('a new game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Play classic Mastermind' }).click();
  });

  test('starts with an empty current row', async ({ page }) => {
    await expect(page.getByText('10 guesses left')).toBeVisible();
    for (let n = 1; n <= 4; n++) {
      await expect(row(page, 1).getByRole('button', { name: `Position ${n}: empty` })).toBeVisible();
    }
  });

  test('can submit only a full row', async ({ page }) => {
    const submit = page.getByRole('button', { name: 'Guess', exact: true });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');

    await enterGuess(page, ['red', 'red', 'red']);
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
    // Playwright won't click an aria-disabled button; Enter tries to submit anyway.
    await page.keyboard.press('Enter');
    await expect(page.getByText('10 guesses left')).toBeVisible();

    await enterGuess(page, ['red']);
    await expect(submit).toHaveAttribute('aria-disabled', 'false');
  });

  test('picks colors by click and fills the active slot', async ({ page }) => {
    await enterGuess(page, ['blue', 'green']);
    await expect(row(page, 1).getByRole('button', { name: 'Position 1: Blue' })).toBeVisible();
    await expect(row(page, 1).getByRole('button', { name: 'Position 2: Green' })).toBeVisible();

    // Selecting a slot makes the next pick replace it.
    await row(page, 1).getByRole('button', { name: 'Position 1: Blue' }).click();
    await enterGuess(page, ['yellow']);
    await expect(row(page, 1).getByRole('button', { name: 'Position 1: Yellow' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(row(page, 1).getByRole('button', { name: /: empty$/ })).toHaveCount(4);
  });

  test('plays with the keyboard', async ({ page }) => {
    // Number keys pick palette colors: 1 red, 2 green, 3 blue.
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await expect(row(page, 1).getByRole('button', { name: 'Position 3: Blue' })).toBeVisible();

    await page.keyboard.press('Backspace');
    await expect(row(page, 1).getByRole('button', { name: 'Position 3: empty' })).toBeVisible();

    await page.keyboard.press('3');
    await page.keyboard.press('3');
    await page.keyboard.press('Enter');
    await expect(page.getByText('9 guesses left')).toBeVisible();
    await expect(row(page, 1).getByRole('img', { name: /right place/ })).toBeVisible();
  });

  test('keeps keyboard focus on the board after a guess', async ({ page }) => {
    await row(page, 1).getByRole('button', { name: 'Position 1: empty' }).focus();
    for (const key of ['1', '1', '1', '1', 'Enter']) {
      await page.keyboard.press(key);
    }

    await expect(page.getByText('9 guesses left')).toBeVisible();
    await expect(row(page, 2).getByRole('button', { name: 'Position 1: empty' })).toBeFocused();
  });

  test('asks before quitting', async ({ page }) => {
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Quit' }).click();
    await expect(page.getByText('10 guesses left')).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Quit' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to Mastermind' })).toBeVisible();
  });
});

test.describe('with a known secret', () => {
  test.beforeEach(async ({ page }) => {
    await seedGame(page, savedGame());
    await page.goto('./');
  });

  test('scores a guess with black and white pegs', async ({ page }) => {
    // Secret red green blue yellow: red is in place, green and blue are misplaced.
    await enterGuess(page, ['red', 'blue', 'green', 'orange']);
    await page.getByRole('button', { name: 'Guess', exact: true }).click();

    await expect(row(page, 1).getByRole('img', { name: '1 right place, 2 wrong place' })).toBeVisible();
    await expect(row(page, 1).getByRole('img', { name: 'Red' })).toBeVisible();
  });

  test('wins by guessing the secret', async ({ page }) => {
    await enterGuess(page, SECRET);
    await page.getByRole('button', { name: 'Guess', exact: true }).click();

    const heading = page.getByRole('heading', { name: 'Solved in 1 guess!' });
    await expect(heading).toBeFocused();
    await expect(page.getByRole('group', { name: 'The secret code' }).getByRole('img')).toHaveCount(4);
    await expect(page.getByRole('group', { name: 'Colors' })).toBeHidden();

    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page.getByText('10 guesses left')).toBeVisible();
    await expect(row(page, 1).getByRole('button', { name: /: empty$/ })).toHaveCount(4);
  });

  test('loses after the last wrong guess and shows the secret', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'The secret code' })).toHaveCount(0);
    for (let n = 1; n <= 10; n++) {
      await enterGuess(page, ['orange', 'orange', 'orange', 'orange']);
      await page.getByRole('button', { name: 'Guess', exact: true }).click();
    }

    await expect(page.getByRole('heading', { name: 'Out of guesses.' })).toBeVisible();
    const secret = page.getByRole('group', { name: 'The secret code' }).getByRole('img');
    await expect(secret).toHaveCount(4);
    for (const [i, color] of ['Red', 'Green', 'Blue', 'Yellow'].entries()) {
      await expect(secret.nth(i)).toHaveAccessibleName(color);
    }

    await page.getByRole('button', { name: 'Main menu' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to Mastermind' })).toBeVisible();
  });
});
