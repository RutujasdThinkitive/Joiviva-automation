const { BasePage } = require('./BasePage');

/**
 * RolesPermissionPage - Page Object for Admin Portal → Roles & Responsibility module.
 * Selectors aligned with the actual Joiviva Keycloak + MUI-based portal UI.
 */
class RolesPermissionPage extends BasePage {
  constructor(page) {
    super(page);

    // ─── NAVIGATION ──────────────────────────────────────────────────────────
    this.rolesNavLink = page.getByRole('link', { name: /shield-plain icon Roles/i });

    // ─── ACTION BUTTONS (non-edit mode) ──────────────────────────────────────
    this.newRoleButton = page.getByRole('button', { name: 'New Role' });
    this.editPermissionsButton = page.getByRole('button', { name: 'edit Edit Permissions' });

    // ─── ACTION BUTTONS (edit mode) ──────────────────────────────────────────
    this.selectAllButton = page.getByRole('button', { name: 'Select All' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });

    // ─── CREATE ROLE DRAWER ──────────────────────────────────────────────────
    this.drawerRoleTypeCombobox = page.getByRole('combobox', { name: 'Select role type' });
    this.drawerRoleNameInput = page.getByRole('textbox', { name: 'Enter role name' });
    this.drawerCreateButton = page.getByRole('button', { name: 'Create' });
    this.drawerCancelButton = page.locator('.MuiDrawer-root').getByRole('button', { name: 'Cancel' });

    // ─── PERMISSIONS TABLE ───────────────────────────────────────────────────
    this.permissionsTable = page.locator('[class*="DataGrid"], [role="grid"], table').first();
    this.noDataMessage = page.getByText(/select a role|no permissions found/i);

    // ─── SNACKBAR / TOAST ────────────────────────────────────────────────────
    this.snackbarMessage = page.locator('.MuiSnackbar-root, [class*="Snackbar"], [role="alert"]').first();

    // ─── VALIDATION ERRORS (inside drawer) ───────────────────────────────────
    this.drawerValidationError = page.locator('.MuiDrawer-root .MuiFormHelperText-root, .MuiDrawer-root .Mui-error').first();
  }

  // ─── LOGIN (inline, matching the working test pattern) ─────────────────────

