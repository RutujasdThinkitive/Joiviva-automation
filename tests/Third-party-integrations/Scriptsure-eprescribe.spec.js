import { test, expect } from '@playwright/test';

test('Provider - ScriptSure e-Prescribe iframe validation (requires VPN)', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes — iframe may be slow over VPN

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

  // Wait for login redirect to complete
  await page.waitForURL('**/portal.qa.joiviva.org/**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // ─── NAVIGATE TO PATIENTS ──────────────────────────────────────────────────
  await page.getByRole('link', { name: 'person icon Patients' }).click();
  await page.waitForLoadState('networkidle');

  // Select patient by MRN
  await expect(page.getByText('100983')).toBeVisible({ timeout: 15000 });
  await page.getByText('100983').click();
  await page.waitForLoadState('networkidle');

  // ─── OPEN SCRIPTSURE (ALLERGIES) ───────────────────────────────────────────
  await expect(page.getByRole('img', { name: 'Allergies' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('img', { name: 'Allergies' }).click();

  // ─── VALIDATE SCRIPTSURE IFRAME ────────────────────────────────────────────
  // Wait for the ScriptSure iframe to appear and load
  const scriptSureFrame = page.frameLocator('iframe').first();

  // Verify iframe is present and has loaded content (adjust selector based on actual ScriptSure UI)
  await expect(page.locator('iframe').first()).toBeVisible({ timeout: 30000 });

  // Verify ScriptSure content inside iframe — uncomment and adjust after first VPN run
  // await expect(scriptSureFrame.locator('body')).toBeVisible({ timeout: 20000 });

  // ─── ASSERTIONS — UNCOMMENT AFTER IDENTIFYING SCRIPTSURE ELEMENTS ─────────
  // Example: Check for ScriptSure header/logo
  // await expect(scriptSureFrame.getByText('ScriptSure')).toBeVisible({ timeout: 20000 });

  // Example: Check for Allergies section loaded
  // await expect(scriptSureFrame.getByText('Allergies')).toBeVisible();

  // Example: Check for patient name in ScriptSure
  // await expect(scriptSureFrame.getByText('Patient Name Here')).toBeVisible();

  // Final assertion — confirm we're still on the portal
  await expect(page).toHaveURL(/portal\.qa\.joiviva\.org/);
});
