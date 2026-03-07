// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');

test.describe('Login Page - Smoke Tests', () => {
  /**
   * @type {LoginPage}
   */
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('SM-LOGIN-001: Login page loads and form is visible', async ({ page }) => {
    // Redirects to Keycloak SSO at auth.qa.joiviva.org
    await expect(page).toHaveURL(/joiviva|keycloak/);
    expect(await loginPage.isLoginFormVisible()).toBeTruthy();
  });

  test('SM-LOGIN-002: Username and password fields are visible', async () => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('SM-LOGIN-003: Login button is visible', async () => {
    await expect(loginPage.loginButton).toBeVisible();
    // Keycloak disables Sign In button until fields are filled
    await loginPage.usernameInput.fill('test');
    await loginPage.passwordInput.fill('test');
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('SM-LOGIN-004: Admin login redirects to admin dashboard', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('SM-LOGIN-005: Provider login redirects to provider dashboard', async ({ page }) => {
    await loginPage.loginAsProvider();
    await expect(page).toHaveURL(/\/provider\/dashboard/);
  });

  test('SM-LOGIN-006: Login page heading is visible', async () => {
    // Keycloak redirects cause context destruction, so check heading instead of title
    const heading = loginPage.page.locator('h1, #kc-page-title').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const text = await heading.textContent();
    expect(text.toLowerCase()).toContain('sign in');
  });
});
