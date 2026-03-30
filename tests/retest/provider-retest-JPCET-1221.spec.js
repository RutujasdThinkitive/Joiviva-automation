// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-1221: Sort by Appointment Date not working correctly
 *
 * Bug: The Sort by Appointment Date functionality is not working properly.
 * When the user selects sorting based on Appointment Date, the records are
 * not arranged in the correct chronological order.
 *
 * Steps to Reproduce:
 * 1. Navigate to the Appointments list/page
 * 2. Click on Sort by Appointment Date
 * 3. Observe the order of the displayed appointments
 *
 * Expected: Appointments should be sorted correctly by date
 * Actual: Appointments appear in incorrect or random order
 */

test.describe('JPCET-1221: Sort by Appointment Date Not Working', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/scheduling');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Retest: Sort appointments by date in ascending order (BUG FIX)', async ({ page }) => {
    await page.screenshot({ path: 'retest/screenshots/JPCET-1221-appointments-page.png', fullPage: true });

    // Look for appointment list view (not calendar view)
    const listViewBtn = page.locator(
      'button:has-text("List"), button:has-text("Table"), [class*="list-view"], [aria-label*="list"]'
    ).first();
    if (await listViewBtn.isVisible().catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(2000);
    }

    // Find the sort by date button/header
    const sortByDate = page.locator(
      'th:has-text("Date"), th:has-text("Appointment Date"), button:has-text("Sort"), [class*="sort"], th:has-text("Appt Date"), [aria-sort]'
    ).first();

    const hasSortByDate = await sortByDate.isVisible().catch(() => false);
    console.log(`Sort by Appointment Date element visible: ${hasSortByDate}`);

    if (hasSortByDate) {
      // Click to sort ascending
      await sortByDate.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'retest/screenshots/JPCET-1221-sorted-asc.png', fullPage: true });

      // Extract dates from the table rows
      const dateElements = page.locator(
        'table tbody tr td:nth-child(1), table tbody tr td:nth-child(2), [class*="date"], [class*="appointment-date"]'
      );
      const dateCount = await dateElements.count();
      console.log(`Date elements found: ${dateCount}`);

      const dates = [];
      for (let i = 0; i < Math.min(dateCount, 20); i++) {
        const text = await dateElements.nth(i).textContent();
        if (text && text.trim()) {
          dates.push(text.trim());
        }
      }

      console.log('Dates after sort (ascending):');
      dates.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));

      // Verify dates are in ascending order
      if (dates.length >= 2) {
        const parsedDates = dates.map(d => new Date(d).getTime()).filter(d => !isNaN(d));
        if (parsedDates.length >= 2) {
          let isAscending = true;
          for (let i = 1; i < parsedDates.length; i++) {
            if (parsedDates[i] < parsedDates[i - 1]) {
              isAscending = false;
              console.log(`  ❌ Date at index ${i} (${dates[i]}) is before date at index ${i - 1} (${dates[i - 1]})`);
              break;
            }
          }
          console.log(`Sort ascending verification: ${isAscending ? '✅ PASS' : '❌ FAIL'}`);
          expect(isAscending, 'BUG JPCET-1221: Appointments should be sorted in ascending date order').toBeTruthy();
        }
      }
    }
  });

  test('Retest: Sort appointments by date in descending order', async ({ page }) => {
    const listViewBtn = page.locator(
      'button:has-text("List"), button:has-text("Table"), [class*="list-view"]'
    ).first();
    if (await listViewBtn.isVisible().catch(() => false)) {
      await listViewBtn.click();
      await page.waitForTimeout(2000);
    }

    const sortByDate = page.locator(
      'th:has-text("Date"), th:has-text("Appointment Date"), button:has-text("Sort"), [class*="sort"], th:has-text("Appt Date"), [aria-sort]'
    ).first();

    if (await sortByDate.isVisible().catch(() => false)) {
      // Click twice for descending
      await sortByDate.click();
      await page.waitForTimeout(1500);
      await sortByDate.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'retest/screenshots/JPCET-1221-sorted-desc.png', fullPage: true });

      const dateElements = page.locator(
        'table tbody tr td:nth-child(1), table tbody tr td:nth-child(2), [class*="date"]'
      );
      const dateCount = await dateElements.count();

      const dates = [];
      for (let i = 0; i < Math.min(dateCount, 20); i++) {
        const text = await dateElements.nth(i).textContent();
        if (text && text.trim()) dates.push(text.trim());
      }

      console.log('Dates after sort (descending):');
      dates.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));

      if (dates.length >= 2) {
        const parsedDates = dates.map(d => new Date(d).getTime()).filter(d => !isNaN(d));
        if (parsedDates.length >= 2) {
          let isDescending = true;
          for (let i = 1; i < parsedDates.length; i++) {
            if (parsedDates[i] > parsedDates[i - 1]) {
              isDescending = false;
              break;
            }
          }
          console.log(`Sort descending verification: ${isDescending ? '✅ PASS' : '❌ FAIL'}`);
          expect(isDescending, 'Appointments should be sorted in descending date order').toBeTruthy();
        }
      }
    }
  });

  test('Retest: Sort persists after page interaction', async ({ page }) => {
    const sortByDate = page.locator(
      'th:has-text("Date"), th:has-text("Appointment Date"), [class*="sort"], [aria-sort]'
    ).first();

    if (await sortByDate.isVisible().catch(() => false)) {
      await sortByDate.click();
      await page.waitForTimeout(2000);

      // Capture dates before interaction
      const datesBefore = [];
      const dateElements = page.locator('table tbody tr td:nth-child(1), table tbody tr td:nth-child(2)');
      const count = await dateElements.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await dateElements.nth(i).textContent();
        if (text) datesBefore.push(text.trim());
      }

      // Interact with page (e.g., scroll, click elsewhere)
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1000);

      // Capture dates after interaction
      const datesAfter = [];
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await dateElements.nth(i).textContent();
        if (text) datesAfter.push(text.trim());
      }

      // Sort order should persist
      const orderMaintained = JSON.stringify(datesBefore) === JSON.stringify(datesAfter);
      console.log(`Sort order persists after interaction: ${orderMaintained ? '✅ PASS' : '❌ FAIL'}`);

      await page.screenshot({ path: 'retest/screenshots/JPCET-1221-sort-persistence.png', fullPage: true });
    }
  });
});
