import { expect, type Page, test } from '@playwright/test';
import { savedGame, SECRET, seedGame } from './helpers';

// The visible area of phones in Chrome, below its toolbar: a Pixel, and a narrower phone on
// which the header wraps and the shorter-screen peg size applies.
const PHONES = [
  { name: 'Pixel', width: 412, height: 775 },
  { name: 'narrow phone', width: 360, height: 740 },
];

const RESULT_TEXTS = [
  { locale: 'en-US', won: 'Solved in 9 guesses!', buttons: ['Play again', 'Main menu'] },
  { locale: 'fi-FI', won: 'Ratkaistu 9 arvauksella!', buttons: ['Pelaa uudelleen', 'Päävalikko'] },
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

    // Finnish has the longest result texts, which wrap on a narrow phone.
    for (const language of RESULT_TEXTS) {
      test.describe(`in ${language.locale}`, () => {
        test.use({ locale: language.locale });

        test('shows the whole result of a finished game without scrolling', async ({ page }) => {
          const misses = (['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'red', 'green'] as const)
            .map(color => [color, color, color, color] as const);
          await seedGame(page, savedGame([...misses, SECRET]));
          await page.goto('./');

          await expect(page.getByRole('heading', { name: language.won })).toBeVisible();
          for (const name of language.buttons) {
            await expect(page.getByRole('button', { name })).toBeInViewport({ ratio: 1 });
          }
          await expectNoScroll(page);
        });
      });
    }
  });
}