  /**
   * Login as admin using the direct Keycloak auth URL
   */
  async loginAsAdmin() {
    const authUrl = 'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth';
    const baseUrl = process.env.BASE_URL || 'https://portal.qa.joiviva.org';
    const username = process.env.ADMIN_USERNAME || 'olivia';
    const password = process.env.ADMIN_PASSWORD || 'Pass@123';

    await this.page.goto(`${authUrl}?client_id=public-client&redirect_uri=${encodeURIComponent(baseUrl + '/')}&response_mode=fragment&response_type=code&scope=openid`);
    await this.page.getByRole('textbox', { name: 'Username' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await this.page.waitForURL(`${baseUrl}/**`, { timeout: 30000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  // ─── NAVIGATION ────────────────────────────────────────────────────────────

  /** Navigate to the Roles & Responsibility page */
  async navigateToRoles() {
    await this.rolesNavLink.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  // ─── FILTER ACTIONS (using exact working selectors) ────────────────────────

  /**
   * Select a role type from the filter dropdown
   * @param {string} roleType - e.g., 'Provider', 'Admin', 'Biller'
   */
  async selectRoleType(roleType) {
    await this.page.getByRole('combobox').filter({ hasText: 'Select Role Type' }).click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: roleType }).click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select a role name from the filter dropdown
   * @param {string} roleName
   */
  async selectRoleName(roleName) {
    await this.page.getByText('Select Role Name').click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(roleName, { exact: true }).click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select role type and role name together
   * @param {string} roleType
   * @param {string} roleName
   */
  async selectRole(roleType, roleName) {
    await this.selectRoleType(roleType);
    await this.selectRoleName(roleName);
  }

  // ─── CREATE ROLE ───────────────────────────────────────────────────────────

  /** Open the New Role drawer */
  async clickNewRole() {
    await this.newRoleButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select role type inside the Create Role drawer
   * @param {string} roleType - e.g., 'Provider', 'Admin', 'Biller'
   */
  async selectDrawerRoleType(roleType) {
    await this.drawerRoleTypeCombobox.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole('option', { name: roleType }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the role name in the Create Role drawer
   * @param {string} roleName
   */
  async fillDrawerRoleName(roleName) {
    await this.drawerRoleNameInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.drawerRoleNameInput.clear();
    await this.drawerRoleNameInput.fill(roleName);
  }

  /** Click the Create button in the drawer */
  async clickDrawerCreate() {
    await this.drawerCreateButton.click();
    await this.page.waitForTimeout(2000);
  }

  /** Click Cancel in the drawer */
  async clickDrawerCancel() {
    await this.drawerCancelButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Full flow: create a new role
   * @param {string} roleType
   * @param {string} roleName
   */
  async createRole(roleType, roleName) {
    await this.clickNewRole();
    await this.selectDrawerRoleType(roleType);
    await this.fillDrawerRoleName(roleName);
    await this.clickDrawerCreate();
  }

  /**
   * Check if the Create button in the drawer is disabled
   * @returns {Promise<boolean>}
   */
  async isDrawerCreateDisabled() {
    return await this.drawerCreateButton.isDisabled();
  }

  /**
   * Get validation error text from the drawer
   * @returns {Promise<string|null>}
   */
  async getDrawerValidationError() {
    try {
      await this.drawerValidationError.waitFor({ state: 'visible', timeout: 3000 });
      return await this.drawerValidationError.textContent();
    } catch {
      return null;
    }
  }

  // ─── EDIT PERMISSIONS ──────────────────────────────────────────────────────

  /** Click Edit Permissions button */
  async clickEditPermissions() {
    await this.editPermissionsButton.click();
    await this.page.waitForTimeout(1000);
  }

  /** Click Save Changes button */
  async clickSaveChanges() {
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /** Click Cancel button in edit mode */
  async clickCancel() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(500);
  }

  /** Click Select All button */
  async clickSelectAll() {
    await this.selectAllButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if we are in edit mode
   * @returns {Promise<boolean>}
   */
  async isInEditMode() {
    return await this.saveChangesButton.isVisible().catch(() => false);
  }

  // ─── PERMISSION CHECKBOXES ─────────────────────────────────────────────────

  /**
   * Get a specific feature row by name
   * @param {string} featureName
   * @returns {import('@playwright/test').Locator}
   */
  getFeatureRow(featureName) {
    return this.page.locator(`[role="row"]:has-text("${featureName}")`);
  }

  /**
   * Get the checkbox for a specific permission on a feature row.
   * Column indices in MUI DataGrid: 0=Features, 1=All, 2=View, 3=Create, 4=Update, 5=Delete
   * @param {string} featureName
   * @param {'all'|'view'|'create'|'update'|'delete'} permission
   * @returns {import('@playwright/test').Locator}
   */
  getPermissionCheckbox(featureName, permission) {
    const colIndex = { all: 1, view: 2, create: 3, update: 4, delete: 5 };
    const row = this.getFeatureRow(featureName);
    const cell = row.locator('[role="gridcell"]').nth(colIndex[permission]);
    return cell.locator('input[type="checkbox"]');
  }

  /**
   * Get the permission icon (check or close) for a feature in view mode
   * @param {string} featureName
   * @param {'all'|'view'|'create'|'update'|'delete'} permission
   * @returns {{ check: import('@playwright/test').Locator, close: import('@playwright/test').Locator }}
   */
  getPermissionIcon(featureName, permission) {
    const colIndex = { all: 1, view: 2, create: 3, update: 4, delete: 5 };
    const row = this.getFeatureRow(featureName);
    const cell = row.locator('[role="gridcell"]').nth(colIndex[permission]);
    return {
      check: cell.locator('svg[data-testid="CheckOutlinedIcon"]'),
      close: cell.locator('svg[data-testid="CloseOutlinedIcon"]'),
    };
  }

  /**
   * Set a specific permission checkbox
   * @param {string} featureName
   * @param {'all'|'view'|'create'|'update'|'delete'} permission
   * @param {boolean} checked
   */
  async setPermission(featureName, permission, checked) {
    const checkbox = this.getPermissionCheckbox(featureName, permission);
    const isChecked = await checkbox.isChecked();
    if (isChecked !== checked) {
      await checkbox.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Check if a permission checkbox is checked
   * @param {string} featureName
   * @param {'all'|'view'|'create'|'update'|'delete'} permission
   * @returns {Promise<boolean>}
   */
  async isPermissionChecked(featureName, permission) {
    const checkbox = this.getPermissionCheckbox(featureName, permission);
    return await checkbox.isChecked();
  }

  /**
   * Check if a permission has a green check icon (view mode)
   * @param {string} featureName
   * @param {'all'|'view'|'create'|'update'|'delete'} permission
   * @returns {Promise<boolean>}
   */
  async isPermissionEnabled(featureName, permission) {
    const icons = this.getPermissionIcon(featureName, permission);
    return await icons.check.isVisible().catch(() => false);
  }

  /**
   * Get all feature names from the permissions table
   * @returns {Promise<string[]>}
   */
  async getFeatureNames() {
    await this.page.waitForTimeout(500);
    const cells = this.page.locator('[role="row"] [role="gridcell"]:first-child');
    const texts = await cells.allTextContents();
    return texts.filter(t => t.trim() !== '');
  }

  /**
   * Get the count of feature rows in the table
   * @returns {Promise<number>}
   */
  async getFeatureCount() {
    const features = await this.getFeatureNames();
    return features.length;
  }

  // ─── ROLE NAME DROPDOWN OPTIONS ────────────────────────────────────────────

  /**
   * Get all available role names in the dropdown
   * @returns {Promise<string[]>}
   */
  async getRoleNameOptions() {
    await this.page.getByText('Select Role Name').click();
    await this.page.waitForTimeout(500);
    const options = this.page.getByRole('option');
    const texts = await options.allTextContents();
    await this.page.keyboard.press('Escape');
    return texts;
  }

  /**
   * Check if a role name exists in the dropdown
   * @param {string} roleName
   * @returns {Promise<boolean>}
   */
  async isRoleNameInDropdown(roleName) {
    const options = await this.getRoleNameOptions();
    return options.some(opt => opt.trim() === roleName.trim());
  }

  // ─── TOAST / SNACKBAR HELPERS ──────────────────────────────────────────────

  /**
   * Get snackbar/toast message text
   * @param {number} timeout
   * @returns {Promise<string|null>}
   */
  async getSnackbarMessage(timeout = 5000) {
    try {
      await this.snackbarMessage.waitFor({ state: 'visible', timeout });
      return await this.snackbarMessage.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Wait for a toast with specific text to appear
   * @param {string} text - text to look for
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async waitForToast(text, timeout = 10000) {
    try {
      await this.page.getByText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ─── TABLE STATE ───────────────────────────────────────────────────────────

  /**
   * Check if the permissions table is visible
   * @returns {Promise<boolean>}
   */
  async isTableVisible() {
    return await this.permissionsTable.isVisible().catch(() => false);
  }

  /**
   * Check if Edit Permissions button is enabled
   * @returns {Promise<boolean>}
   */
  async isEditPermissionsEnabled() {
    return !(await this.editPermissionsButton.isDisabled());
  }
}

module.exports = { RolesPermissionPage };
