import { expect, test } from '@playwright/test';
import { mainHeading, signInAs } from './fixtures';

const pad = (n: number) => String(n).padStart(2, '0');
function daysAgo(days: number) {
  const date = new Date(Date.now() - days * 86_400_000);
  return { iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, day: pad(date.getDate()), month: pad(date.getMonth() + 1), year: String(date.getFullYear()) };
}

test.describe('feedback explorer dates', () => {
  // An American browser: a native date input would show mm/dd/yyyy here, whatever the app language.
  test.use({ locale: 'en-US', timezoneId: 'Europe/Berlin' });

  test('types, shows and picks dates in the app language', async ({ page }) => {
    await signInAs(page, 'Manager', '/feedback');
    await expect(mainHeading(page)).toHaveText('Feedback');

    const results = page.locator('.results-bar__count');
    await expect(results).toContainText(/\d+ feedback/);
    const total = Number((await results.innerText()).match(/\d+/)?.[0]);

    const from = page.getByRole('textbox', { name: 'From' });
    await expect(from).toHaveAttribute('placeholder', 'DD/MM/YYYY');
    const start = daysAgo(30);
    await from.fill(`${start.day}/${start.month}/${start.year}`);
    await from.press('Enter');
    await expect(page).toHaveURL(new RegExp(`from=${start.iso}`));
    await expect.poll(async () => Number((await results.innerText()).match(/\d+/)?.[0])).toBeLessThan(total);

    // An impossible date is explained, and the filter is left alone.
    const to = page.getByRole('textbox', { name: 'To' });
    await to.fill('31/02/2026');
    await to.press('Enter');
    await expect(to).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a date as DD/MM/YYYY.')).toBeVisible();
    await expect(page).not.toHaveURL(/to=/);
    await to.fill('');
    await to.press('Enter');

    // The calendar: pick today with the keyboard.
    await page.getByRole('button', { name: 'To: choose a date' }).click();
    const calendar = page.getByRole('dialog', { name: 'To: calendar' });
    await expect(calendar).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(calendar).toBeHidden();
    const today = daysAgo(0);
    await expect(page).toHaveURL(new RegExp(`to=${today.iso}`));
    await expect(to).toHaveValue(`${today.day}/${today.month}/${today.year}`);

    // The filters survive a reload and follow a language switch.
    await page.reload();
    await expect(from).toHaveValue(`${start.day}/${start.month}/${start.year}`);
    await page.getByRole('button', { name: /Alex Morgan/ }).click();
    await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
    await expect(page.getByRole('textbox', { name: 'Von' })).toHaveValue(`${start.day}.${start.month}.${start.year}`);
    await expect(page.getByRole('textbox', { name: 'Von' })).toHaveAttribute('placeholder', 'TT.MM.JJJJ');
  });
});

test('person page shows feedback about someone five at a time', async ({ page }) => {
  await signInAs(page, 'Manager', '/people?q=maria');
  await page.getByRole('row', { name: /Maria Rossi/ }).click();
  await expect(mainHeading(page)).toHaveText('Maria Rossi');

  const about = page.getByRole('region', { name: 'Feedback about Maria' });
  await expect(about.getByRole('article')).toHaveCount(5);
  await expect(about.getByText('Showing 5 of 14')).toBeVisible();
  await about.getByRole('button', { name: 'Show 5 more' }).click();
  await expect(about.getByRole('article')).toHaveCount(10);
  await about.getByRole('button', { name: 'Show 4 more' }).click();
  await expect(about.getByRole('article')).toHaveCount(14);
  await expect(about.getByRole('button', { name: /Show \d+ more/ })).toHaveCount(0);
  // The summary still counts everything, not just the visible page.
  await expect(page.getByRole('region', { name: 'Sentiment summary' })).toContainText('14 feedback');
});
