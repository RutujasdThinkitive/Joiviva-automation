const { test: setup, expect } = require('@playwright/test');
const path = require('path');

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json');
const PROVIDER_AUTH_FILE = path.join(__dirname, '../.auth/provider.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://portal.qa.joiviva.org');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Fill Keycloak login form
  const usernameInput = page.locator('#username, input[name="username"]').first();
  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
  await usernameInput.fill(process.env.ADMIN_USERNAME || 'olivia');
  await page.locator('#password, input[name="password"], input[type="password"]').first().fill(process.env.ADMIN_PASSWORD || 'Pass@123');
  await page.locator('#kc-login, input[name="login"], input[type="submit"]').first().click();

  await page.waitForURL(/\/admin\//, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

setup('authenticate as provider', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://portal.qa.joiviva.org');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const usernameInput = page.locator('#username, input[name="username"]').first();
  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
  await usernameInput.fill(process.env.PROVIDER_USERNAME || 'testnewprovider');
  await page.locator('#password, input[name="password"], input[type="password"]').first().fill(process.env.PROVIDER_PASSWORD || 'Pass@123');
  await page.locator('#kc-login, input[name="login"], input[type="submit"]').first().click();

  await page.waitForURL(/\/provider\//, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  await page.context().storageState({ path: PROVIDER_AUTH_FILE });
});

module.exports = { ADMIN_AUTH_FILE, PROVIDER_AUTH_FILE };
