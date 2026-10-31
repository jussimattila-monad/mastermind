import { expect, test, type Page } from '@playwright/test';

const rules = (page: Page) => page.getByRole('region', { name: 'Custom rules' });

async function editRules(page: Page, pegs: string, guesses: string): Promise<void> {
  await rules(page).getByRole('button', { name: 'Edit custom rules' }).click();
  await page.getByLabel('Pegs', { exact: true }).fill(pegs);
  await page.getByLabel('Guesses', { exact: true }).fill(guesses);
}

test('shows the default custom rules', async ({ page }) => {
  await page.goto('./');

  await expect(rules(page).getByText('Pegs: 6')).toBeVisible();
  await expect(rules(page).getByText('Colors: 6')).toBeVisible();
  await expect(rules(page).getByText('Guesses: 10')).toBeVisible();
  await expect(rules(page).getByText('Duplicates: allowed')).toBeVisible();
});

test('plays a game with the saved custom rules', async ({ page }) => {
  await page.goto('./');
  await editRules(page, '3', '5');
  await page.getByLabel('Allow a color more than once').uncheck();
  await page.getByRole('checkbox', { name: 'Black' }).check();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(rules(page).getByText('Pegs: 3')).toBeVisible();
  await expect(rules(page).getByText('Colors: 7')).toBeVisible();
  await expect(rules(page).getByText('Duplicates: not allowed')).toBeVisible();
  await rules(page).getByRole('button', { name: 'Play custom Mastermind' }).click();

  await expect(page.getByText('5 guesses left')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Position \d+: empty$/ })).toHaveCount(3);
  await expect(page.getByRole('group', { name: 'Colors' }).getByRole('button')).toHaveCount(7);
});

test('keeps the saved custom rules after a reload and after quitting', async ({ page }) => {
  await page.goto('./');
  await editRules(page, '5', '8');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(rules(page).getByText('Pegs: 5')).toBeVisible();

  await rules(page).getByRole('button', { name: 'Play custom Mastermind' }).click();
  await expect(page.getByText('8 guesses left')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Quit' }).click();

  await expect(rules(page).getByText('Pegs: 5')).toBeVisible();
  await expect(rules(page).getByText('Guesses: 8')).toBeVisible();
});

test('plays again with the custom rules', async ({ page }) => {
  await page.goto('./');
  await editRules(page, '2', '1');
  await page.getByRole('button', { name: 'Save' }).click();
  await rules(page).getByRole('button', { name: 'Play custom Mastermind' }).click();

  await page.getByRole('group', { name: 'Colors' }).getByRole('button', { name: 'Red', exact: true }).click();
  await page.getByRole('group', { name: 'Colors' }).getByRole('button', { name: 'Red', exact: true }).click();
  await page.getByRole('button', { name: 'Guess', exact: true }).click();
  // One guess: either solved or lost, then play again keeps two pegs and one guess.
  await page.getByRole('button', { name: 'Play again' }).click();

  await expect(page.getByText('1 guess left')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Position \d+: empty$/ })).toHaveCount(2);
});

test('does not save invalid rules', async ({ page }) => {
  await page.goto('./');
  await rules(page).getByRole('button', { name: 'Edit custom rules' }).click();
  const save = page.getByRole('button', { name: 'Save' });
  const play = rules(page).getByRole('button', { name: 'Play custom Mastermind' });
  await expect(play).toBeDisabled();

  for (const color of ['Red', 'Green', 'Blue', 'Yellow', 'Orange']) {
    await page.getByRole('checkbox', { name: color }).uncheck();
  }
  await expect(page.getByRole('alert')).toHaveText('Choose at least 2 colors.');
  await expect(save).toBeDisabled();

  await page.getByRole('checkbox', { name: 'Red' }).check();
  await page.getByRole('checkbox', { name: 'Green' }).check();
  await page.getByLabel('Allow a color more than once').uncheck();
  await expect(page.getByRole('alert')).toContainText('6 pegs need at least 6 colors');
  await page.getByLabel('Pegs', { exact: true }).fill('11');
  await expect(page.getByRole('alert')).toHaveText('Pegs must be a whole number from 1 to 10.');

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(rules(page).getByText('Pegs: 6')).toBeVisible();
  await expect(play).toBeEnabled();
});

test('falls back to the default rules when the saved ones are corrupt', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mastermind:custom', '{"pegs":99}'));
  await page.goto('./');

  await expect(rules(page).getByText('Pegs: 6')).toBeVisible();
});

test('still plays classic Mastermind', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Play classic Mastermind' }).click();

  await expect(page.getByText('10 guesses left')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Position \d+: empty$/ })).toHaveCount(4);
});
