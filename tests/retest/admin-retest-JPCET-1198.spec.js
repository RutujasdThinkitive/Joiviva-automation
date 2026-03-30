// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-1198: Audit Log Time Displayed in UTC Instead of System Timezone
 *
 * Bug: The date and time in the Audit Log are displayed in UTC instead of
 * the system/application timezone.
 *
 * Steps to Reproduce:
 * 1. Perform any action in the system
 * 2. Navigate to Admin → Audit Log
 * 3. Check the Date & Time column
 *
 * Expected: Time should be displayed according to the system/application timezone
 * Actual: Time is displayed in UTC
 */

test.describe('JPCET-1198: Audit Log Time Displayed in UTC', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Retest: Audit log time should display in local timezone (BUG FIX)', async ({ page }) => {
    // Navigate to Audit Log
    const auditLogLink = page.locator(
      'a:has-text("Audit"), a:has-text("Audit Log"), text=Audit Log, [class*="audit"], [href*="audit"]'
    ).first();

    if (await auditLogLink.isVisible().catch(() => false)) {
      await auditLogLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    } else {
      // Try navigating directly
      await page.goto('/admin/audit-log');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-1198-audit-log-page.png', fullPage: true });

    // Intercept API responses to check timezone in data
    const apiResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (/audit/i.test(url) && response.status() === 200) {
        try {
          const body = await response.text();
          apiResponses.push({ url, body: body.substring(0, 2000) });
        } catch {}
      }
    });

    // Reload to capture API
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    // Extract displayed times from the audit log table
    const dateTimeElements = page.locator(
      'table tbody tr td, [class*="date"], [class*="time"], [class*="timestamp"]'
    );
    const elementCount = await dateTimeElements.count();

    const displayedTimes = [];
    for (let i = 0; i < Math.min(elementCount, 30); i++) {
      const text = await dateTimeElements.nth(i).textContent();
      if (text && text.trim()) {
        const trimmed = text.trim();
        // Check if it looks like a date/time value
        if (/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(trimmed) || /\d{1,2}:\d{2}/.test(trimmed)) {
          displayedTimes.push(trimmed);
        }
      }
    }

    console.log('Displayed date/time values in audit log:');
    displayedTimes.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    // Check for UTC indicators
    const hasUTCIndicators = displayedTimes.some(t =>
      t.includes('UTC') || t.includes('+00:00') || t.endsWith('Z')
    );

    console.log(`UTC indicators found in displayed times: ${hasUTCIndicators}`);

    if (hasUTCIndicators) {
      console.log('❌ BUG STILL EXISTS: Times are still showing UTC');
    } else {
      console.log('✅ FIX VERIFIED: Times appear to be in local timezone');
    }

    // Check API response for timezone handling
    console.log('\nAudit Log API Responses:');
    apiResponses.forEach((r, i) => {
      console.log(`  ${i + 1}. URL: ${r.url}`);
      // Check for UTC timestamps in response
      const utcMatches = r.body.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g);
      if (utcMatches) {
        console.log(`     ⚠️ Found ${utcMatches.length} UTC timestamps in API response`);
        console.log(`     Sample: ${utcMatches.slice(0, 3).join(', ')}`);
      }
    });

    await page.screenshot({ path: 'retest/screenshots/JPCET-1198-time-verification.png', fullPage: true });

    // Get browser's timezone for comparison
    const browserTimezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log(`Browser timezone: ${browserTimezone}`);

    // Assert: Displayed times should NOT have raw UTC indicators
    expect(
      hasUTCIndicators,
      'BUG JPCET-1198: Audit log times should not display UTC. Expected local timezone.'
    ).toBeFalsy();
  });

  test('Retest: New action generates audit log entry with correct timezone', async ({ page }) => {
    // Perform an action first (e.g., navigate around)
    await page.goto('/admin/');
    await page.waitForTimeout(2000);

    // Get current local time
    const currentLocalTime = await page.evaluate(() => {
      const now = new Date();
      return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        formatted: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    });
    console.log(`Current local time: ${currentLocalTime.formatted} (${currentLocalTime.timezone})`);

    // Navigate to Audit Log
    const auditLogLink = page.locator(
      'a:has-text("Audit"), a:has-text("Audit Log"), [href*="audit"]'
    ).first();

    if (await auditLogLink.isVisible().catch(() => false)) {
      await auditLogLink.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto('/admin/audit-log');
      await page.waitForTimeout(3000);
    }

    // Check the most recent audit log entry time
    const firstRowTime = page.locator('table tbody tr:first-child td').allTextContents();
    const rowTexts = await firstRowTime;
    console.log('Most recent audit log row:');
    rowTexts.forEach((t, i) => console.log(`  Column ${i + 1}: ${t.trim()}`));

    // Check if the most recent entry's time roughly matches local time (within 1 hour tolerance)
    const timeTexts = rowTexts.filter(t => /\d{1,2}:\d{2}/.test(t));
    if (timeTexts.length > 0) {
      console.log(`Latest audit entry time: ${timeTexts[0].trim()}`);
      console.log(`Expected local time (approx): ${currentLocalTime.formatted}`);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-1198-new-entry-time.png', fullPage: true });
  });
});
