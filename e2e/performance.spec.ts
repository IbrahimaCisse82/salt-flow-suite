import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('auth page should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have no console errors on auth page', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/auth');
    
    // Check for essential meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
    
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});
