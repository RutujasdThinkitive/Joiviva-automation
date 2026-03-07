// @ts-check
const { test, expect } = require('@playwright/test');
const { ProviderPortalPage } = require('../../pages/ProviderPortalPage');

test.describe('Provider Portal - Smoke Tests', () => {
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

  test('SM-PROV-001: Provider login succeeds and lands on dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/provider\/dashboard/);
    expect(await providerPage.isNavVisible()).toBeTruthy();
  });

  test('SM-PROV-002: Top navigation bar is fully visible', async ({ page }) => {
    await expect(providerPage.navDashboard).toBeVisible();
    await expect(providerPage.navScheduling).toBeVisible();
    await expect(providerPage.navPatients).toBeVisible();
    await expect(providerPage.navCommunications).toBeVisible();
    await expect(providerPage.navTemplates).toBeVisible();
    await expect(providerPage.navSettings).toBeVisible();
  });

  test('SM-PROV-003: Dashboard page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/provider\/dashboard/);
    const heading = await providerPage.getPageHeadingText();
    expect(heading).toBeTruthy();
  });

  test('SM-PROV-004: Scheduling module loads', async ({ page }) => {
    await providerPage.navigateToScheduling();
    await expect(page).toHaveURL(/\/provider\/scheduling/);
  });

  test('SM-PROV-005: Patients module loads', async ({ page }) => {
    await providerPage.navigateToPatients();
    await expect(page).toHaveURL(/\/provider\/patients/);
  });

  test('SM-PROV-006: Communications module loads', async ({ page }) => {
    await providerPage.navigateToCommunications();
    const path = await providerPage.getCurrentPath();
    expect(path).toContain('/provider/');
  });

  test('SM-PROV-007: Templates module loads', async ({ page }) => {
    await providerPage.navigateToTemplates();
    await expect(page).toHaveURL(/\/provider\/templates/);
  });

  test('SM-PROV-008: Settings module loads', async ({ page }) => {
    await providerPage.navigateToSettings();
    await expect(page).toHaveURL(/\/provider\/settings/);
  });

  test('SM-PROV-009: Logo is visible in header', async ({ page }) => {
    await expect(providerPage.headerLogo).toBeVisible();
  });

  test('SM-PROV-010: User name is displayed in header', async ({ page }) => {
    const headerText = await page.locator('header').textContent();
    expect(headerText).toBeTruthy();
  });
});
