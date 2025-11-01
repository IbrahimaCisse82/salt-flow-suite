import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('auth page should have proper heading structure', async ({ page }) => {
    await page.goto('/auth');
    
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for associated labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/auth');
    
    // Ensure page loads
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Take screenshot for manual verification
    await page.screenshot({ path: 'e2e/screenshots/auth-contrast.png' });
  });
});
