import { test, expect } from '@playwright/test';

const BASE_URL = 'https://portal.qa.joiviva.org';
const AUTH_URL = 'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth';

const USERNAME = 'olivia';
const PASSWORD = 'Pass@123';

const ROLE_TYPE = 'Provider';
const ROLE_NAME = 'staff nurse';

test('Roles & Permissions - Create Role and Edit Permissions', async ({ page }) => {

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto(`${AUTH_URL}?client_id=public-client&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F&response_mode=fragment&response_type=code&scope=openid`);

  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(`${BASE_URL}/**`);

  // ─── NAVIGATE TO ROLES & PERMISSIONS ─────────────────────────────────────────
  await page.getByRole('link', { name: 'shield-plain icon Roles &' }).click();

  // ─── CREATE NEW ROLE ──────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'New Role' }).click();

  await page.getByRole('combobox', { name: 'Select role type' }).click();
  await page.getByRole('option', { name: ROLE_TYPE }).click();

  await page.getByRole('textbox', { name: 'Enter role name' }).fill(ROLE_NAME);

  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Role created successfully')).toBeVisible();

  // ─── FILTER BY ROLE TYPE AND NAME ────────────────────────────────────────────
  await page.getByRole('combobox').filter({ hasText: 'Select Role Type' }).click();
  await page.getByRole('option', { name: ROLE_TYPE }).click();

  await page.getByText('Select Role Name').click();
  await page.getByText(ROLE_NAME).click();

  // ─── EDIT PERMISSIONS ─────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'edit Edit Permissions' }).click();

  // Uncheck the first permission checkbox
  await page.getByRole('checkbox').first().uncheck();

  // Uncheck a specific nested permission checkbox
  await page.locator('div:nth-child(3) > div:nth-child(5) > .MuiBox-root > div > .MuiButtonBase-root > .PrivateSwitchBase-input').uncheck();

  // ─── SAVE CHANGES ─────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Permissions updated')).toBeVisible();
});
