// @ts-check
const { test, expect } = require('@playwright/test');

const USERNAME = 'olivia';
const PASSWORD = 'Pass@123';

// Generate unique random data for each test run
const rand4 = () => Math.floor(1000 + Math.random() * 8999).toString();
const rand5 = () => Math.floor(10000 + Math.random() * 89999).toString();

const ICD_CODE = rand4();
const ICD_DESC = `Auto ICD9 test ${ICD_CODE}`;
const ICD_DESC_UPDATED = `Auto ICD9 test ${ICD_CODE} updated`;
const CPT_CODE = rand5(); // CPT: exactly 5 numeric digits (e.g., 99213)
const CPT_DESC = `Auto CPT test ${CPT_CODE}`;
const HCPCS_LETTER = 'ABCDEFGHJKLMNPQRSTUV'[Math.floor(Math.random() * 20)]; // A-V excluding I,O
const HCPCS_CODE = `${HCPCS_LETTER}${rand4()}`; // Level II: 1 letter + 4 digits (e.g., J1234)
const HCPCS_DESC = `Auto HCPCS test ${HCPCS_CODE}`;
const LOINC_CODE = `${rand5()}-${Math.floor(Math.random() * 9)}`; // LOINC: NNNNN-N format
const LOINC_DESC = `Auto LOINC test ${LOINC_CODE}`;

