// @ts-check
const { test, expect } = require('@playwright/test');
const { AdminPortalPage } = require('../../pages/AdminPortalPage');

test.describe('Admin Portal - Happy Path', () => {
  /**
   * @type {AdminPortalPage}
   */
  let adminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPortalPage(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('HP-ADMIN-001: Complete navigation flow through all working modules', async ({ page }) => {
    // Start at Dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Navigate to Clinic Groups
    await adminPage.navigateToClinicGroups();
    await expect(page).toHaveURL(/\/admin\/clinic-groups/);

    // Navigate to Master Data
    await adminPage.navigateToMaster();
    await expect(page).toHaveURL(/\/admin\/master/);

    // Navigate to Admins
    await adminPage.navigateToAdmins();
    await expect(page).toHaveURL(/\/admin\/admins/);

    // Navigate to Roles & Responsibility
    await adminPage.navigateToRolesResponsibility();
    await expect(page).toHaveURL(/\/admin\/roles/);

    // Navigate to Profile
    await adminPage.navigateToProfile();
    await expect(page).toHaveURL(/\/admin\/profile/);

    // Return to Dashboard
    await adminPage.navigateToDashboard();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('HP-ADMIN-002: Clinic Groups - View and manage clinic groups', async ({ page }) => {
    await adminPage.navigateToClinicGroups();
    await expect(page).toHaveURL(/\/admin\/clinic-groups/);

    // Check page loaded with content
    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-ADMIN-003: Admin Management - View admin list', async ({ page }) => {
    await adminPage.navigateToAdmins();
    await expect(page).toHaveURL(/\/admin\/admins/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-ADMIN-004: Master Data - View master data codes', async ({ page }) => {
    await adminPage.navigateToMaster();
    await expect(page).toHaveURL(/\/admin\/master/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-ADMIN-005: Roles & Permissions - View roles', async ({ page }) => {
    await adminPage.navigateToRolesResponsibility();
    await expect(page).toHaveURL(/\/admin\/roles/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });

  test('HP-ADMIN-006: Profile - View and verify profile page', async ({ page }) => {
    await adminPage.navigateToProfile();
    await expect(page).toHaveURL(/\/admin\/profile/);

    await page.waitForTimeout(2000);
    const content = await page.locator('main, [class*="content"]').first().textContent();
    expect(content).toBeTruthy();
  });
});
