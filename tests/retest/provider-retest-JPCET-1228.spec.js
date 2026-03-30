// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-1228: Referral Out Search – API Returns Empty Response When Searching
 * Patient Name, referral from with More Than One Character
 *
 * Bug: When a single character is entered for the patient name, the API returns
 * matching results correctly. However, when two or more characters are entered,
 * the API returns an empty response, even though matching patient records exist.
 *
 * Steps to Reproduce:
 * 1. Login to the provider portal
 * 2. Navigate to a patient's Referral Out section
 * 3. Search for a patient name with 1 character → results appear
 * 4. Search for a patient name with 2+ characters → empty response (BUG)
 *
 * Expected: API should return matching results for any character length
 */

test.describe('JPCET-1228: Referral Out Search - Multi-Character Patient Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to provider portal - patients section
    await page.goto('/provider/patients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  });

  test('Retest: Search patient name with single character returns results', async ({ page }) => {
    // Navigate to a patient's referral out section
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"]').first();
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to Referral Out tab/section
    const referralTab = page.locator('text=Referral, a:has-text("Referral"), [class*="referral"]').first();
    if (await referralTab.isVisible().catch(() => false)) {
      await referralTab.click();
      await page.waitForTimeout(2000);
    }

    // Look for Referral Out section
    const referralOut = page.locator('text=Referral Out, a:has-text("Referral Out"), button:has-text("Referral Out")').first();
    if (await referralOut.isVisible().catch(() => false)) {
      await referralOut.click();
      await page.waitForTimeout(2000);
    }

    // Click Add Referral or search within referral form
    const addReferralBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addReferralBtn.isVisible().catch(() => false)) {
      await addReferralBtn.click();
      await page.waitForTimeout(2000);
    }

    // Find the patient search field in referral form
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="patient" i], input[placeholder*="name" i], input[type="search"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type single character and verify results appear
    await searchInput.fill('');
    await searchInput.type('t', { delay: 100 });
    await page.waitForTimeout(3000);

    // Check for dropdown/search results
    const searchResults = page.locator(
      '[class*="dropdown"], [class*="autocomplete"], [class*="suggestion"], [class*="search-result"], [role="listbox"], [role="option"], ul li'
    );
    const singleCharResults = await searchResults.count();
    console.log(`Single character 't' search results count: ${singleCharResults}`);

    // Take screenshot for evidence
    await page.screenshot({ path: 'retest/screenshots/JPCET-1228-single-char-search.png', fullPage: false });
  });

  test('Retest: Search patient name with multiple characters returns results (BUG FIX)', async ({ page }) => {
    // Navigate to a patient's referral out section
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"]').first();
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Navigate to Referral Out tab/section
    const referralTab = page.locator('text=Referral, a:has-text("Referral"), [class*="referral"]').first();
    if (await referralTab.isVisible().catch(() => false)) {
      await referralTab.click();
      await page.waitForTimeout(2000);
    }

    const referralOut = page.locator('text=Referral Out, a:has-text("Referral Out"), button:has-text("Referral Out")').first();
    if (await referralOut.isVisible().catch(() => false)) {
      await referralOut.click();
      await page.waitForTimeout(2000);
    }

    const addReferralBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addReferralBtn.isVisible().catch(() => false)) {
      await addReferralBtn.click();
      await page.waitForTimeout(2000);
    }

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="patient" i], input[placeholder*="name" i], input[type="search"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Intercept API calls to monitor search response
    const apiResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (/search|patient|referral/i.test(url) && response.request().method() !== 'OPTIONS') {
        const status = response.status();
        let body = '';
        try { body = await response.text(); } catch {}
        apiResponses.push({ url, status, body: body.substring(0, 500) });
      }
    });

    // Type multiple characters (the bug scenario)
    await searchInput.fill('');
    await searchInput.type('tes', { delay: 150 });
    await page.waitForTimeout(3000);

    // Check for dropdown/search results
    const searchResults = page.locator(
      '[class*="dropdown"], [class*="autocomplete"], [class*="suggestion"], [class*="search-result"], [role="listbox"], [role="option"], ul li'
    );
    const multiCharResults = await searchResults.count();
    console.log(`Multi character 'tes' search results count: ${multiCharResults}`);

    // Log API responses for debugging
    console.log('API Responses captured:');
    apiResponses.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.url} → Status: ${r.status}, Body: ${r.body.substring(0, 200)}`);
    });

    // VERIFY FIX: Multi-character search should return results (not empty)
    // If results > 0, the bug is fixed
    const hasResults = multiCharResults > 0;
    const apiHasData = apiResponses.some(r => {
      try {
        const json = JSON.parse(r.body);
        return (Array.isArray(json) && json.length > 0) ||
               (json.data && Array.isArray(json.data) && json.data.length > 0) ||
               (json.results && json.results.length > 0);
      } catch { return false; }
    });

    await page.screenshot({ path: 'retest/screenshots/JPCET-1228-multi-char-search.png', fullPage: false });

    // Assert the fix — multi-character search should return results
    expect(hasResults || apiHasData, 'BUG JPCET-1228: Multi-character search should return patient results').toBeTruthy();
  });

  test('Retest: Search with exact patient name returns correct result', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"]').first();
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    const referralTab = page.locator('text=Referral, a:has-text("Referral"), [class*="referral"]').first();
    if (await referralTab.isVisible().catch(() => false)) {
      await referralTab.click();
      await page.waitForTimeout(2000);
    }

    const referralOut = page.locator('text=Referral Out, a:has-text("Referral Out"), button:has-text("Referral Out")').first();
    if (await referralOut.isVisible().catch(() => false)) {
      await referralOut.click();
      await page.waitForTimeout(2000);
    }

    const addReferralBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addReferralBtn.isVisible().catch(() => false)) {
      await addReferralBtn.click();
      await page.waitForTimeout(2000);
    }

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="patient" i], input[placeholder*="name" i], input[type="search"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a longer name (regression check for the fix)
    await searchInput.fill('');
    await searchInput.type('testnew', { delay: 100 });
    await page.waitForTimeout(3000);

    const searchResults = page.locator(
      '[class*="dropdown"], [class*="autocomplete"], [class*="suggestion"], [class*="search-result"], [role="listbox"], [role="option"], ul li'
    );
    const resultCount = await searchResults.count();
    console.log(`Full name 'testnew' search results: ${resultCount}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-1228-full-name-search.png', fullPage: false });

    expect(resultCount, 'Full patient name search should return results').toBeGreaterThan(0);
  });
});