test('Master Codes - ICD, CPT, HCPCS, LOINC Management', async ({ page }) => {
  test.setTimeout(180000);

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto('https://portal.qa.joiviva.org');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/\/admin\//, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // ─── NAVIGATE TO MASTER ───────────────────────────────────────────────────────
  await page.getByRole('link', { name: 'book icon Master' }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // ─── ICD CODE ────────────────────────────────────────────────────────────────

  // Add ICD Code
  await page.getByRole('button', { name: 'Add ICD Code' }).click();
  await page.waitForTimeout(1000);

  await page.getByRole('combobox', { name: 'Select ICD Type' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'ICD-9' }).click();
  await page.waitForTimeout(500);

  await page.getByRole('textbox', { name: 'Enter ICD Code' }).click();
  await page.getByRole('textbox', { name: 'Enter ICD Code' }).fill(ICD_CODE);
  await page.getByRole('textbox', { name: 'Enter Description' }).click();
  await page.getByRole('textbox', { name: 'Enter Description' }).fill(ICD_DESC);
  await page.getByRole('checkbox', { name: 'HCC Code' }).check();

  // Submit - click the modal's Add ICD Code button
  await page.getByRole('button', { name: 'Add ICD Code' }).last().click();
  await page.waitForTimeout(3000);

  // Search for the newly added ICD code to verify it exists
  await page.getByRole('textbox', { name: 'Search Here' }).click();
  await page.getByRole('textbox', { name: 'Search Here' }).fill(ICD_DESC);
  await page.getByRole('textbox', { name: 'Search Here' }).press('Enter');
  await page.waitForTimeout(2000);

  // Verify ICD code appears
  await expect(page.getByText(ICD_DESC)).toBeVisible({ timeout: 10000 });

  // Toggle ICD code status to inactive (click the toggle switch)
  await page.getByRole('row', { name: new RegExp(ICD_CODE) }).getByRole('checkbox').click();
  await page.waitForTimeout(2000);
  await expect(page.getByText('ICD code status updated')).toBeVisible({ timeout: 10000 });

  // Edit ICD Code (click Edit button in the row)
  await page.getByRole('row', { name: new RegExp(ICD_CODE) }).getByRole('button', { name: /Edit/ }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'Enter Description' }).click();
  await page.getByRole('textbox', { name: 'Enter Description' }).fill(ICD_DESC_UPDATED);
  await page.getByRole('checkbox', { name: 'HCC Code' }).uncheck();
  await page.getByRole('button', { name: 'Update ICD Code' }).click();
  await page.waitForTimeout(3000);

  // Verify updated description
  await expect(page.getByText(ICD_DESC_UPDATED)).toBeVisible({ timeout: 10000 });

  // Search for ICD Code by updated description
  await page.getByRole('textbox', { name: 'Search Here' }).click();
  await page.getByRole('textbox', { name: 'Search Here' }).fill(ICD_DESC_UPDATED);
  await page.getByRole('textbox', { name: 'Search Here' }).press('Enter');
  await page.waitForTimeout(2000);
  await expect(page.getByText(ICD_DESC_UPDATED)).toBeVisible({ timeout: 10000 });

  // ─── CPT CODE ────────────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'CPT Code' }).click();
  await page.waitForTimeout(2000);

  // Add CPT Code
  await page.getByRole('button', { name: 'Add CPT Code' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'Add CPT Code' }).click();
  await page.getByRole('textbox', { name: 'Add CPT Code' }).fill(CPT_CODE);
  await page.getByRole('textbox', { name: 'Enter a description...' }).click();
  await page.getByRole('textbox', { name: 'Enter a description...' }).fill(CPT_DESC);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByText('CPT code created successfully')).toBeVisible({ timeout: 10000 });

  // Search for CPT Code
  await page.getByRole('textbox', { name: 'Search Here' }).click();
  await page.getByRole('textbox', { name: 'Search Here' }).fill(CPT_DESC);
  await page.getByRole('textbox', { name: 'Search Here' }).press('Enter');
  await page.waitForTimeout(2000);
  await expect(page.getByText(CPT_DESC)).toBeVisible({ timeout: 10000 });

  // Toggle CPT code status (disable)
  await page.getByRole('checkbox').click();
  await page.waitForTimeout(2000);
  await expect(page.getByText('CPT code status updated')).toBeVisible({ timeout: 10000 });

  // ─── HCPCS CODE ──────────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'HCPCS Code' }).click();
  await page.waitForTimeout(2000);

  // Add HCPCS Code
  await page.getByRole('button', { name: 'Add HCPCS Code' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'Add HCPCS Code' }).click();
  await page.getByRole('textbox', { name: 'Add HCPCS Code' }).fill(HCPCS_CODE);
  await page.getByRole('textbox', { name: 'Enter a description...' }).click();
  await page.getByRole('textbox', { name: 'Enter a description...' }).fill(HCPCS_DESC);
  await page.getByRole('button', { name: 'Add HCPCS Code' }).last().click();
  await page.waitForTimeout(3000);
  await expect(page.getByText('HCPCS code created')).toBeVisible({ timeout: 10000 });

  // Search for HCPCS Code
  await page.getByRole('textbox', { name: 'Search Here' }).click();
  await page.getByRole('textbox', { name: 'Search Here' }).fill(HCPCS_DESC);
  await page.getByRole('textbox', { name: 'Search Here' }).press('Enter');
  await page.waitForTimeout(2000);
  await expect(page.getByRole('gridcell', { name: HCPCS_DESC })).toBeVisible({ timeout: 10000 });

  // Toggle HCPCS code status (disable)
  await page.getByRole('checkbox').click();
  await page.waitForTimeout(2000);
  await expect(page.getByText('HCPCS code status updated')).toBeVisible({ timeout: 10000 });

  // ─── LOINC CODE ──────────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'LOINC Code' }).click();
  await page.waitForTimeout(2000);

  // Add LOINC Code
  await page.getByRole('button', { name: 'Add LOINC Code' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'Add LOINC Code' }).click();
  await page.getByRole('textbox', { name: 'Add LOINC Code' }).fill(LOINC_CODE);
  await page.getByRole('textbox', { name: 'Enter a description...' }).click();
  await page.getByRole('textbox', { name: 'Enter a description...' }).fill(LOINC_DESC);
  await page.getByRole('button', { name: 'Add LOINC Code' }).last().click();
  await page.waitForTimeout(3000);
  await expect(page.getByText('LOINC code created')).toBeVisible({ timeout: 10000 });

  // Search for LOINC Code
  await page.getByRole('textbox', { name: 'Search Here' }).click();
  await page.getByRole('textbox', { name: 'Search Here' }).fill(LOINC_DESC);
  await page.getByRole('textbox', { name: 'Search Here' }).press('Enter');
  await page.waitForTimeout(2000);
  await expect(page.getByRole('gridcell', { name: LOINC_DESC })).toBeVisible({ timeout: 10000 });

  // Toggle LOINC code status (disable)
  await page.getByRole('checkbox').click();
  await page.waitForTimeout(2000);
  await expect(page.getByText('LOINC code status updated')).toBeVisible({ timeout: 10000 });

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────
  await page.getByText('Oliviaa Joyyy').click();
  await page.waitForTimeout(1000);
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  // Verify redirected back to login page
  await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible({ timeout: 15000 });
});
