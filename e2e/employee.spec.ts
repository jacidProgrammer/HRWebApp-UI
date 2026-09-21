import { expect, test } from '@playwright/test';
import { mainHeading, signInAs } from './fixtures';

test.describe('employee', () => {
  test('sees received recognition on the home page', async ({ page }) => {
    await signInAs(page, 'Employee');

    await expect(page).toHaveURL(/\/recognition$/);
    await expect(page.getByRole('heading', { name: 'Hi José' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Received/ })).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel');
    await expect(panel.getByRole('article').first()).toContainText('unblocked three teams');
    await expect(panel.getByText('Anonymous').first()).toBeVisible();
  });

  test('gives recognition anonymously and finds it under Sent', async ({ page }) => {
    await signInAs(page, 'Employee');
    await page.getByRole('link', { name: 'Give recognition' }).first().click();
    await expect(mainHeading(page)).toHaveText('Give recognition');
    await expect(page.getByText('This message is analysed by an AI sentiment model', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'Send recognition' }).click();
    await expect(page.getByText('Choose who you want to recognise.')).toBeVisible();

    const combobox = page.getByRole('combobox', { name: 'Colleague' });
    await combobox.fill('lou');
    await expect(page.getByRole('option')).toHaveCount(1);
    await combobox.press('ArrowDown');
    await combobox.press('Enter');
    await expect(combobox).toHaveValue('Louisa Becker');

    await page.getByRole('button', { name: 'Growth' }).click();
    await expect(page.getByRole('button', { name: 'Growth' })).toHaveAttribute('aria-pressed', 'true');
    const message = 'Thank you for the brilliant retro facilitation this week!';
    await page.getByLabel('Message').fill(message);
    await page.getByRole('switch', { name: 'Send anonymously' }).click();
    await page.getByRole('button', { name: 'Send recognition' }).click();

    await expect(page.getByRole('status').getByText('Recognition sent to Louisa Becker')).toBeVisible();
    await expect(page).toHaveURL(/\/recognition\?tab=sent$/);
    const card = page.getByRole('tabpanel').getByRole('article').first();
    await expect(card).toContainText(message);
    await expect(card).toContainText('Sent anonymously');
    await expect(card).toContainText('Growth');
  });

  test('shows the message counter only near the 500-character limit', async ({ page }) => {
    await signInAs(page, 'Employee', '/recognition/give');
    const message = page.getByLabel('Message');
    await message.fill('x'.repeat(100));
    await expect(page.getByText(/characters left/)).toHaveCount(0);
    await message.fill('x'.repeat(480));
    await expect(page.getByText('20 characters left')).toBeVisible();
  });

  test('edits their own contact details', async ({ page }) => {
    await signInAs(page, 'Employee');
    await page.getByRole('link', { name: 'My profile' }).click();
    await expect(page.getByText('€75,600')).toBeVisible();

    const email = page.getByLabel('Email');
    await email.fill('not-an-email');
    await email.blur();
    await expect(page.getByText('Enter a valid email address', { exact: false })).toBeVisible();

    await email.fill('jose.antonio@example.com');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').getByText('Profile updated')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Email')).toHaveValue('jose.antonio@example.com');
  });

  test('cannot reach manager pages and sees no salaries in the directory', async ({ page }) => {
    await signInAs(page, 'Employee');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

    for (const path of ['/dashboard', '/settings', '/feedback', '/people/new']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
    }

    await page.goto('/people');
    await expect(mainHeading(page)).toHaveText('Directory');
    await expect(page.getByRole('columnheader', { name: 'Salary' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Actions for/ })).toHaveCount(0);
  });

  test('switches the language to German and remembers it', async ({ page }) => {
    await signInAs(page, 'Employee');
    await page.getByRole('button', { name: /Account menu/ }).click();
    await page.getByRole('menuitemradio', { name: 'Deutsch' }).click();
    await expect(mainHeading(page)).toHaveText('Meine Anerkennung');
    await page.reload();
    await expect(mainHeading(page)).toHaveText('Meine Anerkennung');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
