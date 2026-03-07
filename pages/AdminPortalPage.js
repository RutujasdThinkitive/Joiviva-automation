const { BasePage } = require('./BasePage');

/**
 * AdminPortalPage - Page object for Admin Portal navigation and modules.
 * Top nav: Dashboard, Clinic Groups, Master, Admins, Roles & Responsibility, Audit Log, Profile
 */
class AdminPortalPage extends BasePage {
  constructor(page) {
    super(page);

    // Top navigation links
    this.navDashboard = page.locator('a:has-text("Dashboard")').first();
    this.navClinicGroups = page.locator('a:has-text("Clinic Groups")');
    this.navMaster = page.locator('a:has-text("Master")');
    this.navAdmins = page.locator('a:has-text("Admins")');
    this.navRolesResponsibility = page.locator('a:has-text("Roles & Responsibility"), a:has-text("Roles")').first();
    this.navAuditLog = page.locator('a:has-text("Audit Log")');
    this.navProfile = page.locator('a:has-text("Profile")');

    // Header elements
    this.headerLogo = page.locator('header img, header svg, .logo').first();
    this.notificationIcon = page.locator('[aria-label*="notification" i], .notification, button:has(svg)').first();
    this.userMenu = page.locator('text=Olivia, [class*="user"], [class*="avatar"]').first();

    // Common content area
    this.mainContent = page.locator('main, [class*="content"], [class*="main"]').first();
    this.pageHeading = page.locator('h1, h2, h3, h4').first();
  }

