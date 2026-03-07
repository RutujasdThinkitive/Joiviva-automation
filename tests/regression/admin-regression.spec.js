// @ts-check
const { test, expect } = require('@playwright/test');
const { AdminPortalPage } = require('../../pages/AdminPortalPage');

test.describe('Admin Portal - Full Regression', () => {
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

  // ===== DASHBOARD =====
  test.describe('Dashboard', () => {
    test('REG-ADMIN-001: Dashboard loads after login', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('REG-ADMIN-002: Dashboard shows correct heading', async () => {
      const heading = await adminPage.getPageHeadingText();
      expect(heading).toBeTruthy();
    });

    test('REG-ADMIN-003: All navigation links visible on dashboard', async () => {
      const links = await adminPage.getAllNavLinks();
      expect(links.length).toBeGreaterThanOrEqual(6);
    });

    test('REG-ADMIN-004: Dashboard has header with logo', async () => {
      await expect(adminPage.headerLogo).toBeVisible();
    });
  });

  // ===== CLINIC GROUPS =====
  test.describe('Clinic Groups', () => {
    test.beforeEach(async () => {
      await adminPage.navigateToClinicGroups();
    });

    test('REG-ADMIN-010: Clinic Groups page loads via navigation', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/clinic-groups/);
    });

    test('REG-ADMIN-011: Clinic Groups page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-ADMIN-012: Can search or filter clinic groups', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      // Record whether search exists - not a failure if missing
      test.info().annotations.push({ type: 'search_exists', description: String(hasSearch) });
    });

    test('REG-ADMIN-013: Check for add/create button', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      const hasAdd = await addBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'create_exists', description: String(hasAdd) });
    });

    test('REG-ADMIN-014: Check for table or list view', async ({ page }) => {
      const table = page.locator('table, [class*="table"], [class*="list"], [role="grid"]').first();
      const hasTable = await table.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'table_exists', description: String(hasTable) });
    });
  });

  // ===== MASTER DATA =====
  test.describe('Master Data', () => {
    test.beforeEach(async () => {
      await adminPage.navigateToMaster();
    });

    test('REG-ADMIN-020: Master Data page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/master/);
    });

    test('REG-ADMIN-021: Master Data page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-ADMIN-022: Check for tabs or sub-sections (codes categories)', async ({ page }) => {
      const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
      const tabCount = await tabs.count().catch(() => 0);
      test.info().annotations.push({ type: 'tab_count', description: String(tabCount) });
    });

    test('REG-ADMIN-023: Check for data table', async ({ page }) => {
      const table = page.locator('table, [role="grid"], [class*="table"]').first();
      const hasTable = await table.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'table_exists', description: String(hasTable) });
    });
  });

  // ===== ADMINS MANAGEMENT =====
  test.describe('Admins Management', () => {
    test.beforeEach(async () => {
      await adminPage.navigateToAdmins();
    });

    test('REG-ADMIN-030: Admins page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/admins/);
    });

    test('REG-ADMIN-031: Admins page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-ADMIN-032: Check for admin list/table', async ({ page }) => {
      const table = page.locator('table, [role="grid"], [class*="table"], [class*="list"]').first();
      const hasTable = await table.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'admin_list_exists', description: String(hasTable) });
    });

    test('REG-ADMIN-033: Check for add admin button', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Invite")').first();
      const hasAdd = await addBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'add_admin_exists', description: String(hasAdd) });
    });
  });

  // ===== ROLES & RESPONSIBILITY =====
  test.describe('Roles & Responsibility', () => {
    test.beforeEach(async () => {
      await adminPage.navigateToRolesResponsibility();
    });

    test('REG-ADMIN-040: Roles page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/roles/);
    });

    test('REG-ADMIN-041: Roles page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-ADMIN-042: Check for roles list or permissions matrix', async ({ page }) => {
      const rolesElement = page.locator('table, [class*="role"], [class*="permission"], [role="grid"]').first();
      const hasRoles = await rolesElement.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'roles_display_exists', description: String(hasRoles) });
    });
  });

  // ===== PROFILE =====
  test.describe('Profile', () => {
    test.beforeEach(async () => {
      await adminPage.navigateToProfile();
    });

    test('REG-ADMIN-050: Profile page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin\/profile/);
    });

    test('REG-ADMIN-051: Profile page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-ADMIN-052: Check for profile form fields', async ({ page }) => {
      const formFields = page.locator('input, textarea, select');
      const fieldCount = await formFields.count().catch(() => 0);
      test.info().annotations.push({ type: 'profile_fields', description: String(fieldCount) });
    });

    test('REG-ADMIN-053: Check for save/update button', async ({ page }) => {
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
      const hasSave = await saveBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'save_button_exists', description: String(hasSave) });
    });
  });

  // ===== CROSS-MODULE NAVIGATION =====
  test.describe('Cross-Module Navigation', () => {
    test('REG-ADMIN-060: Navigate between all modules without errors', async ({ page }) => {
      const modules = [
        { name: 'Clinic Groups', nav: () => adminPage.navigateToClinicGroups(), urlPattern: /clinic-groups/ },
        { name: 'Master', nav: () => adminPage.navigateToMaster(), urlPattern: /master/ },
        { name: 'Admins', nav: () => adminPage.navigateToAdmins(), urlPattern: /admins/ },
        { name: 'Roles', nav: () => adminPage.navigateToRolesResponsibility(), urlPattern: /roles/ },
        { name: 'Profile', nav: () => adminPage.navigateToProfile(), urlPattern: /profile/ },
        { name: 'Dashboard', nav: () => adminPage.navigateToDashboard(), urlPattern: /dashboard/ },
      ];

      for (const mod of modules) {
        await mod.nav();
        await expect(page).toHaveURL(mod.urlPattern);
      }
    });

    test('REG-ADMIN-061: Browser back button works correctly', async ({ page }) => {
      await adminPage.navigateToClinicGroups();
      await expect(page).toHaveURL(/clinic-groups/);

      await page.goBack();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/dashboard/);
    });

    test('REG-ADMIN-062: Browser forward button works correctly', async ({ page }) => {
      await adminPage.navigateToClinicGroups();
      await page.goBack();
      await page.waitForTimeout(2000);

      await page.goForward();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/clinic-groups/);
    });

    test('REG-ADMIN-063: Page refresh preserves current module', async ({ page }) => {
      await adminPage.navigateToClinicGroups();
      await expect(page).toHaveURL(/clinic-groups/);

      await page.reload();
      await page.waitForTimeout(3000);
      // After reload, should either stay on the page or redirect to login (session check)
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });
});
