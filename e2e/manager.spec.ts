import { expect, test } from '@playwright/test';
import { mainHeading, signInAs } from './fixtures';

test.describe('manager', () => {
  test('dashboard shows KPIs, the sentiment chart and the alert about Maria', async ({ page }) => {
    await signInAs(page, 'Manager');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(mainHeading(page)).toHaveText('Dashboard');
    await expect(page.getByText('Demo mode', { exact: true })).toBeVisible();

    const kpis = page.getByRole('list', { name: 'Key figures' });
    await expect(kpis.getByRole('listitem').filter({ hasText: 'Headcount' })).toContainText('12');
    await expect(kpis.getByRole('listitem')).toHaveCount(4);

    const chart = page.getByRole('group', { name: /Stacked bar chart of feedback per month/ });
    await expect(chart.getByRole('img')).toHaveCount(6);
    await page.getByRole('button', { name: 'Show table' }).click();
    await expect(page.getByRole('table')).toContainText('Positive');

    const alerts = page.getByRole('region', { name: 'Alerts' });
    await expect(alerts).toContainText('dropped from 80% to 40% in the last 30 days');
    await alerts.getByRole('link', { name: 'Maria Rossi' }).click();
    await expect(mainHeading(page)).toHaveText('Maria Rossi');
    await expect(page.getByRole('heading', { name: 'Feedback about Maria' })).toBeVisible();
  });

  test('people list keeps sort and filters in the URL', async ({ page }) => {
    await signInAs(page, 'Manager', '/people?dept=Sales&sort=salary&dir=desc');

    const rows = page.getByRole('table').locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('Tom Fischer');
    await expect(page.getByRole('columnheader', { name: 'Salary' })).toHaveAttribute('aria-sort', 'descending');

    await page.getByRole('button', { name: 'Name', exact: true }).click();
    await expect(page).toHaveURL(/dept=Sales/);
    await expect(page).not.toHaveURL(/sort=/);
    await expect(rows.first()).toContainText('Aisha Bello');

    await page.getByRole('searchbox', { name: 'Search people' }).fill('maria');
    await expect(page).toHaveURL(/q=maria/);
    await expect(rows).toHaveCount(1);

    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Search people' })).toHaveValue('maria');
    await expect(rows).toHaveCount(1);

    await rows.first().click();
    await expect(page).toHaveURL(/\/people\/[0-9a-f-]{36}$/);
  });

  test('creates, edits and deletes a person', async ({ page }) => {
    await signInAs(page, 'Manager', '/people');

    await page.getByRole('link', { name: 'Add person' }).click();
    await page.getByRole('button', { name: 'Create person' }).click();
    await expect(page.getByText('This field is required.').first()).toBeVisible();

    await page.getByLabel('Username').fill('jose');
    await page.getByLabel('Full name').fill('Nora Lind');
    await page.getByLabel('Department').fill('People');
    await page.getByLabel('Job title').fill('HR Business Partner');
    await page.getByLabel('Salary').fill('0');
    await page.getByLabel('Email').fill('nora@example.com');
    await page.getByLabel('Address').fill('Hamburg, Germany');
    await page.getByRole('button', { name: 'Create person' }).click();
    await expect(page.getByText('Salary must be greater than 0.')).toBeVisible();

    await page.getByLabel('Salary').fill('66000');
    await page.getByRole('button', { name: 'Create person' }).click();
    await expect(page.getByText("Username 'jose' is already taken")).toBeVisible();

    await page.getByLabel('Username').fill('nora');
    await page.getByRole('button', { name: 'Create person' }).click();
    await expect(page.getByRole('status').getByText('Nora Lind was added')).toBeVisible();
    await expect(mainHeading(page)).toHaveText('Nora Lind');

    await page.getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByLabel('Username')).toHaveAttribute('readonly', '');
    await page.getByLabel('Job title').fill('Head of People');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').getByText('Changes to Nora Lind saved')).toBeVisible();
    await expect(page.getByText('Head of People').first()).toBeVisible();

    await page.getByRole('link', { name: 'Back to people' }).click();
    const row = page.getByRole('row', { name: /Nora Lind/ });
    await row.getByRole('button', { name: 'Actions for Nora Lind' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete Nora Lind?' });
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Delete person' }).click();
    await expect(page.getByRole('status').getByText('Nora Lind was deleted')).toBeVisible();
    await expect(page.getByRole('row', { name: /Nora Lind/ })).toHaveCount(0);
  });

  test('turns AI sentiment analysis off, and employees see it on the recognition form', async ({ page }) => {
    await signInAs(page, 'Manager', '/settings');

    const toggle = page.getByRole('switch', { name: 'AI sentiment analysis' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('status').getByText('AI sentiment analysis turned off')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('switch', { name: 'AI sentiment analysis' })).toHaveAttribute('aria-checked', 'false');

    await page.getByRole('button', { name: 'Switch role' }).click();
    await page.getByRole('button', { name: /Continue as Employee/ }).click();
    await page.goto('/recognition/give');
    await expect(page.getByText('AI analysis is disabled by your organisation.', { exact: false })).toBeVisible();
  });
});
