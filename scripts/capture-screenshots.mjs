// Regenerates the README screenshots in docs/ from demo mode.
//
//   npm run build:mock && npm run preview:mock   # in one terminal
//   npm run docs:screenshots                     # in another
//
// BASE_URL overrides the server (default http://localhost:4180).
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4180';
const OUT = new URL('../docs/', import.meta.url);

const shots = [
  { file: 'dashboard-light.png', user: 'manager', path: '/dashboard', theme: 'light' },
  { file: 'people-light.png', user: 'manager', path: '/people', theme: 'light' },
  { file: 'recognition-light.png', user: 'jose', path: '/recognition', theme: 'light' },
  { file: 'person-dark.png', user: 'manager', person: 'Maria Rossi', theme: 'dark' },
  {
    file: 'give-recognition-mobile-dark.png',
    user: 'jose',
    path: '/recognition/give',
    theme: 'dark',
    mobile: true,
    async prepare(page) {
      await page.getByRole('combobox', { name: /Colleague/ }).fill('Louisa');
      await page.getByRole('option', { name: /Louisa Becker/ }).click();
      await page.getByRole('button', { name: 'Teamwork' }).click();
      await page.getByRole('textbox', { name: /Message/ }).fill('Thanks for pairing with me on the release checklist. You made a stressful launch feel calm.');
      await page.getByRole('textbox', { name: /Message/ }).blur();
    },
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: shot.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: shot.theme,
      locale: 'en-GB',
      reducedMotion: 'reduce',
    });
    await context.addInitScript(([user, theme]) => {
      sessionStorage.setItem('hr.mockUser', user);
      localStorage.setItem('hr.theme', theme);
      localStorage.setItem('hr.locale', 'en');
    }, [shot.user, shot.theme]);
    const page = await context.newPage();
    if (shot.person) {
      await page.goto(`${BASE_URL}/people`);
      await page.getByText(shot.person, { exact: true }).first().click();
      await page.waitForURL(/\/people\/[0-9a-f-]{36}$/);
    } else {
      await page.goto(`${BASE_URL}${shot.path}`);
    }
    await page.waitForLoadState('networkidle');
    await page.locator('[aria-busy="true"]').first().waitFor({ state: 'detached' }).catch(() => undefined);
    await shot.prepare?.(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: new URL(shot.file, OUT).pathname });
    console.log(`docs/${shot.file}`);
    await context.close();
  }
} finally {
  await browser.close();
}
