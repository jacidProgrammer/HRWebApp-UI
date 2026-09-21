import { expect, type Page } from '@playwright/test';

/** Demo mode: choose a role on the picker instead of signing in with Keycloak. */
export async function signInAs(page: Page, role: 'Manager' | 'Employee', path = '/') {
  await page.goto(path);
  await page.getByRole('button', { name: new RegExp(`Continue as ${role}`) }).click();
  await expect(page.getByRole('banner')).toBeVisible();
}

export const mainHeading = (page: Page) => page.getByRole('banner').getByRole('heading', { level: 1 });
