// @ts-check
const { test, expect } = require('@playwright/test');
const { AdminPortalPage } = require('../../pages/AdminPortalPage');

test.describe('Admin Portal - Smoke Tests', () => {
  /**
   * @type {AdminPortalPage}
   */
  let adminPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPortalPage(page);
    // Session restored via storageState - just navigate to dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('SM-ADMIN-001: Admin login succeeds and lands on dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    expect(await adminPage.isNavVisible()).toBeTruthy();
  });

  test('SM-ADMIN-002: Top navigation bar is fully visible', async ({ page }) => {
    await expect(adminPage.navDashboard).toBeVisible();
    await expect(adminPage.navClinicGroups).toBeVisible();
    await expect(adminPage.navMaster).toBeVisible();
    await expect(adminPage.navAdmins).toBeVisible();
    await expect(adminPage.navRolesResponsibility).toBeVisible();
    await expect(adminPage.navAuditLog).toBeVisible();
    await expect(adminPage.navProfile).toBeVisible();
  });

  test('SM-ADMIN-003: Dashboard page loads without errors', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    const heading = await adminPage.getPageHeadingText();
    expect(heading).toBeTruthy();
  });

  test('SM-ADMIN-004: Clinic Groups module loads', async ({ page }) => {
    await adminPage.navigateToClinicGroups();
    await expect(page).toHaveURL(/\/admin\/clinic-groups/);
  });

  test('SM-ADMIN-005: Master Data module loads', async ({ page }) => {
    await adminPage.navigateToMaster();
    await expect(page).toHaveURL(/\/admin\/master/);
  });

  test('SM-ADMIN-006: Admins module loads', async ({ page }) => {
    await adminPage.navigateToAdmins();
    await expect(page).toHaveURL(/\/admin\/admins/);
  });

  test('SM-ADMIN-007: Roles & Responsibility module loads', async ({ page }) => {
    await adminPage.navigateToRolesResponsibility();
    await expect(page).toHaveURL(/\/admin\/roles/);
  });

  test('SM-ADMIN-008: Profile page loads', async ({ page }) => {
    await adminPage.navigateToProfile();
    await expect(page).toHaveURL(/\/admin\/profile/);
  });

  test('SM-ADMIN-009: Logo is visible in header', async ({ page }) => {
    await expect(adminPage.headerLogo).toBeVisible();
  });

  test('SM-ADMIN-010: User name is displayed in header', async ({ page }) => {
    const userText = page.locator('header').getByText(/olivia/i);
    await expect(userText).toBeVisible();
  });
});
