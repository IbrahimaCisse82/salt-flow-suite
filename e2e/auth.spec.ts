import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByRole('button', { name: /connexion/i }).click();
    
    // Check for validation messages
    await expect(page.locator('text=/requis/i')).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/auth');
    
    // Should start on login
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
    
    // Click to switch to signup
    await page.getByText(/créer un compte/i).click();
    await expect(page.getByRole('button', { name: /inscription/i })).toBeVisible();
    
    // Click to switch back to login
    await page.getByText(/déjà un compte/i).click();
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
  });
});
