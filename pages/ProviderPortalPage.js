const { BasePage } = require('./BasePage');

/**
 * ProviderPortalPage - Page object for Provider Portal navigation and modules.
 * Top nav: Dashboard, Scheduling, Patients, Communications, Billing, Referral, Templates, Settings
 */
class ProviderPortalPage extends BasePage {
  constructor(page) {
    super(page);

    // Top navigation links
    this.navDashboard = page.locator('a:has-text("Dashboard")').first();
    this.navScheduling = page.locator('a:has-text("Scheduling")');
    this.navPatients = page.locator('a:has-text("Patients")');
    this.navCommunications = page.locator('a:has-text("Communications")');
    this.navBilling = page.locator('a:has-text("Billing")');
    this.navReferral = page.locator('a:has-text("Referral")');
    this.navTemplates = page.locator('a:has-text("Templates")');
    this.navSettings = page.locator('a:has-text("Settings")');

    // Header elements
    this.headerLogo = page.locator('header img, header svg, .logo').first();
    this.notificationIcon = page.locator('[aria-label*="notification" i], .notification').first();
    this.userMenu = page.locator('[class*="user"], [class*="avatar"]').first();

    // Common content area
    this.mainContent = page.locator('main, [class*="content"], [class*="main"]').first();
    this.pageHeading = page.locator('h1, h2, h3, h4').first();
  }

  // --- Navigation Methods ---

  async navigateToDashboard() {
    await this.navDashboard.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToScheduling() {
    await this.navScheduling.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToPatients() {
    await this.navPatients.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToCommunications() {
    await this.navCommunications.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToBilling() {
    await this.navBilling.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToReferral() {
    await this.navReferral.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToTemplates() {
    await this.navTemplates.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToSettings() {
    await this.navSettings.click();
    await this.page.waitForTimeout(2000);
  }

  // --- Helper Methods ---

  async isNavVisible() {
    return await this.navDashboard.isVisible();
  }

  async getPageHeadingText() {
    try {
      await this.pageHeading.waitFor({ state: 'visible', timeout: 5000 });
      return await this.pageHeading.textContent();
    } catch {
      return null;
    }
  }

  async getCurrentPath() {
    return new URL(this.page.url()).pathname;
  }

  async getAllNavLinks() {
    const links = this.page.locator('header a, nav a');
    return await links.allTextContents();
  }

  async isModuleLoaded() {
    await this.page.waitForTimeout(2000);
    const url = this.page.url();
    const is404 = await this.page.locator('text=404, text=Not Found').isVisible().catch(() => false);
    return !is404 && !url.includes('/auth/');
  }
}

module.exports = { ProviderPortalPage };
