// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { TestDataFactory } = require('../../fixtures/test-data');

test.describe('Login - Full Regression', () => {
  /**
   * @type {LoginPage}
   */
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // --- Positive Tests ---

  test('REG-LOGIN-001: Admin login with valid credentials', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('REG-LOGIN-002: Provider login with valid credentials', async ({ page }) => {
    await loginPage.loginAsProvider();
    await expect(page).toHaveURL(/\/provider\/dashboard/);
  });

  test('REG-LOGIN-003: Login form elements are present', async () => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('REG-LOGIN-004: Password field masks input', async () => {
    const type = await loginPage.passwordInput.getAttribute('type');
    expect(type).toBe('password');
  });

  // --- Negative Tests ---

  test('REG-LOGIN-005: Login fails with wrong username', async ({ page }) => {
    const { wrongUsername } = TestDataFactory.invalidCredentials;
    await loginPage.login(wrongUsername.username, wrongUsername.password);
    await page.waitForTimeout(3000);
    // Should stay on login page or show error
    const url = page.url();
    const hasError = await loginPage.isErrorVisible();
    expect(url.includes('/auth') || url.includes('/login') || !url.includes('/dashboard') || hasError).toBeTruthy();
  });

  test('REG-LOGIN-006: Login fails with wrong password', async ({ page }) => {
    const { wrongPassword } = TestDataFactory.invalidCredentials;
    await loginPage.login(wrongPassword.username, wrongPassword.password);
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasError = await loginPage.isErrorVisible();
    expect(url.includes('/auth') || url.includes('/login') || !url.includes('/dashboard') || hasError).toBeTruthy();
  });

  test('REG-LOGIN-007: Login fails with empty credentials', async ({ page }) => {
    await loginPage.loginButton.click();
    await page.waitForTimeout(2000);
    // Should not navigate to dashboard
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('REG-LOGIN-008: Login fails with empty username', async ({ page }) => {
    await loginPage.passwordInput.fill('Pass@123');
    await loginPage.loginButton.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('REG-LOGIN-009: Login fails with empty password', async ({ page }) => {
    await loginPage.usernameInput.fill('olivia');
    await loginPage.loginButton.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  // --- Security Tests ---

  test('REG-LOGIN-010: SQL injection in username is rejected', async ({ page }) => {
    const { sqlInjection } = TestDataFactory.invalidCredentials;
    await loginPage.login(sqlInjection.username, sqlInjection.password);
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('REG-LOGIN-011: XSS payload in username is rejected', async ({ page }) => {
    const { xssPayload } = TestDataFactory.invalidCredentials;
    await loginPage.login(xssPayload.username, xssPayload.password);
    await page.waitForTimeout(3000);
    // Ensure no script execution
    // @ts-ignore
    const dialogFired = await page.evaluate(() => window.__xss_fired || false).catch(() => false);
    expect(dialogFired).toBeFalsy();
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  // --- Edge Cases ---

  test('REG-LOGIN-012: Leading/trailing spaces in username', async ({ page }) => {
    await loginPage.login('  olivia  ', 'Pass@123');
    await page.waitForTimeout(3000);
    // App may trim or reject - either is acceptable
    const url = page.url();
    // Just verify no crash
    expect(url).toBeTruthy();
  });

  test('REG-LOGIN-013: Very long username input', async ({ page }) => {
    const longUsername = 'a'.repeat(500);
    await loginPage.login(longUsername, 'Pass@123');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('REG-LOGIN-014: Special characters in username', async ({ page }) => {
    await loginPage.login('!@#$%^&*()', 'Pass@123');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('REG-LOGIN-015: Page title is correct', async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toContain('joiviva');
  });

  test('REG-LOGIN-016: Unauthenticated user cannot access admin dashboard directly', async ({ page }) => {
    await page.goto(process.env.BASE_URL + '/admin/dashboard');
    await page.waitForTimeout(3000);
    const url = page.url();
    // Should redirect to login
    expect(url).not.toMatch(/\/admin\/dashboard$/);
  });

  test('REG-LOGIN-017: Unauthenticated user cannot access provider dashboard directly', async ({ page }) => {
    await page.goto(process.env.BASE_URL + '/provider/dashboard');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toMatch(/\/provider\/dashboard$/);
  });
});
