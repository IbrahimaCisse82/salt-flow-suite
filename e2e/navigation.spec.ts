import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-12345');
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByText(/page.*trouvée/i)).toBeVisible();
  });

  test('should have working back to home link on 404', async ({ page }) => {
    await page.goto('/invalid-route-12345');
    await page.getByRole('link', { name: /accueil/i }).click();
    await expect(page).toHaveURL(/\/auth/);
  });
});
