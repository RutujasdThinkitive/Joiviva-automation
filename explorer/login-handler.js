/**
 * LoginHandler - Handles authentication before crawling.
 * Auto-detects login form fields or uses provided selectors.
 * Captures network/API logs and browser console errors during login
 * to provide detailed diagnostics on failure.
 */
class LoginHandler {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config - Explorer config with credentials
   */
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.networkLogs = [];
    this.consoleLogs = [];
  }

  /**
   * Perform login and return whether it succeeded.
   * On failure, captures a screenshot for the report.
   * @returns {Promise<{success: boolean, landingUrl: string, error: string|null, screenshotPath: string|null}>}
   */
  async login() {
    const { url, email, password, loginPath } = this.config;

    if (!email || !password) {
      console.log('[Login] No credentials provided, skipping authentication.');
      return { success: true, landingUrl: url, error: null, screenshotPath: null };
    }

    try {
      // Start capturing network and console logs before login attempt
      this._startLogCapture();

      // Navigate to login page
      const loginUrl = loginPath
        ? new URL(loginPath, url).href
        : url;

      console.log(`[Login] Navigating to ${loginUrl}`);
      await this.page.goto(loginUrl, { waitUntil: 'networkidle', timeout: this.config.pageTimeout });

      // Detect login form fields
      const fields = await this._detectLoginFields();

      if (!fields.emailField || !fields.passwordField) {
        // Try common login paths if we're not on a login page
        const tried = await this._tryCommonLoginPaths();
        if (!tried) {
          const ss = await this._takeFailureScreenshot('login-form-not-found');
          return {
            success: false,
            landingUrl: this.page.url(),
            error: 'Could not detect login form. Try providing --login-path.',
            screenshotPath: ss,
            ...this._getLogData(),
          };
        }
        // Re-detect after navigating to login path
        const retryFields = await this._detectLoginFields();
        if (!retryFields.emailField || !retryFields.passwordField) {
          const ss = await this._takeFailureScreenshot('login-fields-not-found');
          return {
            success: false,
            landingUrl: this.page.url(),
            error: 'Login form fields not found after navigation.',
            screenshotPath: ss,
            ...this._getLogData(),
          };
        }
        Object.assign(fields, retryFields);
      }

      console.log('[Login] Login form detected. Filling credentials...');

      // Fill email/username
      await fields.emailField.fill(email);
      // Fill password
      await fields.passwordField.fill(password);

      // Get URL before submit to detect navigation
      const urlBefore = this.page.url();

      // Click submit and wait for navigation (SPA-aware)
      if (fields.submitButton) {
        await Promise.all([
          this.page.waitForURL((url) => url.href !== urlBefore, { timeout: 15000 }).catch(() => {}),
          fields.submitButton.click(),
        ]);
      } else {
        await Promise.all([
          this.page.waitForURL((url) => url.href !== urlBefore, { timeout: 15000 }).catch(() => {}),
          fields.passwordField.press('Enter'),
        ]);
      }

      // Wait for network to settle after SPA navigation
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Extra wait for SPA framework routing (React, Angular, Vue)
      await this.page.waitForTimeout(3000);

      // Verify login success
      const urlAfter = this.page.url();
      console.log(`[Login] URL after login attempt: ${urlAfter}`);

      const hasError = await this._checkForLoginError();

      if (hasError) {
        const errorText = await this._extractErrorText();
        const ss = await this._takeFailureScreenshot('login-error-message');
        return {
          success: false,
          landingUrl: urlAfter,
          error: `Login failed - error message detected on page: ${errorText}`,
          screenshotPath: ss,
          ...this._getLogData(),
        };
      }

      // Success checks: URL changed, or login form disappeared, or dashboard-like content appeared
      const urlChanged = urlAfter !== urlBefore;
      const formGone = !(await this._hasLoginForm());
      const hasDashboardContent = await this._hasDashboardContent();
      const success = urlChanged || formGone || hasDashboardContent;

      console.log(
        `[Login] URL changed: ${urlChanged}, Form gone: ${formGone}, Dashboard content: ${hasDashboardContent}`
      );

      if (success) {
        console.log(`[Login] Login successful. Landing page: ${urlAfter}`);
        return { success: true, landingUrl: urlAfter, error: null, screenshotPath: null };
      }

      // Login failed
      const ss = await this._takeFailureScreenshot('login-failed');
      console.log('[Login] Login FAILED - URL unchanged and login form still visible.');
      return {
        success: false,
        landingUrl: urlAfter,
        error: 'Login failed - credentials may be incorrect or the app did not respond as expected.',
        screenshotPath: ss,
        ...this._getLogData(),
      };
    } catch (error) {
      const ss = await this._takeFailureScreenshot('login-exception');
      return {
        success: false,
        landingUrl: this.page.url(),
        error: `Login error: ${error.message}`,
        screenshotPath: ss,
        ...this._getLogData(),
      };
    }
  }

  /**
   * Take a screenshot on login failure
   * @param {string} reason - Short reason for the failure (used in filename)
   * @returns {Promise<string|null>} Screenshot path or null
   */
  async _takeFailureScreenshot(reason) {
    try {
      const fs = require('fs');
      const path = require('path');
      const screenshotDir = path.resolve(this.config.screenshotDir);
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      const filepath = path.join(screenshotDir, `${reason}.png`);
      await this.page.screenshot({ path: filepath, fullPage: true });
      console.log(`[Login] Failure screenshot saved: ${filepath}`);
      return filepath;
    } catch {
      return null;
    }
  }

  /**
   * Auto-detect email/username, password, and submit fields
   * @returns {Promise<Object>}
   */
  async _detectLoginFields() {
    // Email / username field detection
    const emailSelectors = [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[name*="user" i]',
      'input[id*="email" i]',
      'input[id*="user" i]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="user" i]',
      '[data-testid*="email" i]',
      '[data-testid*="user" i]',
    ];

    // Password field detection
    const passwordSelectors = [
      'input[type="password"]',
      'input[name*="password" i]',
      'input[id*="password" i]',
      '[data-testid*="password" i]',
    ];

    // Submit button detection
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      'button:has-text("Submit")',
      '[data-testid*="login" i]',
      '[data-testid*="signin" i]',
      '[data-testid*="submit" i]',
    ];

    const emailField = await this._findFirst(emailSelectors);
    const passwordField = await this._findFirst(passwordSelectors);
    const submitButton = await this._findFirst(submitSelectors);

    return { emailField, passwordField, submitButton };
  }

  /**
   * Try navigating to common login paths
   * @returns {Promise<boolean>} Whether a login page was found
   */
  async _tryCommonLoginPaths() {
    const commonPaths = ['/login', '/signin', '/sign-in', '/auth/login', '/auth', '/account/login'];
    const baseUrl = this.config.url;

    for (const path of commonPaths) {
      try {
        const testUrl = new URL(path, baseUrl).href;
        console.log(`[Login] Trying ${testUrl}...`);
        const response = await this.page.goto(testUrl, {
          waitUntil: 'networkidle',
          timeout: 10000,
        });
        if (response && response.ok() && await this._hasLoginForm()) {
          console.log(`[Login] Found login page at ${path}`);
          return true;
        }
      } catch {
        // Continue to next path
      }
    }

    return false;
  }

  /**
   * Check if current page has a login form
   * @returns {Promise<boolean>}
   */
  async _hasLoginForm() {
    return await this.page.evaluate(() => {
      const hasPassword = !!document.querySelector('input[type="password"]');
      const hasEmail = !!document.querySelector(
        'input[type="email"], input[name*="email" i], input[name*="user" i]'
      );
      return hasPassword && hasEmail;
    });
  }

  /**
   * Check if post-login content is visible (dashboard, sidebar, nav menus)
   * @returns {Promise<boolean>}
   */
  async _hasDashboardContent() {
    return await this.page.evaluate(() => {
      const indicators = [
        'nav', '[role="navigation"]', '.sidebar', '.dashboard',
        '.main-content', '[class*="layout"]', '[class*="dashboard"]',
        'aside', '.menu', '[class*="sidebar"]', '[class*="nav"]',
      ];
      for (const sel of indicators) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null && el.children.length > 2) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Check if there's a visible error message after login attempt
   * @returns {Promise<boolean>}
   */
  async _checkForLoginError() {
    return await this.page.evaluate(() => {
      const errorSelectors = [
        '[role="alert"]',
        '.error',
        '.alert-danger',
        '.alert-error',
        '[data-testid*="error" i]',
        '.error-message',
        '.form-error',
        '.login-error',
      ];
      for (const sel of errorSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null && el.textContent.trim()) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Find the first visible element matching any of the selectors
   * @param {string[]} selectors
   * @returns {Promise<import('@playwright/test').Locator|null>}
   */
  async _findFirst(selectors) {
    for (const selector of selectors) {
      try {
        const locator = this.page.locator(selector).first();
        if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
          return locator;
        }
      } catch {
        // Continue to next selector
      }
    }
    return null;
  }

  /**
   * Start capturing network requests/responses and browser console messages.
   * Called before the login attempt so all API activity is recorded.
   */
  _startLogCapture() {
    // Capture network requests and responses (focus on API/XHR calls)
    this.page.on('response', async (response) => {
      const url = response.url();
      const resourceType = response.request().resourceType();

      // Only capture API/document calls, skip static assets
      if (['xhr', 'fetch', 'document'].includes(resourceType)) {
        const entry = {
          timestamp: new Date().toISOString(),
          method: response.request().method(),
          url,
          status: response.status(),
          statusText: response.statusText(),
          resourceType,
        };

        // Capture response body for failed requests or login-related endpoints
        if (response.status() >= 400 || /login|auth|token|session|signin/i.test(url)) {
          try {
            const body = await response.text();
            // Limit body size to avoid huge payloads
            entry.responseBody = body.substring(0, 2000);
            // Try to parse as JSON for cleaner output
            try {
              entry.responseJson = JSON.parse(body);
            } catch {
              // Not JSON, keep as text
            }
          } catch {
            entry.responseBody = '[Could not read response body]';
          }
        }

        // Capture request body for POST/PUT (login payloads)
        if (['POST', 'PUT', 'PATCH'].includes(entry.method)) {
          try {
            const postData = response.request().postData();
            if (postData) {
              // Mask password values in the logged data
              entry.requestBody = postData.replace(
                /("password"\s*:\s*")([^"]*)/gi,
                '$1****'
              ).replace(
                /(password=)([^&]*)/gi,
                '$1****'
              ).substring(0, 1000);
            }
          } catch {
            // No post data available
          }
        }

        this.networkLogs.push(entry);
      }
    });

    // Capture browser console messages (errors and warnings)
    this.page.on('console', (msg) => {
      const type = msg.type();
      if (['error', 'warning'].includes(type)) {
        this.consoleLogs.push({
          timestamp: new Date().toISOString(),
          type,
          text: msg.text().substring(0, 500),
        });
      }
    });

    // Capture uncaught page errors
    this.page.on('pageerror', (error) => {
      this.consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: 'pageerror',
        text: error.message.substring(0, 500),
      });
    });
  }

  /**
   * Return collected log data for inclusion in login result.
   * @returns {{networkLogs: Array, consoleLogs: Array}}
   */
  _getLogData() {
    return {
      networkLogs: this.networkLogs,
      consoleLogs: this.consoleLogs,
    };
  }

  /**
   * Extract visible error text from the page after a failed login.
   * @returns {Promise<string>}
   */
  async _extractErrorText() {
    return await this.page.evaluate(() => {
      const errorSelectors = [
        '[role="alert"]',
        '.error',
        '.alert-danger',
        '.alert-error',
        '[data-testid*="error" i]',
        '.error-message',
        '.form-error',
        '.login-error',
        '.mat-error',
        '.mat-snack-bar-container',
        '.toast-error',
        '.notification-error',
        'snack-bar-container',
      ];
      const texts = [];
      for (const sel of errorSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null && el.textContent.trim()) {
          texts.push(el.textContent.trim().substring(0, 200));
        }
      }
      return texts.join(' | ') || 'Unknown error';
    });
  }
}

module.exports = { LoginHandler };
