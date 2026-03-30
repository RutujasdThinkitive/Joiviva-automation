// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-813: Manual E2E Testing — Patient Demographic Details in Encounter Header
 *
 * This script navigates through the encounter flow and captures screenshots
 * at each step for manual verification of all acceptance criteria.
 */

test.describe('JPCET-813: Manual E2E — Encounter Header Demographics', () => {
  test('Full walkthrough: Navigate to encounter and capture all demographic fields', async ({ page }) => {
    // STEP 1: Go to patients list
    console.log('=== STEP 1: Navigate to Patients List ===');
    await page.goto('/provider/patients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'retest/screenshots/JPCET-813-step1-patients-list.png', fullPage: true });
    console.log(`URL: ${page.url()}`);

    // STEP 2: Click first patient
    console.log('\n=== STEP 2: Select a Patient ===');
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    const patientText = await patientRow.textContent();
    console.log(`Selected patient: ${patientText?.substring(0, 200)}`);
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'retest/screenshots/JPCET-813-step2-patient-selected.png', fullPage: true });
    console.log(`URL: ${page.url()}`);

    // STEP 3: Look for encounter/chart options
    console.log('\n=== STEP 3: Find Encounter/Chart Navigation ===');
    const allLinks = await page.locator('a, button, [role="tab"]').allTextContents();
    console.log('Available navigation options:');
    allLinks.filter(t => t.trim()).forEach((t, i) => {
      if (i < 30) console.log(`  ${i + 1}. ${t.trim().substring(0, 80)}`);
    });

    // Try to find encounter link
    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), a:has-text("Visit Note"), button:has-text("Encounter"), button:has-text("Start"), button:has-text("New Encounter"), [href*="encounter"], [href*="chart"], [href*="visit"]'
    ).first();
    const hasEncounter = await encounterLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`\nEncounter navigation found: ${hasEncounter}`);

    if (hasEncounter) {
      const linkText = await encounterLink.textContent();
      console.log(`Clicking: ${linkText}`);
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: 'retest/screenshots/JPCET-813-step3-encounter-page.png', fullPage: true });
    console.log(`URL: ${page.url()}`);

    // STEP 4: Capture the header bar area
    console.log('\n=== STEP 4: Analyze Encounter Header Bar ===');

    // Get all visible text in the top portion of the page (header area)
    const headerElements = page.locator('header, [class*="header"], [class*="banner"], [class*="patient-info"], [class*="demographic"], [class*="top-bar"]');
    const headerCount = await headerElements.count();
    console.log(`Header-like elements found: ${headerCount}`);

    for (let i = 0; i < headerCount; i++) {
      const text = await headerElements.nth(i).textContent();
      if (text && text.trim().length > 5) {
        console.log(`  Header ${i + 1}: ${text.trim().substring(0, 300)}`);
      }
    }

    // STEP 5: Check each acceptance criterion
    console.log('\n=== STEP 5: Verify Acceptance Criteria ===');
    const pageText = await page.locator('body').textContent();

    const criteria = [
      { name: 'Patient Full Name', pattern: /[A-Z][a-z]+\s[A-Z][a-z]+/, hint: 'Name like "John Doe"' },
      { name: 'MRN', pattern: /MRN|Medical Record/i, hint: 'MRN label or number' },
      { name: 'Date of Birth', pattern: /DOB|Date of Birth|D\.O\.B/i, hint: 'DOB label' },
      { name: 'Age', pattern: /\d+\s*(yr|years?|y\/o|yrs)/i, hint: 'Age like "35 yrs"' },
      { name: 'Gender', pattern: /Male|Female|Gender|Non-binary/i, hint: 'Gender value' },
      { name: 'Mobile Number', pattern: /(\(\d{3}\)\s?\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}|Phone|Mobile)/i, hint: 'Phone number' },
      { name: 'Allergy Info', pattern: /Allerg|NKDA|No Known Drug/i, hint: 'Allergy section' },
      { name: 'Insurance/Payer', pattern: /Insurance|Payer|Coverage|Plan/i, hint: 'Insurance details' },
      { name: 'Primary Clinician', pattern: /Clinician|Guardian|PCP|Primary Care|Provider/i, hint: 'Clinician name' },
      { name: 'Invite Patient', pattern: /Invite/i, hint: 'Invite Patient button' },
    ];

    console.log('\n--- Acceptance Criteria Check ---');
    const results = [];
    criteria.forEach((c, i) => {
      const found = c.pattern.test(pageText);
      const status = found ? 'PASS' : 'FAIL';
      console.log(`  ${i + 1}. [${status}] ${c.name} — ${found ? 'Found on page' : 'NOT FOUND'} (${c.hint})`);
      results.push({ criterion: c.name, status, found });
    });

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`\n--- SUMMARY: ${passed} PASS / ${failed} FAIL out of ${results.length} ---`);

    // Take final screenshot
    await page.screenshot({ path: 'retest/screenshots/JPCET-813-step5-final-verification.png', fullPage: true });

    // STEP 6: Check for Invite Patient button specifically
    console.log('\n=== STEP 6: Invite Patient Button ===');
    const inviteBtn = page.locator('button:has-text("Invite"), a:has-text("Invite"), [class*="invite"]').first();
    const inviteVisible = await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Invite Patient button visible: ${inviteVisible}`);
    if (inviteVisible) {
      const box = await inviteBtn.boundingBox();
      console.log(`Button position: x=${box?.x}, y=${box?.y}`);
    }
  });
});
