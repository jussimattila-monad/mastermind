import { expect, type Page, test } from '@playwright/test';
import { savedGame, SECRET, seedGame } from './helpers';

// The visible area of phones in Chrome, below its toolbar: a Pixel, and a narrower phone on
// which the header wraps and the shorter-screen peg size applies.
const PHONES = [
  { name: 'Pixel', width: 412, height: 775 },
  { name: 'narrow phone', width: 360, height: 740 },
];

async function expectNoScroll(page: Page): Promise<void> {
  const { scroll, viewport } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }));
  expect(scroll).toBeLessThanOrEqual(viewport);
}

for (const phone of PHONES) {
  test.describe(`on a ${phone.name} (${phone.width}×${phone.height})`, () => {
    test.use({ viewport: { width: phone.width, height: phone.height } });

    test('shows the whole game without scrolling', async ({ page }) => {
      await page.goto('./');
      await page.getByRole('button', { name: 'Play classic Mastermind' }).click();

      await expect(page.getByRole('button', { name: 'Quit' })).toBeInViewport({ ratio: 1 });
      await expectNoScroll(page);
    });

    test('shows the whole result of a long game without scrolling', async ({ page }) => {
      const misses = (['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'red', 'green'] as const)
        .map(color => [color, color, color, color] as const);
      await seedGame(page, savedGame([...misses, SECRET]));
      await page.goto('./');

      await expect(page.getByRole('heading', { name: 'Solved in 9 guesses!' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Play again' })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole('button', { name: 'Main menu' })).toBeInViewport({ ratio: 1 });
      await expectNoScroll(page);
    });
  });
}
