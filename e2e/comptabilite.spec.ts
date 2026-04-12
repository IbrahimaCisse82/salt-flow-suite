import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for critical accounting (comptabilité) flows.
 * These tests validate navigation, page rendering, and key interactions
 * on accounting-related pages.
 *
 * Prerequisites: A running dev server and an authenticated user session.
 * In CI, use storageState for pre-authenticated sessions.
 */

test.describe('Comptabilité - Flux critiques', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth — in real CI, use storageState with pre-auth session
    await page.goto('/auth');
  });

  test('should redirect unauthenticated users from /comptabilite to /auth', async ({ page }) => {
    await page.goto('/comptabilite');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /comptabilite/grand-livre to /auth', async ({ page }) => {
    await page.goto('/comptabilite/grand-livre');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /comptabilite/rapprochement to /auth', async ({ page }) => {
    await page.goto('/comptabilite/rapprochement');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /comptabilite/operations-diverses to /auth', async ({ page }) => {
    await page.goto('/comptabilite/operations-diverses');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /comptabilite/cloture to /auth', async ({ page }) => {
    await page.goto('/comptabilite/cloture');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect unauthenticated users from /comptabilite/immobilisations to /auth', async ({ page }) => {
    await page.goto('/comptabilite/immobilisations');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('auth page should render login form', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connexion|se connecter/i })).toBeVisible({ timeout: 10000 });
  });

  test('auth page should have email and password fields', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('auth page should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();
    
    // Should show some error message (toast, inline error, etc.)
    await expect(
      page.getByText(/erreur|invalide|incorrect|échec/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
