import { test, expect } from '@playwright/test';
import { login } from './helpers';

const SEEDED_CONTACT_ID = 'e6bd871b-3ee6-4529-8131-b82a24947c9c';

test.describe('Contact detail', () => {
  test('affiche les infos du contact seedé', async ({ page }) => {
    await login(page);

    await page.goto(`http://localhost:5173/contacts/${SEEDED_CONTACT_ID}`);
    await page.waitForSelector('text=Infos', { timeout: 10000 });

    await expect(page.locator('text=Infos')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Téléphone')).toBeVisible();
    await expect(page.locator('text=ui-test@example.com').first()).toBeVisible();
  });

  test('contact inconnu affiche une erreur ou redirige', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:5173/contacts/00000000-0000-0000-0000-000000000000');
    await page.waitForSelector('main', { timeout: 10000 });

    // Doit afficher une erreur 404 ou rediriger — jamais un crash JS
    await expect(page.locator('text=undefined')).not.toBeVisible();
    await expect(page.locator('text=Cannot read')).not.toBeVisible();
  });
});
