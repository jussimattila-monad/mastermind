import { expect, test } from '@playwright/test';

test('switches the language and remembers it', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Language').selectOption('sv');

  await expect(page.getByRole('heading', { name: 'Välkommen till Mastermind' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Spela klassisk Mastermind' })).toBeVisible();
  await expect(page.getByLabel('Språk')).toHaveValue('sv');
});

test.describe('in a Finnish browser', () => {
  test.use({ locale: 'fi-FI' });

  test('starts in Finnish', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('heading', { name: 'Tervetuloa pelaamaan Mastermindia' })).toBeVisible();
    await expect(page.getByLabel('Kieli')).toHaveValue('fi');
  });
});
