import { expect, test } from '@playwright/test';

test('loads under its base path without errors', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', error => errors.push(error.message));
  const failed: string[] = [];
  page.on('requestfailed', request => failed.push(request.url()));
  page.on('response', response => {
    if (response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('./');

  await expect(page).toHaveTitle('Mastermind');
  await expect(page.getByRole('heading', { name: 'Welcome to Mastermind' })).toBeVisible();
  // Every asset, the favicon included, comes from under the base path. The dev server's base is
  // `/`, so this checks something only against a build: `npm run preview` or a deployed URL.
  const favicon = await page.locator('link[rel="icon"]').evaluate(link => (link as HTMLLinkElement).href);
  expect(favicon.startsWith(baseURL ?? '')).toBe(true);
  expect((await page.request.get(favicon)).ok()).toBe(true);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('describes the classic rules', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByText('The code has 4 pegs, each one of 6 colors.')).toBeVisible();
  await expect(page.getByText('A color can appear more than once.')).toBeVisible();
  await expect(page.getByText('You have 10 guesses.')).toBeVisible();
});
