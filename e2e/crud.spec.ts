import { test, expect } from '@playwright/test';

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test.describe('Bassins CRUD', () => {
    test('should create a new bassin', async ({ page }) => {
      await page.goto('/bassins');
      await page.click('button:has-text("Nouveau bassin")');
      
      await page.fill('input[name="name"]', 'Bassin E2E Test');
      await page.fill('input[name="code"]', 'E2E-001');
      await page.fill('input[name="area"]', '1000');
      
      await page.click('button[type="submit"]');
      
      await expect(page.getByText('Bassin E2E Test')).toBeVisible({ timeout: 5000 });
    });

    test('should update a bassin', async ({ page }) => {
      await page.goto('/bassins');
      
      // Find first bassin
      const firstBassin = page.locator('[data-testid="bassin-item"]').first();
      await firstBassin.click();
      
      // Edit
      await page.click('button:has-text("Modifier")');
      await page.fill('input[name="name"]', 'Bassin Updated');
      await page.click('button[type="submit"]');
      
      await expect(page.getByText('Bassin Updated')).toBeVisible({ timeout: 5000 });
    });

    test('should delete a bassin', async ({ page }) => {
      await page.goto('/bassins');
      
      const bassinName = await page.locator('[data-testid="bassin-item"]').first().textContent();
      
      await page.click('[data-testid="bassin-item"]:first-child button:has-text("Supprimer")');
      await page.click('button:has-text("Confirmer")');
      
      await expect(page.getByText(bassinName || '')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Employees CRUD', () => {
    test('should create a new employee', async ({ page }) => {
      await page.goto('/equipes');
      await page.click('button:has-text("Nouvel employé")');
      
      await page.fill('input[name="full_name"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="phone"]', '+33612345678');
      await page.selectOption('select[name="position"]', 'Ouvrier');
      
      await page.click('button[type="submit"]');
      
      await expect(page.getByText('John Doe')).toBeVisible({ timeout: 5000 });
    });

    test('should filter employees by status', async ({ page }) => {
      await page.goto('/equipes');
      
      await page.selectOption('select[name="status"]', 'active');
      
      const inactiveEmployees = page.locator('[data-testid="employee-inactive"]');
      await expect(inactiveEmployees).toHaveCount(0);
    });
  });

  test.describe('Production Records CRUD', () => {
    test('should create production record', async ({ page }) => {
      await page.goto('/production');
      await page.click('button:has-text("Nouvel enregistrement")');
      
      await page.selectOption('select[name="bassin_id"]', { index: 1 });
      await page.fill('input[name="quantity"]', '500');
      await page.selectOption('select[name="salt_type"]', 'Fin');
      
      await page.click('button[type="submit"]');
      
      await expect(page.getByText('500')).toBeVisible({ timeout: 5000 });
    });

    test('should view production analytics', async ({ page }) => {
      await page.goto('/production');
      await page.click('button:has-text("Analyses")');
      
      await expect(page.getByText(/rendement/i)).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible(); // Chart
    });
  });

  test.describe('Sales CRUD', () => {
    test('should create a sale', async ({ page }) => {
      await page.goto('/commercial');
      await page.click('button:has-text("Nouvelle vente")');
      
      await page.selectOption('select[name="client_id"]', { index: 1 });
      await page.fill('input[name="quantity"]', '100');
      await page.fill('input[name="unit_price"]', '50');
      
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/5000/)).toBeVisible({ timeout: 5000 });
    });
  });
});
