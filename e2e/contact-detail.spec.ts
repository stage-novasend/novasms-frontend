import { test, expect } from '@playwright/test';

async function loginAndResolveOnboarding(page) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'novatest_20260507@example.com');
  await page.fill('input[type="password"]', 'TempPass123!');
  await page.click('button:has-text("Se connecter")');

  await page.waitForURL(/\/(onboarding|dashboard|contacts)/, { timeout: 15000 });

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

test.describe('Contact detail smoke', () => {
  test('renders contact detail for existing contact', async ({ page }) => {
    // Use an existing contact id seeded earlier in the session
    const contactId = 'e6bd871b-3ee6-4529-8131-b82a24947c9c';

    // Perform UI login and finish onboarding if required
    await loginAndResolveOnboarding(page);

    // Now open the contact detail
    await page.goto(`http://localhost:5173/contacts/${contactId}`);

    // Wait for the contact info header to appear
    await page.waitForSelector('text=Infos', { timeout: 10000 });

    // Assert key pieces of contact info are visible
    await expect(page.locator('text=Infos')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Téléphone')).toBeVisible();

    // If the contact email is known (from seed), ensure it's displayed
    await expect(page.locator('text=ui-test@example.com').first()).toBeVisible();
  });
});
