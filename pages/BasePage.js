/**
 * BasePage - Common methods shared across all page objects.
 * All page objects should extend this class.
 */
class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   * @param {string} path - URL path (e.g., '/login')
   */
  async goto(path) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current page URL
   * @returns {string} Current URL
   */
  getUrl() {
    return this.page.url();
  }

  /**
   * Get page title
   * @returns {Promise<string>} Page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot
   * @param {string} name - Screenshot file name
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if an element is visible
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isVisible(locator) {
    return await locator.isVisible();
  }

  /**
   * Get text content of an element
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<string|null>}
   */
  async getText(locator) {
    return await locator.textContent();
  }

  /**
   * Click an element and wait for navigation
   * @param {import('@playwright/test').Locator} locator
   */
  async clickAndWait(locator) {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      locator.click(),
    ]);
  }
}

module.exports = { BasePage };
