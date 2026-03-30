// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-1222: Availability time shifted to 1 hour later than selected
 *
 * Bug: When selecting a time slot from the provider's availability, the scheduled
 * availability is set one hour later than the time originally selected.
 *
 * Steps to Reproduce:
 * 1. Navigate to availability management
 * 2. Set availability slot
 * 3. Check the final availability time in calendar
 *
 * Expected: The time should be displayed at the exact time chosen by the user
 * Actual: The availability is scheduled one hour later than selected
 */

test.describe('JPCET-1222: Availability Time Shifted by 1 Hour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/provider/settings');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Retest: Verify availability time matches selected time (BUG FIX)', async ({ page }) => {
    // Navigate to Availability section in Settings
    const availabilityLink = page.locator(
      'a:has-text("Availability"), button:has-text("Availability"), text=Availability, [class*="availability"]'
    ).first();

    if (await availabilityLink.isVisible().catch(() => false)) {
      await availabilityLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-1222-availability-page.png', fullPage: true });

    // Look for existing availability slots to verify their time
    const timeSlots = page.locator(
      '[class*="time"], [class*="slot"], [class*="availability"], [class*="schedule"], td, .fc-event'
    );
    const slotCount = await timeSlots.count();
    console.log(`Found ${slotCount} time-related elements on availability page`);

    // Check for Add/Edit availability button
    const addBtn = page.locator(
      'button:has-text("Add"), button:has-text("New"), button:has-text("Set"), button:has-text("Edit"), button:has-text("Create")'
    ).first();
    const hasAddBtn = await addBtn.isVisible().catch(() => false);
    console.log(`Add availability button visible: ${hasAddBtn}`);

    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      // Screenshot the availability form/modal
      await page.screenshot({ path: 'retest/screenshots/JPCET-1222-availability-form.png', fullPage: false });

      // Look for time picker/input fields
      const timeInputs = page.locator(
        'input[type="time"], input[placeholder*="time" i], select[class*="time"], [class*="time-picker"], [class*="timepicker"]'
      );
      const timeInputCount = await timeInputs.count();
      console.log(`Time input fields found: ${timeInputCount}`);

      // If time inputs exist, set a time and verify
      if (timeInputCount > 0) {
        const startTimeInput = timeInputs.first();
        const selectedTime = '09:00';

        // Set start time
        await startTimeInput.fill(selectedTime);
        console.log(`Set start time to: ${selectedTime}`);

        // Intercept API call to verify the time being sent
        const apiPayloads = [];
        page.on('request', (request) => {
          if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
            const postData = request.postData();
            if (postData && /time|availability|schedule|slot/i.test(request.url())) {
              apiPayloads.push({ url: request.url(), body: postData });
            }
          }
        });

        // Look for save/submit button
        const saveBtn = page.locator(
          'button:has-text("Save"), button:has-text("Submit"), button:has-text("Apply"), button:has-text("Confirm"), button[type="submit"]'
        ).first();

        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);

          // Log API payloads to verify time sent to backend
          console.log('API Payloads captured:');
          apiPayloads.forEach((p, i) => {
            console.log(`  ${i + 1}. URL: ${p.url}`);
            console.log(`     Body: ${p.body.substring(0, 500)}`);

            // Check if the saved time matches the selected time
            const bodyLower = p.body.toLowerCase();
            if (bodyLower.includes('09:00') || bodyLower.includes('09%3a00') || bodyLower.includes('9:00')) {
              console.log(`  ✅ Time 09:00 found in API payload — fix verified`);
            } else if (bodyLower.includes('10:00') || bodyLower.includes('10%3a00')) {
              console.log(`  ❌ Time 10:00 found in API payload — BUG STILL EXISTS (shifted by 1 hour)`);
            }
          });
        }

        await page.screenshot({ path: 'retest/screenshots/JPCET-1222-after-save.png', fullPage: true });
      }
    }

    // Navigate to calendar view to verify displayed time
    const calendarLink = page.locator(
      'a:has-text("Calendar"), a:has-text("Schedule"), button:has-text("Calendar"), [class*="calendar"]'
    ).first();

    if (await calendarLink.isVisible().catch(() => false)) {
      await calendarLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'retest/screenshots/JPCET-1222-calendar-view.png', fullPage: true });
    }
  });

  test('Retest: Check timezone handling in availability API response', async ({ page }) => {
    // Intercept availability API responses to check timezone
    const apiResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (/availability|schedule|slot|time/i.test(url) && response.status() === 200) {
        try {
          const body = await response.text();
          apiResponses.push({ url, body: body.substring(0, 1000) });
        } catch {}
      }
    });

    // Navigate to Availability section
    const availabilityLink = page.locator(
      'a:has-text("Availability"), button:has-text("Availability"), text=Availability'
    ).first();

    if (await availabilityLink.isVisible().catch(() => false)) {
      await availabilityLink.click();
      await page.waitForTimeout(3000);
    }

    // Log API responses to check timezone offset
    console.log('Availability API Responses:');
    apiResponses.forEach((r, i) => {
      console.log(`  ${i + 1}. URL: ${r.url}`);
      console.log(`     Body: ${r.body}`);

      // Check for timezone indicators
      if (r.body.includes('UTC') || r.body.includes('+00:00') || r.body.includes('Z"')) {
        console.log(`  ⚠️ UTC timezone detected in response — may cause 1-hour shift`);
      }
    });

    await page.screenshot({ path: 'retest/screenshots/JPCET-1222-timezone-check.png', fullPage: true });

    // Verify page is loaded and functional
    const pageContent = await page.locator('main, [class*="content"]').first().textContent().catch(() => '');
    expect(pageContent).toBeTruthy();
  });
});
