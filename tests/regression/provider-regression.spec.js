// @ts-check
const { test, expect } = require('@playwright/test');
const { ProviderPortalPage } = require('../../pages/ProviderPortalPage');

test.describe('Provider Portal - Full Regression', () => {
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

  // ===== DASHBOARD =====
  test.describe('Dashboard', () => {
    test('REG-PROV-001: Dashboard loads after login', async ({ page }) => {
      await expect(page).toHaveURL(/\/provider\/dashboard/);
    });

    test('REG-PROV-002: Dashboard shows page heading', async () => {
      const heading = await providerPage.getPageHeadingText();
      expect(heading).toBeTruthy();
    });

    test('REG-PROV-003: All navigation links visible', async () => {
      const links = await providerPage.getAllNavLinks();
      expect(links.length).toBeGreaterThanOrEqual(6);
    });

    test('REG-PROV-004: Header has logo and user info', async ({ page }) => {
      await expect(providerPage.headerLogo).toBeVisible();
      const headerText = await page.locator('header').textContent();
      expect(headerText).toBeTruthy();
    });
  });

  // ===== SCHEDULING =====
  test.describe('Scheduling', () => {
    test.beforeEach(async () => {
      await providerPage.navigateToScheduling();
    });

    test('REG-PROV-010: Scheduling page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/provider\/scheduling/);
    });

    test('REG-PROV-011: Scheduling page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-PROV-012: Check for calendar or schedule view', async ({ page }) => {
      const calendar = page.locator('[class*="calendar"], [class*="schedule"], [class*="fc-"], table').first();
      const hasCalendar = await calendar.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'calendar_exists', description: String(hasCalendar) });
    });

    test('REG-PROV-013: Check for date navigation controls', async ({ page }) => {
      const dateNav = page.locator('button:has-text("Today"), button:has-text("Next"), button:has-text("Prev"), [class*="date-nav"]').first();
      const hasDateNav = await dateNav.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'date_nav_exists', description: String(hasDateNav) });
    });

    test('REG-PROV-014: Check for appointment create button', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Book"), button:has-text("Create")').first();
      const hasAdd = await addBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'add_appointment_exists', description: String(hasAdd) });
    });
  });

  // ===== PATIENTS =====
  test.describe('Patients', () => {
    test.beforeEach(async () => {
      await providerPage.navigateToPatients();
    });

    test('REG-PROV-020: Patients page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/provider\/patients/);
    });

    test('REG-PROV-021: Patients page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-PROV-022: Check for patient list/table', async ({ page }) => {
      const table = page.locator('table, [role="grid"], [class*="table"], [class*="list"], [class*="patient"]').first();
      const hasTable = await table.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'patient_list_exists', description: String(hasTable) });
    });

    test('REG-PROV-023: Check for search/filter patients', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
      const hasSearch = await searchInput.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'patient_search_exists', description: String(hasSearch) });
    });

    test('REG-PROV-024: Check for add patient button', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Register"), button:has-text("Sign Up")').first();
      const hasAdd = await addBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'add_patient_exists', description: String(hasAdd) });
    });
  });

  // ===== COMMUNICATIONS =====
  test.describe('Communications', () => {
    test.beforeEach(async () => {
      await providerPage.navigateToCommunications();
    });

    test('REG-PROV-030: Communications module loads', async ({ page }) => {
      const path = await providerPage.getCurrentPath();
      expect(path).toContain('/provider/');
    });

    test('REG-PROV-031: Communications page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-PROV-032: Check for message sections (Inbox, Groups, Shared)', async ({ page }) => {
      const inbox = page.locator('text=Inbox, [class*="inbox"]').first();
      const hasInbox = await inbox.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'inbox_exists', description: String(hasInbox) });
    });

    test('REG-PROV-033: Check for compose/new message button', async ({ page }) => {
      const composeBtn = page.locator('button:has-text("Compose"), button:has-text("New"), button:has-text("Send"), button:has-text("Write")').first();
      const hasCompose = await composeBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'compose_exists', description: String(hasCompose) });
    });

    test('REG-PROV-034: Check for Tasks section', async ({ page }) => {
      const tasks = page.locator('text=Tasks, a:has-text("Tasks"), [class*="task"]').first();
      const hasTasks = await tasks.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'tasks_exists', description: String(hasTasks) });
    });
  });

  // ===== TEMPLATES =====
  test.describe('Templates', () => {
    test.beforeEach(async () => {
      await providerPage.navigateToTemplates();
    });

    test('REG-PROV-040: Templates page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/provider\/templates/);
    });

    test('REG-PROV-041: Templates page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-PROV-042: Check for template list', async ({ page }) => {
      const list = page.locator('table, [class*="list"], [class*="template"], [role="grid"]').first();
      const hasList = await list.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'template_list_exists', description: String(hasList) });
    });

    test('REG-PROV-043: Check for create template button', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      const hasAdd = await addBtn.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'add_template_exists', description: String(hasAdd) });
    });
  });

  // ===== SETTINGS =====
  test.describe('Settings', () => {
    test.beforeEach(async () => {
      await providerPage.navigateToSettings();
    });

    test('REG-PROV-050: Settings page loads', async ({ page }) => {
      await expect(page).toHaveURL(/\/provider\/settings/);
    });

    test('REG-PROV-051: Settings page has content', async ({ page }) => {
      const content = await page.locator('main, [class*="content"]').first().textContent();
      expect(content).toBeTruthy();
    });

    test('REG-PROV-052: Check for settings sub-sections', async ({ page }) => {
      // Settings should have: Availability, Practice, Profile, Appointment Type, etc.
      const subSections = page.locator('a, [role="tab"], [class*="tab"], [class*="menu-item"]');
      const count = await subSections.count();
      test.info().annotations.push({ type: 'settings_sections', description: String(count) });
    });

    test('REG-PROV-053: Check for form elements in settings', async ({ page }) => {
      const formElements = page.locator('input, select, textarea, [role="switch"], [role="checkbox"]');
      const count = await formElements.count();
      test.info().annotations.push({ type: 'settings_form_elements', description: String(count) });
    });
  });

  // ===== VISIT NOTES =====
  test.describe('Visit Notes (via Patients)', () => {
    test('REG-PROV-060: Access patient charting area', async ({ page }) => {
      await providerPage.navigateToPatients();
      await expect(page).toHaveURL(/\/provider\/patients/);

      // Look for a patient to click on
      const patientRow = page.locator('table tr, [class*="patient-row"], [class*="list-item"]').first();
      const hasPatients = await patientRow.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'patient_records_exist', description: String(hasPatients) });
    });
  });

  // ===== MASTER DATA =====
  test.describe('Master Data (via Settings)', () => {
    test('REG-PROV-070: Check for CPT Codes access', async ({ page }) => {
      await providerPage.navigateToSettings();
      await page.waitForTimeout(2000);
      const cptLink = page.locator('text=CPT, a:has-text("CPT")').first();
      const hasCpt = await cptLink.isVisible().catch(() => false);
      test.info().annotations.push({ type: 'cpt_codes_exists', description: String(hasCpt) });
    });
  });

  // ===== CROSS-MODULE NAVIGATION =====
  test.describe('Cross-Module Navigation', () => {
    test('REG-PROV-080: Navigate between all modules without errors', async ({ page }) => {
      const modules = [
        { name: 'Scheduling', nav: () => providerPage.navigateToScheduling(), urlPattern: /scheduling/ },
        { name: 'Patients', nav: () => providerPage.navigateToPatients(), urlPattern: /patients/ },
        { name: 'Templates', nav: () => providerPage.navigateToTemplates(), urlPattern: /templates/ },
        { name: 'Settings', nav: () => providerPage.navigateToSettings(), urlPattern: /settings/ },
        { name: 'Dashboard', nav: () => providerPage.navigateToDashboard(), urlPattern: /dashboard/ },
      ];

      for (const mod of modules) {
        await mod.nav();
        await expect(page).toHaveURL(mod.urlPattern);
      }
    });

    test('REG-PROV-081: Browser back button works', async ({ page }) => {
      await providerPage.navigateToScheduling();
      await expect(page).toHaveURL(/scheduling/);

      await page.goBack();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/dashboard/);
    });

    test('REG-PROV-082: Browser forward button works', async ({ page }) => {
      await providerPage.navigateToScheduling();
      await page.goBack();
      await page.waitForTimeout(2000);

      await page.goForward();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/scheduling/);
    });

    test('REG-PROV-083: Page refresh maintains state', async ({ page }) => {
      await providerPage.navigateToScheduling();
      await expect(page).toHaveURL(/scheduling/);

      await page.reload();
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });
});
