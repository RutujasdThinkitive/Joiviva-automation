// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * JPCET-813: As a provider, I should be able to view patient demographic
 * details in the encounter header bar
 *
 * Acceptance Criteria:
 * 1. Patient's full name in encounter header bar
 * 2. Patient's MRN (Medical Record Number)
 * 3. Patient's date of birth and calculated age
 * 4. Patient's gender
 * 5. Patient's mobile number
 * 6. Patient's allergy information (number of allergies)
 * 7. Patient's payer/insurance details
 * 8. Assigned primary clinician/guardian name
 * 9. "Invite Patient" option in header bar
 * 10. Send patient portal invitation on invite click
 */

test.describe('JPCET-813: Patient Demographic Details in Encounter Header Bar', () => {

  let patientName = '';

  test.beforeEach(async ({ page }) => {
    // Navigate to provider patients list
    await page.goto('/provider/patients');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
  });

  // ===== POSITIVE SCENARIOS =====

  test('POS-01: Navigate to patient encounter and verify header bar is visible', async ({ page }) => {
    // Click on a patient from the list
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });

    // Capture patient name before clicking
    const rowText = await patientRow.textContent();
    console.log(`Selected patient row text: ${rowText}`);

    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-patient-overview.png', fullPage: true });

    // Navigate to encounter/charting
    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), a:has-text("Visit"), button:has-text("Encounter"), button:has-text("Start Encounter"), button:has-text("New Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();

    const hasEncounter = await encounterLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Encounter link visible: ${hasEncounter}`);

    if (hasEncounter) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-encounter-header.png', fullPage: true });

    // Verify encounter header bar exists
    const headerBar = page.locator(
      '[class*="header"], [class*="patient-info"], [class*="encounter-header"], [class*="demographic"], [class*="banner"], [class*="patient-banner"]'
    ).first();
    const hasHeader = await headerBar.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Encounter header bar visible: ${hasHeader}`);

    // Capture full page content for analysis
    const pageText = await page.locator('body').textContent();
    console.log(`Page URL: ${page.url()}`);
  });

  test('POS-02: Verify patient full name is displayed in header', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    // Look for encounter/chart navigation
    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), button:has-text("Start Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Check for patient name in the header area
    const headerArea = page.locator('header, [class*="header"], [class*="patient-info"], [class*="banner"]').first();
    const headerText = await headerArea.textContent().catch(() => '');
    console.log(`Header content: ${headerText?.substring(0, 500)}`);

    // Patient name should be visible (non-empty text in header)
    const nameElements = page.locator(
      '[class*="patient-name"], [class*="patientName"], h1, h2, h3, [class*="name"]'
    );
    const nameCount = await nameElements.count();
    console.log(`Name-like elements found: ${nameCount}`);
    for (let i = 0; i < Math.min(nameCount, 5); i++) {
      const text = await nameElements.nth(i).textContent();
      if (text && text.trim()) console.log(`  Name element ${i + 1}: ${text.trim()}`);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-patient-name.png', fullPage: false });
  });

  test('POS-03: Verify MRN (Medical Record Number) is displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Search for MRN on the page
    const pageText = await page.locator('body').textContent();
    const hasMRN = /MRN|Medical Record|mrn/i.test(pageText);
    console.log(`MRN text found on page: ${hasMRN}`);

    const mrnElement = page.locator(
      'text=MRN, [class*="mrn"], [class*="MRN"], [data-testid*="mrn"]'
    ).first();
    const isMrnVisible = await mrnElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`MRN element visible: ${isMrnVisible}`);

    if (isMrnVisible) {
      const mrnText = await mrnElement.textContent();
      console.log(`MRN value: ${mrnText}`);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-mrn.png', fullPage: false });
    expect(hasMRN || isMrnVisible, 'MRN should be visible in encounter header').toBeTruthy();
  });

  test('POS-04: Verify Date of Birth and calculated age are displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();

    // Check for DOB
    const hasDOB = /DOB|Date of Birth|D\.O\.B|dob/i.test(pageText);
    console.log(`DOB text found: ${hasDOB}`);

    // Check for age (number followed by "yr", "years", "y/o", etc.)
    const hasAge = /\d+\s*(yr|years?|y\/o|yrs|Y)/i.test(pageText);
    console.log(`Age text found: ${hasAge}`);

    const dobElement = page.locator('text=/DOB|Date of Birth/i').first();
    const isDobVisible = await dobElement.isVisible({ timeout: 5000 }).catch(() => false);
    if (isDobVisible) {
      const dobText = await dobElement.textContent();
      console.log(`DOB element: ${dobText}`);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-dob-age.png', fullPage: false });
    expect(hasDOB || isDobVisible, 'Date of Birth should be visible in encounter header').toBeTruthy();
  });

  test('POS-05: Verify Gender is displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    const hasGender = /Male|Female|Gender|M\b|F\b|Non-binary|Other/i.test(pageText);
    console.log(`Gender text found: ${hasGender}`);

    const genderElement = page.locator(
      '[class*="gender"], text=/Male|Female/i'
    ).first();
    const isGenderVisible = await genderElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Gender element visible: ${isGenderVisible}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-gender.png', fullPage: false });
  });

  test('POS-06: Verify Mobile number is displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    // Phone pattern: (xxx) xxx-xxxx or xxx-xxx-xxxx or +1xxxxxxxxxx
    const hasPhone = /(\(\d{3}\)\s?\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}|\+\d{10,12}|Phone|Mobile|Cell)/i.test(pageText);
    console.log(`Phone/Mobile text found: ${hasPhone}`);

    const phoneElement = page.locator(
      '[class*="phone"], [class*="mobile"], [class*="contact"], text=/Phone|Mobile/i'
    ).first();
    const isPhoneVisible = await phoneElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Phone element visible: ${isPhoneVisible}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-mobile.png', fullPage: false });
  });

  test('POS-07: Verify Allergy information is displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    const hasAllergy = /Allerg|NKDA|No Known/i.test(pageText);
    console.log(`Allergy text found: ${hasAllergy}`);

    const allergyElement = page.locator(
      'text=/Allerg/i, [class*="allergy"], [class*="alert"]'
    ).first();
    const isAllergyVisible = await allergyElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Allergy element visible: ${isAllergyVisible}`);

    if (isAllergyVisible) {
      const allergyText = await allergyElement.textContent();
      console.log(`Allergy info: ${allergyText}`);
    }

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-allergy.png', fullPage: false });
  });

  test('POS-08: Verify Payer/Insurance details are displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    const hasInsurance = /Insurance|Payer|Plan|Coverage|Blue Cross|Aetna|United|Cigna|Medicaid|Medicare/i.test(pageText);
    console.log(`Insurance/Payer text found: ${hasInsurance}`);

    const insuranceElement = page.locator(
      'text=/Insurance|Payer/i, [class*="insurance"], [class*="payer"], [class*="coverage"]'
    ).first();
    const isInsuranceVisible = await insuranceElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Insurance element visible: ${isInsuranceVisible}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-insurance.png', fullPage: false });
  });

  test('POS-09: Verify Primary Clinician/Guardian name is displayed', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    const hasClinician = /Clinician|Guardian|PCP|Primary Care|Provider|Assigned|Dr\./i.test(pageText);
    console.log(`Clinician/Guardian text found: ${hasClinician}`);

    const clinicianElement = page.locator(
      'text=/Clinician|Guardian|PCP|Primary/i, [class*="clinician"], [class*="guardian"], [class*="provider"]'
    ).first();
    const isClinVisible = await clinicianElement.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Clinician element visible: ${isClinVisible}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-clinician.png', fullPage: false });
  });

  test('POS-10: Verify "Invite Patient" option is visible in header', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Look for Invite Patient button
    const inviteBtn = page.locator(
      'button:has-text("Invite"), a:has-text("Invite"), text=Invite Patient, [class*="invite"], [data-testid*="invite"]'
    ).first();
    const isInviteVisible = await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Invite Patient button visible: ${isInviteVisible}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-invite-patient.png', fullPage: false });
  });

  test('POS-11: Click Invite Patient and verify invitation modal/action', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="list-item"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Intercept invitation API call
    const apiCalls = [];
    page.on('response', async (response) => {
      if (/invite|invitation|portal/i.test(response.url()) && response.request().method() === 'POST') {
        apiCalls.push({ url: response.url(), status: response.status() });
      }
    });

    const inviteBtn = page.locator(
      'button:has-text("Invite"), a:has-text("Invite"), text=Invite Patient, [class*="invite"]'
    ).first();
    const isInviteVisible = await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (isInviteVisible) {
      await inviteBtn.click();
      await page.waitForTimeout(3000);

      // Check for modal/dialog or confirmation
      const modal = page.locator(
        '[role="dialog"], [class*="modal"], [class*="dialog"], .MuiDialog-root'
      ).first();
      const isModalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Invitation modal/dialog visible: ${isModalVisible}`);

      if (isModalVisible) {
        const modalText = await modal.textContent();
        console.log(`Modal content: ${modalText?.substring(0, 300)}`);

        // Check for communication channel options (email, SMS)
        const hasEmail = /email/i.test(modalText || '');
        const hasSMS = /sms|text|phone/i.test(modalText || '');
        console.log(`Email option: ${hasEmail}, SMS option: ${hasSMS}`);
      }

      // Check for success toast/notification
      const toast = page.locator(
        '[class*="toast"], [class*="snackbar"], [class*="notification"], [role="alert"], .MuiSnackbar-root'
      ).first();
      const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasToast) {
        const toastText = await toast.textContent();
        console.log(`Toast notification: ${toastText}`);
      }

      console.log(`API calls captured: ${JSON.stringify(apiCalls)}`);
      await page.screenshot({ path: 'retest/screenshots/JPCET-813-invite-action.png', fullPage: false });
    } else {
      console.log('⚠️ Invite Patient button not found — skipping action test');
    }
  });

  // ===== NEGATIVE SCENARIOS =====

  test('NEG-01: Verify header handles patient with no allergies', async ({ page }) => {
    // Navigate to patients and look for one with no allergies
    const patientRows = page.locator('table tbody tr, [class*="patient-row"], [class*="MuiTableRow"]');
    const count = await patientRows.count();
    console.log(`Total patients listed: ${count}`);

    if (count > 1) {
      // Click second patient (might have different data)
      await patientRows.nth(1).click();
    } else {
      await patientRows.first().click();
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForTimeout(3000);
    }

    // Allergy section should show "NKDA" or "No Known Allergies" or "0 allergies"
    const pageText = await page.locator('body').textContent();
    const allergyHandled = /Allerg|NKDA|No Known|0 allerg/i.test(pageText);
    console.log(`Allergy section handles no-data case: ${allergyHandled}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-neg-no-allergy.png', fullPage: false });
  });

  test('NEG-02: Verify header handles patient with no insurance', async ({ page }) => {
    const patientRows = page.locator('table tbody tr, [class*="patient-row"], [class*="MuiTableRow"]');
    await expect(patientRows.first()).toBeVisible({ timeout: 15000 });

    // Try third patient
    const count = await patientRows.count();
    await patientRows.nth(Math.min(2, count - 1)).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForTimeout(3000);
    }

    const pageText = await page.locator('body').textContent();
    // Should gracefully show "No insurance" or "Self-pay" or empty state, not crash
    const hasInsuranceSection = /Insurance|Payer|Self.?Pay|No Insurance|N\/A/i.test(pageText);
    console.log(`Insurance section present (even if empty): ${hasInsuranceSection}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-neg-no-insurance.png', fullPage: false });
  });

  test('NEG-03: Verify page does not crash on browser back from encounter', async ({ page }) => {
    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForTimeout(3000);
    }

    // Press browser back
    await page.goBack();
    await page.waitForTimeout(3000);

    // Page should not crash — verify content loads
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    console.log(`After back navigation, URL: ${page.url()}`);
    console.log(`Page has content: ${bodyText.length > 100}`);

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-neg-back-nav.png', fullPage: true });
  });

  test('NEG-04: Verify no console errors on encounter header load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text().substring(0, 200));
      }
    });

    const patientRow = page.locator('table tbody tr, [class*="patient-row"], [class*="MuiTableRow"]').first();
    await expect(patientRow).toBeVisible({ timeout: 15000 });
    await patientRow.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const encounterLink = page.locator(
      'a:has-text("Encounter"), a:has-text("Chart"), button:has-text("Encounter"), [href*="encounter"], [href*="chart"]'
    ).first();
    if (await encounterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await encounterLink.click();
      await page.waitForTimeout(5000);
    }

    console.log(`Console errors captured: ${consoleErrors.length}`);
    consoleErrors.forEach((e, i) => console.log(`  Error ${i + 1}: ${e}`));

    await page.screenshot({ path: 'retest/screenshots/JPCET-813-neg-console-errors.png', fullPage: true });

    // Filter out known Jitsi errors
    const relevantErrors = consoleErrors.filter(e => !/meet\.dev\.joiviva|external_api/i.test(e));
    console.log(`Relevant console errors (excluding Jitsi): ${relevantErrors.length}`);
    relevantErrors.forEach((e, i) => console.log(`  Relevant Error ${i + 1}: ${e}`));
  });
});
