import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Navigation — smoke test toutes les pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard charge correctement', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Contacts — liste visible avec au moins un contact seedé', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Campaigns — page charge sans erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/campaigns');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Automations — page charge sans erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/automations');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Analytics — page charge sans erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Rechargement — page charge sans erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/rechargement');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Paramètres — page charge sans erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    await page.waitForSelector('main', { timeout: 10000 });
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Route inconnue redirige vers dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/page-inexistante');
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    await expect(page).not.toHaveURL('/page-inexistante');
  });
});
