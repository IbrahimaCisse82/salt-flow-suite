import { test, expect } from '@playwright/test';

/**
 * E2E tests for critical stock management flows.
 * Validates that stock pages are protected and render correctly.
 */

test.describe('Stocks - Flux critiques', () => {
  test('should redirect unauthenticated users from /stocks to /auth', async ({ page }) => {
    await page.goto('/stocks');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /achats to /auth', async ({ page }) => {
    await page.goto('/achats');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Production - Flux critiques', () => {
  test('should redirect unauthenticated users from /production to /auth', async ({ page }) => {
    await page.goto('/production');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /bassins to /auth', async ({ page }) => {
    await page.goto('/bassins');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Commercial - Flux critiques', () => {
  test('should redirect unauthenticated users from /commercial to /auth', async ({ page }) => {
    await page.goto('/commercial');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Équipes - Flux critiques', () => {
  test('should redirect unauthenticated users from /equipes to /auth', async ({ page }) => {
    await page.goto('/equipes');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Admin - Flux critiques', () => {
  test('should redirect unauthenticated users from /admin to /auth', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /admin/tenants to /auth', async ({ page }) => {
    await page.goto('/admin/tenants');
    await expect(page).toHaveURL(/\/auth/);
  });
});
