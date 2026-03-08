import { test, expect } from '@playwright/test';

test('Provider - Instant Appointment, Jitsi Visit & Sign Off', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes for the full flow

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto(
    'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth' +
    '?client_id=public-client' +
    '&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F' +
    '&response_mode=fragment&response_type=code&scope=openid'
  );

  await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Username' }).fill('testnewprovider');
  await page.getByRole('textbox', { name: 'Password' }).fill('Pass@123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for login redirect to complete — must land on portal before navigating
  await page.waitForURL('**/portal.qa.joiviva.org/**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // ─── NAVIGATE TO PROVIDER DASHBOARD ─────────────────────────────────────────
  await page.goto('https://portal.qa.joiviva.org/provider/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Dashboard Page')).toBeVisible({ timeout: 20000 });

  // ─── SCHEDULING ──────────────────────────────────────────────────────────────
  await page.getByRole('link', { name: 'Scheduling' }).click();
  await page.waitForLoadState('networkidle');

  // Click "Schedule New" button to open the scheduling modal
  await expect(page.getByRole('heading', { name: 'Schedule New' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('heading', { name: 'Schedule New' }).click();

  // ─── INSTANT APPOINTMENT FORM ────────────────────────────────────────────────
  await page.locator('label').filter({ hasText: 'Instant Appointment' }).click();

  // Select first available patient
  await page.getByRole('combobox', { name: 'Search Email, Patient' }).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
  await page.getByRole('option').first().click();

  // Select first available clinician
  await page.getByRole('combobox', { name: 'Search Clinician' }).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
  await page.getByRole('option').first().click();

  // Select Video visit type
  await page.getByRole('radio', { name: 'Video' }).check();
  await expect(page.getByRole('radio', { name: 'Video' })).toBeChecked();

  // Select appointment type
  await page.getByRole('combobox', { name: 'Select Appointment Type' }).click();
  await expect(page.getByRole('option', { name: 'Virtual telehealth new' })).toBeVisible();
  await page.getByRole('option', { name: 'Virtual telehealth new' }).click();

  // Start visit
  await expect(page.getByRole('button', { name: 'Start Visit' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Visit' }).click();

  // ─── ENCOUNTER & CHECK-IN ────────────────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'Start Encounter' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Encounter' }).click();

  await expect(page.getByRole('button', { name: 'Complete Check In' })).toBeVisible();
  await page.getByRole('button', { name: 'Complete Check In' }).click();

  // Maximize view
  await expect(page.getByRole('button', { name: 'Maximize' })).toBeVisible();
  await page.getByRole('button', { name: 'Maximize' }).click();

  // ─── JITSI IFRAME INTERACTIONS ───────────────────────────────────────────────
  const jitsiFrame = page.locator('iframe[name="jitsiConferenceFrame0"]').contentFrame();

  // Wait for Jitsi pre-join screen to load (camera/mic already off in headless — no permissions)
  await expect(jitsiFrame.getByRole('button', { name: 'Join meeting' })).toBeVisible({ timeout: 30000 });
  await jitsiFrame.getByRole('button', { name: 'Join meeting' }).click();
  await page.waitForTimeout(3000);

  // Minimize the Jitsi call panel so it doesn't block the visit note form
  await expect(page.getByRole('button', { name: 'Minimize' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Minimize' }).click();
  await page.waitForTimeout(1000);

  // ─── VISIT NOTE ──────────────────────────────────────────────────────────────
  // Helper: find the region inside a specific accordion section by button name
  const getAccordionRegion = (name) =>
    page.locator('.MuiAccordion-root', { has: page.getByRole('button', { name, exact: true }) }).getByRole('region');

  const fillSection = async (name, text) => {
    await page.getByRole('button', { name, exact: true }).click();
    const region = getAccordionRegion(name);
    await expect(region).toBeVisible({ timeout: 5000 });
    await region.locator('p').click();
    await region.locator('p').evaluate((el, t) => {
      el.textContent = t;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, text);
  };

  // ── ASSESSMENT (already expanded — just fill) ──────────────────────────
  const assessmentRegion = getAccordionRegion('Assessment');
  await expect(assessmentRegion).toBeVisible({ timeout: 10000 });
  await assessmentRegion.locator('p').click();
  await assessmentRegion.locator('p').evaluate((el) => {
    el.textContent = '1. Lumbar radiculopathy, left-sided (M54.16) - likely L4-L5 or L5-S1 disc herniation. ' +
      '2. Sciatica, left side (M54.31) - nerve root compression. ' +
      '3. Hypertension, essential, controlled (I10). ' +
      '4. Type 2 Diabetes Mellitus without complications (E11.9). ' +
      'Clinical Impression: Classic lumbar disc herniation with radiculopathy. ' +
      'Positive SLR on left at 40 degrees. DTRs intact bilaterally. No cauda equina signs.';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // ── PLAN ───────────────────────────────────────────────────────────────
  await fillSection('Plan',
    'Diagnostics: Lumbar MRI without contrast. CBC, CMP, HbA1c. ' +
    'Medications: Cyclobenzaprine 10mg TID x14d. Gabapentin 300mg TID. Ibuprofen 600mg TID x10d. ' +
    'Continue Lisinopril 10mg, Metformin 500mg BID. ' +
    'Referrals: PT 2-3x/wk x6wks. Pain management if no improvement in 4-6wks. ' +
    'Education: Body mechanics, avoid prolonged sitting, ice 20min 3-4x/day. ' +
    'Follow-up: 2 weeks for MRI review.'
  );

  // ── SUBJECTIVE ─────────────────────────────────────────────────────────
  await fillSection('Subjective',
    'CC: Lower back pain radiating to left leg x3wks. ' +
    'HPI: 45yo male, onset after lifting heavy furniture. Sharp 7/10 pain. ' +
    'Worse with sitting. Better lying flat + ibuprofen 400mg TID. ' +
    'Denies bowel/bladder dysfunction. No trauma. ' +
    'ROS: MSK - LB stiffness, L leg numbness. Neuro - no weakness. ' +
    'PMH: HTN (Lisinopril 10mg), T2DM (Metformin 500mg BID). NKDA. ' +
    'Social: Non-smoker, warehouse supervisor.'
  );

  // ── OBJECTIVE ──────────────────────────────────────────────────────────
  await fillSection('Objective',
    'Vitals: BP 138/86, HR 78, Temp 98.4F, RR 16, SpO2 98% RA, BMI 28.4. ' +
    'General: Alert, oriented, mild distress. ' +
    'Spine: Tenderness L4-L5, L5-S1. Paravertebral spasm L. Decreased ROM. ' +
    'Neuro: SLR positive L at 40deg. Sensation intact L1-S1. Motor 5/5 bilateral LE. DTRs 2+. ' +
    'Gait: Antalgic favoring left.'
  );

  // Select care plan
  await page.getByRole('combobox', { name: 'Select Care Plan' }).click();
  await page.getByRole('option').first().click();

  // Preview and save note
  await expect(page.getByRole('button', { name: 'Preview & Save' })).toBeVisible();
  await page.getByRole('button', { name: 'Preview & Save' }).click();
  await page.waitForTimeout(5000);

  // ─── END CALL ──────────────────────────────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'End Call' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'End Call' }).click();

  // Handle "Exit Virtual Visit" confirmation dialog
  await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Exit' }).click();
  await page.waitForTimeout(3000);

  // ─── SIGN OFF & SAVE ─────────────────────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'Sign Off & Save' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Sign Off & Save' }).click();

  await expect(page.getByRole('button', { name: 'Sign & Lock' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign & Lock' }).click();

  await expect(page.getByRole('button', { name: 'Okay' })).toBeVisible();
  await page.getByRole('button', { name: 'Okay' }).click();

  // Final assertion — confirm we're back on a stable page post sign-off
  await expect(page).toHaveURL(/portal\.qa\.joiviva\.org/);
});