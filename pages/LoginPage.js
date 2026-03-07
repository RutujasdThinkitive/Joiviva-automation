const { BasePage } = require('./BasePage');

/**
 * LoginPage - Joiviva Keycloak SSO login page.
 * portal.qa.joiviva.org redirects to auth.qa.joiviva.org (Keycloak) for authentication.
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // Keycloak login form selectors
    this.usernameInput = page.locator('#username, input[name="username"]').first();
    this.passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
    this.loginButton = page.locator('#kc-login, input[name="login"], input[type="submit"]')
      .or(page.getByRole('button', { name: /sign in/i }))
      .first();
    this.rememberMe = page.locator('#rememberMe, input[name="rememberMe"]').first();
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password")');
    this.errorMessage = page.locator('.alert, .kc-feedback-text, [role="alert"], .alert-error, .pf-m-danger, #input-error').first();
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL || 'https://portal.qa.joiviva.org');
    // Wait for Keycloak redirect
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(3000);
  }

  async login(username, password) {
    await this.usernameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForTimeout(5000);
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }

  async loginAsAdmin() {
    const username = process.env.ADMIN_USERNAME || 'olivia';
    const password = process.env.ADMIN_PASSWORD || 'Pass@123';
    await this.login(username, password);
    await this.page.waitForURL(/\/admin\//, { timeout: 30000 });
  }

  async loginAsProvider() {
    const username = process.env.PROVIDER_USERNAME || 'testnewprovider';
    const password = process.env.PROVIDER_PASSWORD || 'Pass@123';
    await this.login(username, password);
    await this.page.waitForURL(/\/provider\//, { timeout: 30000 });
  }

  async getErrorText() {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async isErrorVisible() {
    try {
      return await this.errorMessage.isVisible();
    } catch {
      return false;
    }
  }

  async isLoginFormVisible() {
    try {
      const u = await this.usernameInput.isVisible();
      const p = await this.passwordInput.isVisible();
      return u && p;
    } catch {
      return false;
    }
  }
}

module.exports = { LoginPage };
