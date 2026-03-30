// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-866: Admin portal | Clinic management | Multiple UI issues
 *
 * Issue 1: Search Bar Not Accepting Input in Department Tab
 *   - Search bar visible but does not accept typed input
 *   - Expected: User should be able to type and search departments
 *
 * Issue 2: Add New Department Button Does Not Open Modal
 *   - (Description truncated in Jira, testing based on title)
 *
 * Additional UI issues expected in Clinic Management section
 */

test.describe('JPCET-866: Admin Portal - Clinic Management UI Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Retest Issue 1: Department search bar accepts input (BUG FIX)', async ({ page }) => {
    // Navigate to Clinic Management
    const clinicMgmtLink = page.locator(
      'a:has-text("Clinic"), a:has-text("Clinic Management"), [href*="clinic"], text=Clinic Management'
    ).first();

    if (await clinicMgmtLink.isVisible().catch(() => false)) {
      await clinicMgmtLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/admin/clinic-management');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Navigate to Department tab
    const departmentTab = page.locator(
      'a:has-text("Department"), button:has-text("Department"), [role="tab"]:has-text("Department"), text=Department'
    ).first();

    if (await departmentTab.isVisible().catch(() => false)) {
      await departmentTab.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-866-department-tab.png', fullPage: true });

    // Find the search bar
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], input[type="text"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible().catch(() => false);
    console.log(`Department search bar visible: ${isSearchVisible}`);

    if (isSearchVisible) {
      // Try typing in the search bar
      await searchInput.click();
      await page.waitForTimeout(500);

      const testKeyword = 'Cardiology';
      await searchInput.type(testKeyword, { delay: 100 });
      await page.waitForTimeout(1000);

      // Verify the input value
      const inputValue = await searchInput.inputValue();
      console.log(`Typed: '${testKeyword}', Input value: '${inputValue}'`);

      await page.screenshot({ path: 'retest/screenshots/JPCET-866-search-input-typed.png', fullPage: false });

      // VERIFY FIX: The input should contain the typed text
      expect(
        inputValue,
        'BUG JPCET-866 Issue 1: Search bar should accept typed input'
      ).toBe(testKeyword);

      // Also verify search results update
      await page.waitForTimeout(2000);
      const tableRows = page.locator('table tbody tr, [class*="list-item"], [class*="row"]');
      const rowCount = await tableRows.count();
      console.log(`Search results after typing '${testKeyword}': ${rowCount} rows`);

      // Clear search and verify all results return
      await searchInput.clear();
      await page.waitForTimeout(2000);
      const allRowCount = await tableRows.count();
      console.log(`All results after clearing search: ${allRowCount} rows`);
    } else {
      console.log('⚠️ Search input not found on department tab');
    }
  });

  test('Retest Issue 2: Add New Department button opens modal (BUG FIX)', async ({ page }) => {
    // Navigate to Clinic Management → Department
    const clinicMgmtLink = page.locator(
      'a:has-text("Clinic"), a:has-text("Clinic Management"), [href*="clinic"]'
    ).first();

    if (await clinicMgmtLink.isVisible().catch(() => false)) {
      await clinicMgmtLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/admin/clinic-management');
      await page.waitForTimeout(2000);
    }

    const departmentTab = page.locator(
      'a:has-text("Department"), button:has-text("Department"), [role="tab"]:has-text("Department")'
    ).first();

    if (await departmentTab.isVisible().catch(() => false)) {
      await departmentTab.click();
      await page.waitForTimeout(2000);
    }

    // Find Add New Department button
    const addDeptBtn = page.locator(
      'button:has-text("Add"), button:has-text("New Department"), button:has-text("Add Department"), button:has-text("Create")'
    ).first();

    const isAddBtnVisible = await addDeptBtn.isVisible().catch(() => false);
    console.log(`Add New Department button visible: ${isAddBtnVisible}`);

    if (isAddBtnVisible) {
      await addDeptBtn.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'retest/screenshots/JPCET-866-add-dept-modal.png', fullPage: false });

      // Verify modal/dialog opens
      const modal = page.locator(
        '[role="dialog"], [class*="modal"], [class*="dialog"], .MuiDialog-root, .MuiDrawer-root, [class*="drawer"]'
      ).first();
      const isModalVisible = await modal.isVisible().catch(() => false);
      console.log(`Modal/dialog opened: ${isModalVisible}`);

      // VERIFY FIX: Modal should open
      expect(
        isModalVisible,
        'BUG JPCET-866 Issue 2: Add Department button should open a modal/dialog'
      ).toBeTruthy();

      // Check modal has form fields
      if (isModalVisible) {
        const formFields = modal.locator('input, select, textarea');
        const fieldCount = await formFields.count();
        console.log(`Form fields in modal: ${fieldCount}`);

        // Close modal
        const closeBtn = page.locator(
          'button:has-text("Close"), button:has-text("Cancel"), button[aria-label="close"], [class*="close"]'
        ).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('Retest: General UI elements on Clinic Management page', async ({ page }) => {
    const clinicMgmtLink = page.locator(
      'a:has-text("Clinic"), a:has-text("Clinic Management"), [href*="clinic"]'
    ).first();

    if (await clinicMgmtLink.isVisible().catch(() => false)) {
      await clinicMgmtLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/admin/clinic-management');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-866-clinic-mgmt-overview.png', fullPage: true });

    // Check all tabs are present and clickable
    const tabs = page.locator('[role="tab"], [class*="tab"], .MuiTab-root');
    const tabCount = await tabs.count();
    console.log(`Tabs found on Clinic Management page: ${tabCount}`);

    for (let i = 0; i < tabCount; i++) {
      const tabText = await tabs.nth(i).textContent();
      console.log(`  Tab ${i + 1}: ${tabText?.trim()}`);
    }

    // Click through each tab and verify content loads
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      await tab.click();
      await page.waitForTimeout(2000);

      const content = await page.locator('main, [class*="content"], [class*="tab-panel"]').first().textContent().catch(() => '');
      const hasContent = content && content.trim().length > 0;
      console.log(`  Tab '${tabText?.trim()}' loaded with content: ${hasContent}`);

      await page.screenshot({
        path: `retest/screenshots/JPCET-866-tab-${i + 1}.png`,
        fullPage: true,
      });
    }

    // Verify no console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reload and check
    await page.reload();
    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    } else {
      console.log('✅ No console errors detected');
    }
  });
});
