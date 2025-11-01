import { test, expect } from '@playwright/test';

test.describe('Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'manager@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('Complete Production to Sale Workflow', async ({ page }) => {
    // 1. Create a bassin
    await page.goto('/bassins');
    await page.click('button:has-text("Nouveau bassin")');
    await page.fill('input[name="name"]', 'Workflow Bassin');
    await page.fill('input[name="code"]', 'WF-001');
    await page.fill('input[name="area"]', '2000');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Workflow Bassin')).toBeVisible();

    // 2. Record production
    await page.goto('/production');
    await page.click('button:has-text("Nouvel enregistrement")');
    await page.selectOption('select[name="bassin_id"]', 'Workflow Bassin');
    await page.fill('input[name="quantity"]', '1000');
    await page.selectOption('select[name="salt_type"]', 'Gros');
    await page.click('button[type="submit"]');
    await expect(page.getByText('1000')).toBeVisible();

    // 3. Check stock increased
    await page.goto('/stocks');
    await expect(page.getByText(/1000/)).toBeVisible();

    // 4. Create a sale
    await page.goto('/commercial');
    await page.click('button:has-text("Nouvelle vente")');
    await page.selectOption('select[name="client_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '60');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/30000/)).toBeVisible();

    // 5. Verify stock decreased
    await page.goto('/stocks');
    await expect(page.getByText(/500/)).toBeVisible();

    // 6. Check dashboard reflects changes
    await page.goto('/');
    await expect(page.locator('[data-testid="production-stats"]')).toContainText('1000');
    await expect(page.locator('[data-testid="sales-stats"]')).toContainText('30000');
  });

  test('Complete HR Workflow: Attendance to Payment', async ({ page }) => {
    // 1. Record team attendance
    await page.goto('/equipes');
    await page.click('button:has-text("Pointage")');
    
    await page.click('input[type="checkbox"]'); // Select employees
    await page.fill('input[name="hours_worked"]', '8');
    await page.fill('input[name="hourly_rate"]', '50');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/400/)).toBeVisible(); // 8 * 50 = 400

    // 2. Validate attendance (manager)
    await page.click('button:has-text("Valider")');
    await page.click('button:has-text("Confirmer")');
    await expect(page.getByText('Validé')).toBeVisible();

    // 3. Process payment (accountant)
    await page.goto('/comptabilite');
    await page.click('button:has-text("RH")');
    await page.click('button:has-text("Payer")');
    
    await page.fill('input[name="payment_method"]', 'Espèces');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Payé')).toBeVisible();

    // 4. Verify in reports
    await page.goto('/rapports');
    await page.selectOption('select[name="report_type"]', 'rh');
    await expect(page.getByText(/400/)).toBeVisible();
  });

  test('Quality Control Workflow', async ({ page }) => {
    // 1. Create production record
    await page.goto('/production');
    await page.click('button:has-text("Nouvel enregistrement")');
    await page.selectOption('select[name="bassin_id"]', { index: 1 });
    await page.fill('input[name="quantity"]', '800');
    await page.click('button[type="submit"]');

    // 2. Add quality test
    await page.click('button:has-text("Tests qualité")');
    await page.click('button:has-text("Nouveau test")');
    
    await page.fill('input[name="humidity"]', '5');
    await page.fill('input[name="purity"]', '98');
    await page.fill('input[name="grain_size"]', '2.5');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/conforme/i)).toBeVisible();

    // 3. Generate quality certificate
    await page.click('button:has-text("Générer certificat")');
    await page.fill('input[name="certificate_number"]', 'CERT-001');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('CERT-001')).toBeVisible();

    // 4. View traceability
    await page.click('button:has-text("Traçabilité")');
    await expect(page.locator('[data-testid="traceability-chain"]')).toBeVisible();
    await expect(page.getByText(/bassin/i)).toBeVisible();
    await expect(page.getByText(/production/i)).toBeVisible();
    await expect(page.getByText(/test qualité/i)).toBeVisible();
  });

  test('Budget Tracking Workflow', async ({ page }) => {
    // 1. Create campaign budget
    await page.goto('/campagne');
    await page.click('button:has-text("Budget")');
    await page.click('button:has-text("Nouveau budget")');
    
    await page.fill('input[name="category"]', 'Main d\'œuvre');
    await page.fill('input[name="planned_amount"]', '50000');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('50000')).toBeVisible();

    // 2. Record expense
    await page.goto('/achats');
    await page.click('button:has-text("Nouvelle dépense")');
    
    await page.selectOption('select[name="category"]', 'Main d\'œuvre');
    await page.fill('input[name="amount"]', '10000');
    await page.fill('input[name="description"]', 'Salaires équipe');
    await page.click('button[type="submit"]');

    // 3. Check budget consumption
    await page.goto('/campagne');
    await page.click('button:has-text("Budget")');
    
    await expect(page.locator('[data-testid="budget-consumption"]')).toContainText('20%'); // 10000/50000
    await expect(page.locator('[data-testid="remaining-budget"]')).toContainText('40000');

    // 4. Set budget alert
    await page.click('button:has-text("Alertes")');
    await page.fill('input[name="alert_threshold"]', '80');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Alerte créée')).toBeVisible();
  });

  test('Reporting and Analytics Workflow', async ({ page }) => {
    // 1. Generate production report
    await page.goto('/rapports');
    await page.selectOption('select[name="report_type"]', 'production');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-12-31');
    await page.click('button:has-text("Générer")');
    
    await expect(page.locator('canvas')).toBeVisible(); // Chart
    await expect(page.getByText(/total production/i)).toBeVisible();

    // 2. Schedule automatic report
    await page.click('button:has-text("Planifier")');
    await page.selectOption('select[name="frequency"]', 'monthly');
    await page.fill('input[name="recipient_email"]', 'manager@example.com');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/rapport planifié/i)).toBeVisible();

    // 3. Export to PDF
    await page.click('button:has-text("Exporter PDF")');
    
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('rapport');

    // 4. View predictive analysis
    await page.click('button:has-text("Analyses prédictives")');
    await expect(page.getByText(/prévisions/i)).toBeVisible();
    await expect(page.locator('[data-testid="prediction-chart"]')).toBeVisible();
  });
});
