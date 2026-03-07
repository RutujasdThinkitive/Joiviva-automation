// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');

test.describe('Login - Happy Path', () => {
  test('HP-LOGIN-001: Admin full login-to-dashboard flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify login page loads
    expect(await loginPage.isLoginFormVisible()).toBeTruthy();

    // Login as admin
    await loginPage.loginAsAdmin();

    // Verify successful redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Verify navigation bar is present
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('HP-LOGIN-002: Provider full login-to-dashboard flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    expect(await loginPage.isLoginFormVisible()).toBeTruthy();

    await loginPage.loginAsProvider();

    await expect(page).toHaveURL(/\/provider\/dashboard/);
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });
});
