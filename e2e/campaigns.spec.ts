import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Campaigns — création et liste', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:5173/campaigns');
    await page.waitForSelector('main', { timeout: 10000 });
  });

  test('page campagnes affiche un bouton de création', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /nouvelle|créer|campagne/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 8000 });
  });

  test('ouverture du wizard de création de campagne', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /nouvelle|créer|campagne/i }).first();
    await createBtn.click();

    // Le wizard doit apparaître (modal ou page)
    await page.waitForSelector('[class*="wizard"], [class*="modal"], [class*="step"], form', {
      timeout: 8000,
    });

    // Étape 1 : champ nom de la campagne
    const nameInput = page
      .locator('input[placeholder*="nom"], input[name*="name"], input[placeholder*="campagne"]')
      .first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });

    // Saisir un nom
    await nameInput.fill('Campagne E2E Test');
    await expect(nameInput).toHaveValue('Campagne E2E Test');
  });

  test('liste vide affiche un état vide cohérent', async ({ page }) => {
    // La page doit afficher soit des campagnes soit un état vide — jamais une erreur crash
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Pas d'erreur "undefined" ou stack trace visible
    await expect(page.locator('text=undefined')).not.toBeVisible();
    await expect(page.locator('text=Cannot read')).not.toBeVisible();
  });
});
