const { BasePage } = require('./BasePage');

/**
 * MasterCodePage - Page object for Admin Portal > Master Code Management.
 * Tabs: ICD Code, CPT Code, HCPCS Code, LOINC Code
 */
class MasterCodePage extends BasePage {
  constructor(page) {
    super(page);

    // Navigation
    this.navMaster = page.locator('a', { hasText: 'Master' }).first();

    // Tabs
    this.tabICD = page.getByRole('tab', { name: 'ICD Code' });
    this.tabCPT = page.getByRole('tab', { name: 'CPT Code' });
    this.tabHCPCS = page.getByRole('tab', { name: 'HCPCS Code' });
    this.tabLOINC = page.getByRole('tab', { name: 'LOINC Code' });

    // Search
    this.searchInput = page.getByRole('textbox', { name: 'Search Here' });

    // Success/status toasts
    this.toastMessage = page.locator('[class*="toast"], [class*="snackbar"], [class*="notification"], [role="alert"]').first();

    // User menu
    this.userMenuTrigger = page.getByText('Oliviaa Joyyy');
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  // ===== Navigation =====

  async navigateToMaster() {
    await this.navMaster.waitFor({ state: 'visible', timeout: 15000 });
    await this.navMaster.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async switchToTab(tabName) {
    const tab = this.page.getByRole('tab', { name: tabName });
    await tab.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ===== ICD Code =====

  get addICDButton() {
    return this.page.getByRole('button', { name: 'Add ICD Code' });
  }

  get icdTypeDropdown() {
    return this.page.getByRole('combobox', { name: 'Select ICD Type' });
  }

  get icdCodeInput() {
    return this.page.getByRole('textbox', { name: 'Enter ICD Code' });
  }

  get icdDescriptionInput() {
    return this.page.getByRole('textbox', { name: 'Enter Description' });
  }

  get hccCodeCheckbox() {
    return this.page.getByRole('checkbox', { name: 'HCC Code' });
  }

  get addICDSubmitButton() {
    return this.page.getByRole('button', { name: 'Add ICD Code' });
  }

  get updateICDButton() {
    return this.page.getByRole('button', { name: 'Update ICD Code' });
  }

  async selectICDType(type) {
    await this.icdTypeDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: type }).click();
    await this.page.waitForTimeout(500);
  }

  async addICDCode({ type, code, description, hccCode = false }) {
    // Click the page-level "Add ICD Code" button (first one, has img inside)
    await this.page.getByRole('button', { name: 'Add ICD Code' }).first().click();
    await this.page.waitForTimeout(1000);

    // Wait for the modal/dialog to appear
    await this.page.getByRole('combobox', { name: 'Select ICD Type' }).waitFor({ state: 'visible', timeout: 10000 });

    // Select ICD type from dropdown
    await this.page.getByRole('combobox', { name: 'Select ICD Type' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: type }).click();
    await this.page.waitForTimeout(500);

    // Fill code
    await this.page.getByRole('textbox', { name: 'Enter ICD Code' }).click();
    await this.page.getByRole('textbox', { name: 'Enter ICD Code' }).fill(code);

    // Fill description
    await this.page.getByRole('textbox', { name: 'Enter Description' }).click();
    await this.page.getByRole('textbox', { name: 'Enter Description' }).fill(description);

    // Check HCC if needed
    if (hccCode) {
      await this.page.getByRole('checkbox', { name: 'HCC Code' }).check();
    }

    // Submit - click the modal's "Add ICD Code" button (last one, enabled after valid input)
    await this.page.getByRole('button', { name: 'Add ICD Code' }).last().click();
    await this.page.waitForTimeout(2000);
  }

  async editICDCode(rowText) {
    const row = this.page.getByRole('row', { name: new RegExp(rowText) });
    await row.getByRole('button').click();
    await this.page.waitForTimeout(1000);
  }

  async updateICDDescription(description, uncheckHCC = false) {
    await this.icdDescriptionInput.click();
    await this.icdDescriptionInput.fill(description);
    if (uncheckHCC) {
      await this.hccCodeCheckbox.uncheck();
    }
    await this.updateICDButton.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async toggleICDStatus(rowText) {
    const row = this.page.getByRole('row', { name: new RegExp(rowText) });
    await row.getByRole('checkbox').uncheck();
  }

  async verifyICDActiveStatus(rowText) {
    const row = this.page.getByRole('row', { name: new RegExp(rowText) });
    await row.getByTestId('DoneSharpIcon').click();
  }

  async verifyICDInactiveStatus(rowText) {
    const row = this.page.getByRole('row', { name: new RegExp(rowText) });
    await row.getByTestId('ClearSharpIcon').click();
  }

  // ===== CPT Code =====

  get addCPTButton() {
    return this.page.getByRole('button', { name: 'Add CPT Code' });
  }

  get cptCodeInput() {
    return this.page.getByRole('textbox', { name: 'Add CPT Code' });
  }

  get cptDescriptionInput() {
    return this.page.getByRole('textbox', { name: 'Enter a description...' });
  }

  get createCPTButton() {
    return this.page.getByRole('button', { name: 'Create' });
  }

  async addCPTCode({ code, description }) {
    await this.addCPTButton.click();
    await this.cptCodeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.cptCodeInput.click();
    await this.cptCodeInput.fill(code);
    await this.cptDescriptionInput.click();
    await this.cptDescriptionInput.fill(description);
    await this.createCPTButton.click();
    await this.page.waitForTimeout(2000);
  }

  // ===== HCPCS Code =====

  get addHCPCSButton() {
    return this.page.getByRole('button', { name: 'Add HCPCS Code' });
  }

  get hcpcsCodeInput() {
    return this.page.getByRole('textbox', { name: 'Add HCPCS Code' });
  }

  get hcpcsDescriptionInput() {
    return this.page.getByRole('textbox', { name: 'Enter a description...' });
  }

  get addHCPCSSubmitButton() {
    return this.page.getByRole('button', { name: 'Add HCPCS Code' });
  }

  async addHCPCSCode({ code, description }) {
    await this.addHCPCSButton.click();
    await this.hcpcsCodeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.hcpcsCodeInput.click();
    await this.hcpcsCodeInput.fill(code);
    await this.hcpcsDescriptionInput.click();
    await this.hcpcsDescriptionInput.fill(description);
    await this.page.getByRole('button', { name: 'Add HCPCS Code' }).last().click();
    await this.page.waitForTimeout(2000);
  }

  // ===== LOINC Code =====

  get addLOINCButton() {
    return this.page.getByRole('button', { name: 'Add LOINC Code' });
  }

  get loincCodeInput() {
    return this.page.getByRole('textbox', { name: 'Add LOINC Code' });
  }

  get loincDescriptionInput() {
    return this.page.getByRole('textbox', { name: 'Enter a description...' });
  }

  get addLOINCSubmitButton() {
    return this.page.getByRole('button', { name: 'Add LOINC Code' });
  }

  async addLOINCCode({ code, description }) {
    await this.addLOINCButton.click();
    await this.loincCodeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.loincCodeInput.click();
    await this.loincCodeInput.fill(code);
    await this.loincDescriptionInput.click();
    await this.loincDescriptionInput.fill(description);
    await this.page.getByRole('button', { name: 'Add LOINC Code' }).last().click();
    await this.page.waitForTimeout(2000);
  }

  // ===== Common =====

  async searchCode(term) {
    await this.searchInput.click();
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async clearSearch() {
    await this.searchInput.fill('');
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async toggleRowCheckbox() {
    await this.page.getByRole('checkbox').uncheck();
  }

  async getToastText() {
    try {
      await this.toastMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.toastMessage.textContent();
    } catch {
      return null;
    }
  }

  async isTextVisible(text) {
    return await this.page.getByText(text).isVisible().catch(() => false);
  }

  async isGridCellVisible(text) {
    return await this.page.getByRole('gridcell', { name: text }).isVisible().catch(() => false);
  }

  async logout() {
    await this.userMenuTrigger.click();
    await this.logoutMenuItem.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }
}

module.exports = { MasterCodePage };
