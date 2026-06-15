import type { Page } from '@playwright/test';

export const E2E_EMAIL = 'novatest_20260507@example.com';
export const E2E_PASSWORD = 'TempPass123!';

export async function login(page: Page) {
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', E2E_EMAIL);
  await page.fill('input[type="password"]', E2E_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(onboarding|dashboard|contacts|automations|campaigns|analytics)/, {
    timeout: 15000,
  });

  if (page.url().includes('/onboarding')) {
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 15000 }),
      page.getByRole('button', { name: 'Terminer' }).click(),
    ]);
  }
}