  async navigateToDashboard() {
    await this.navDashboard.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToClinicGroups() {
    await this.navClinicGroups.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToMaster() {
    await this.navMaster.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToAdmins() {
    await this.navAdmins.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToRolesResponsibility() {
    await this.navRolesResponsibility.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToAuditLog() {
    await this.navAuditLog.click();
    await this.page.waitForTimeout(2000);
  }

  async navigateToProfile() {
    await this.navProfile.click();
    await this.page.waitForTimeout(2000);
  }

  async isNavVisible() {
    return await this.navDashboard.isVisible();
  }

  async getActiveNavItem() {
    const activeLink = this.page.locator('a[class*="active"], a[aria-current="page"]').first();
    try {
      return await activeLink.textContent();
    } catch {
      return null;
    }
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

  // ===== Clinic Groups CRUD =====

  get clinicGroupAddButton() {
    return this.page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), button:has-text("Add Clinic Group")').first();
  }

  get clinicGroupTable() {
    return this.page.locator('table, [class*="table"], [role="grid"], [class*="list"]').first();
  }

  get clinicGroupSearchInput() {
    return this.page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
  }

  get clinicGroupFormNameInput() {
    return this.page.locator('input[name="name"], input[name="clinicGroupName"], input[name="groupName"], input[placeholder*="name" i], input[formcontrolname*="name" i]').first();
  }

  get clinicGroupFormDescInput() {
    return this.page.locator('textarea[name="description"], textarea[placeholder*="description" i], input[name="description"], textarea[formcontrolname*="description" i], textarea').first();
  }

  get clinicGroupFormEmailInput() {
    return this.page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i], input[formcontrolname*="email" i]').first();
  }

  get clinicGroupFormPhoneInput() {
    return this.page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i], input[formcontrolname*="phone" i]').first();
  }

  get clinicGroupFormAddressInput() {
    return this.page.locator('input[name="address"], input[placeholder*="address" i], textarea[name="address"], input[formcontrolname*="address" i]').first();
  }

  get clinicGroupSaveButton() {
    return this.page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Create"), button[type="submit"]').first();
  }

  get clinicGroupUpdateButton() {
    return this.page.locator('button:has-text("Update"), button:has-text("Save"), button[type="submit"]').first();
  }

  get clinicGroupDeleteConfirmButton() {
    return this.page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();
  }

  get successToast() {
    return this.page.locator('[class*="toast"], [class*="snackbar"], [class*="notification"], [class*="alert-success"], [role="alert"]').first();
  }

  async clickAddClinicGroup() {
    await this.clinicGroupAddButton.click();
    await this.page.waitForTimeout(2000);
  }

  async fillClinicGroupForm({ name, description, email, phone, address }) {
    if (name) {
      await this.clinicGroupFormNameInput.waitFor({ state: 'visible', timeout: 10000 });
      await this.clinicGroupFormNameInput.fill(name);
    }
    if (description) {
      const descVisible = await this.clinicGroupFormDescInput.isVisible().catch(() => false);
      if (descVisible) await this.clinicGroupFormDescInput.fill(description);
    }
    if (email) {
      const emailVisible = await this.clinicGroupFormEmailInput.isVisible().catch(() => false);
      if (emailVisible) await this.clinicGroupFormEmailInput.fill(email);
    }
    if (phone) {
      const phoneVisible = await this.clinicGroupFormPhoneInput.isVisible().catch(() => false);
      if (phoneVisible) await this.clinicGroupFormPhoneInput.fill(phone);
    }
    if (address) {
      const addrVisible = await this.clinicGroupFormAddressInput.isVisible().catch(() => false);
      if (addrVisible) await this.clinicGroupFormAddressInput.fill(address);
    }
  }

  async saveClinicGroup() {
    await this.clinicGroupSaveButton.click();
    await this.page.waitForTimeout(3000);
  }

  async searchClinicGroup(name) {
    const searchVisible = await this.clinicGroupSearchInput.isVisible().catch(() => false);
    if (searchVisible) {
      await this.clinicGroupSearchInput.fill(name);
      await this.page.waitForTimeout(2000);
    }
  }

  async findClinicGroupRow(name) {
    return this.page.locator(`table tr:has-text("${name}"), [class*="row"]:has-text("${name}"), [class*="card"]:has-text("${name}")`).first();
  }

  async clickEditOnClinicGroup(name) {
    const row = await this.findClinicGroupRow(name);
    const editBtn = row.locator('button:has-text("Edit"), button[aria-label*="edit" i], a:has-text("Edit"), [class*="edit"], svg[class*="edit"]').first();
    const editVisible = await editBtn.isVisible().catch(() => false);
    if (editVisible) {
      await editBtn.click();
    } else {
      // Try clicking the row itself or an action menu
      const actionBtn = row.locator('button[aria-label*="action" i], button[aria-label*="more" i], button:has(svg), [class*="action"]').first();
      const actionVisible = await actionBtn.isVisible().catch(() => false);
      if (actionVisible) {
        await actionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.locator('text=Edit').first().click();
      } else {
        await row.click();
      }
    }
    await this.page.waitForTimeout(2000);
  }

  async clickDeleteOnClinicGroup(name) {
    const row = await this.findClinicGroupRow(name);
    const deleteBtn = row.locator('button:has-text("Delete"), button[aria-label*="delete" i], [class*="delete"], svg[class*="delete"]').first();
    const deleteVisible = await deleteBtn.isVisible().catch(() => false);
    if (deleteVisible) {
      await deleteBtn.click();
    } else {
      const actionBtn = row.locator('button[aria-label*="action" i], button[aria-label*="more" i], button:has(svg), [class*="action"]').first();
      const actionVisible = await actionBtn.isVisible().catch(() => false);
      if (actionVisible) {
        await actionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.locator('text=Delete').first().click();
      }
    }
    await this.page.waitForTimeout(2000);
  }

  async confirmDelete() {
    await this.clinicGroupDeleteConfirmButton.click();
    await this.page.waitForTimeout(3000);
  }

  async isClinicGroupVisible(name) {
    const row = this.page.locator(`text=${name}`).first();
    return await row.isVisible().catch(() => false);
  }
}

module.exports = { AdminPortalPage };
