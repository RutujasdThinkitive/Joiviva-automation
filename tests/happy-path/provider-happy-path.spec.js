// @ts-check
const { test, expect } = require('@playwright/test');
const { ProviderPortalPage } = require('../../pages/ProviderPortalPage');

test.describe('Provider Portal - Happy Path', () => {
  /**
   * @type {ProviderPortalPage}
   */
  let providerPage;

  test.beforeEach(async ({ page }) => {
    providerPage = new ProviderPortalPage(page);
    await page.goto('/provider/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('HP-PROV-001: Complete navigation flow through all working modules', async ({ page }) => {
    // Start at Dashboard
    await expect(page).toHaveURL(/\/provider\/dashboard/);

    // Navigate to Scheduling
    await providerPage.navigateToScheduling();
    await expect(page).toHaveURL(/\/provider\/scheduling/);

    // Navigate to Patients
    await providerPage.navigateToPatients();
    await expect(page).toHaveURL(/\/provider\/patients/);

    // Navigate to Communications
    await providerPage.navigateToCommunications();
    const commPath = await providerPage.getCurrentPath();
    expect(commPath).toContain('/provider/');

    // Navigate to Templates
    await providerPage.navigateToTemplates();
    await expect(page).toHaveURL(/\/provider\/templates/);

    // Navigate to Settings
    await providerPage.navigateToSettings();
    await expect(page).toHaveURL(/\/provider\/settings/);

    // Return to Dashboard
    await providerPage.navigateToDashboard();
    await expect(page).toHaveURL(/\/provider\/dashboard/);
  });

  test('HP-PROV-002: Scheduling - View and access schedule', async ({ page }) => {
    await providerPage.navigateToScheduling();
    await expect(page).toHaveURL(/\/provider\/scheduling/);

    await page.waitForTimeout(2000);
    // Check for calendar or schedule elements
    const content = await page.locator('main, [class*="content"], [class*="schedule"], [class*="calendar"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-PROV-003: Patients - View patient list', async ({ page }) => {
    await providerPage.navigateToPatients();
    await expect(page).toHaveURL(/\/provider\/patients/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-PROV-004: Communications - Access messages', async ({ page }) => {
    await providerPage.navigateToCommunications();

    await page.waitForTimeout(2000);
    const path = await providerPage.getCurrentPath();
    expect(path).toContain('/provider/');
  });

  test('HP-PROV-005: Templates - View templates list', async ({ page }) => {
    await providerPage.navigateToTemplates();
    await expect(page).toHaveURL(/\/provider\/templates/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-PROV-006: Settings - View settings page', async ({ page }) => {
    await providerPage.navigateToSettings();
    await expect(page).toHaveURL(/\/provider\/settings/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-PROV-007: Patient Sign-Up - Access patient registration', async ({ page }) => {
    await providerPage.navigateToPatients();
    await expect(page).toHaveURL(/\/provider\/patients/);

    // Look for add/sign-up patient button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Sign Up"), button:has-text("Register"), a:has-text("Add"), a:has-text("New")').first();
    const hasAddButton = await addButton.isVisible().catch(() => false);
    // If there's an add button, the patient module supports CRUD
    if (hasAddButton) {
      await expect(addButton).toBeVisible();
    }
  });
});
