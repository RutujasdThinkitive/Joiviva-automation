// @ts-check
const { test, expect } = require('@playwright/test');
const { RolesPermissionPage } = require('../../pages/RolesPermissionPage');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Generate a unique role name to avoid collisions across test runs */
const uniqueRoleName = (base) => `${base} ${Date.now().toString(36).slice(-4)}`;

// ─── TEST SUITE ──────────────────────────────────────────────────────────────

test.describe('Roles & Permissions Module', () => {
  /** @type {RolesPermissionPage} */
  let rolesPage;

  test.beforeEach(async ({ page }) => {
    rolesPage = new RolesPermissionPage(page);

    // Login as admin via Keycloak
    await rolesPage.loginAsAdmin();

    // Navigate to Roles & Responsibility
    await rolesPage.navigateToRoles();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE CREATION (TC-RP-001 to TC-RP-013)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Role Creation', () => {

    // TC-RP-001: Create new role with Provider role type
    test('TC-RP-001: should create new role with Provider role type', async ({ page }) => {
      const roleName = uniqueRoleName('Provider Nurse');
      await rolesPage.createRole('Provider', roleName);

      // Verify success toast
      await expect(page.getByText('Role created successfully')).toBeVisible({ timeout: 10000 });

      // Wait for UI to stabilize before checking dropdown
      await page.waitForTimeout(2000);

      // Verify role appears in dropdown
      await rolesPage.selectRoleType('Provider');
      await page.waitForTimeout(1000);
      const exists = await rolesPage.isRoleNameInDropdown(roleName);
      expect(exists).toBeTruthy();
    });

    // TC-RP-002: Create new role with Admin role type
    test('TC-RP-002: should create new role with Admin role type', async ({ page }) => {
      const roleName = uniqueRoleName('Admin Manager');
      await rolesPage.createRole('Admin', roleName);

      const success = await rolesPage.waitForToast('Role created successfully');
      expect(success).toBeTruthy();
    });

    // TC-RP-003: Create new role with Biller role type
    test('TC-RP-003: should create new role with Biller role type', async ({ page }) => {
      const roleName = uniqueRoleName('Billing Clerk');
      await rolesPage.createRole('Biller', roleName);

      const success = await rolesPage.waitForToast('Role created successfully');
      expect(success).toBeTruthy();
    });

    // TC-RP-004: Create multiple roles under same role type
    test('TC-RP-004: should create multiple roles under same role type', async ({ page }) => {
      const roles = [
        uniqueRoleName('Provider Nurse'),
        uniqueRoleName('Provider Receptionist'),
        uniqueRoleName('Provider Intern'),
      ];

      for (const roleName of roles) {
        await rolesPage.createRole('Provider', roleName);
        await rolesPage.waitForToast('Role created successfully');
        await page.waitForTimeout(1000);
      }

      // Verify all three roles in dropdown
      await rolesPage.selectRoleType('Provider');
      for (const roleName of roles) {
        const exists = await rolesPage.isRoleNameInDropdown(roleName);
        expect(exists, `Role "${roleName}" should appear in dropdown`).toBeTruthy();
      }
    });

    // TC-RP-005: Create role with empty/blank role name
    test('TC-RP-005: should show validation error for empty role name', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Provider');
      // Leave role name blank — Create button should be disabled
      const isDisabled = await rolesPage.isDrawerCreateDisabled();
      expect(isDisabled).toBeTruthy();
    });

    // TC-RP-006: Create duplicate role name under same role type
    test('TC-RP-006: should show error for duplicate role name under same type', async ({ page }) => {
      const roleName = uniqueRoleName('Dup Role');

      // Create first role
      await rolesPage.createRole('Provider', roleName);
      await expect(page.getByText('Role created successfully')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(2000);

      // Try to create duplicate
      await rolesPage.createRole('Provider', roleName);
      await page.waitForTimeout(3000);

      // Expect error — check for any error toast/snackbar or that the drawer is still open
      const snackbar = await rolesPage.getSnackbarMessage(8000);
      const hasError = snackbar !== null;
      const drawerStillOpen = await rolesPage.drawerCreateButton.isVisible().catch(() => false);
      expect(hasError || drawerStillOpen, 'Should show error or keep drawer open for duplicate role').toBeTruthy();
    });

    // TC-RP-007: Create role without selecting role type
    test('TC-RP-007: should disable Create when role type not selected', async ({ page }) => {
      await rolesPage.clickNewRole();
      // Only fill role name, skip role type
      await rolesPage.fillDrawerRoleName('Test Role');

      // Create button should be disabled
      const isDisabled = await rolesPage.isDrawerCreateDisabled();
      expect(isDisabled).toBeTruthy();
    });

    // TC-RP-008: Create role with special characters only
    test('TC-RP-008: should reject special characters in role name', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Admin');
      await rolesPage.fillDrawerRoleName('@#$%^&*!');
      await page.waitForTimeout(500);

      // Validation: "must start with a letter and contain only letters and spaces"
      const error = await rolesPage.getDrawerValidationError();
      if (error) {
        expect(error.toLowerCase()).toMatch(/letter|invalid|special/i);
      }
      expect(await rolesPage.isDrawerCreateDisabled()).toBeTruthy();
    });

    // TC-RP-009: Create role name exceeding max characters
    test('TC-RP-009: should validate role name max length of 50 characters', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Biller');
      const longName = 'A'.repeat(51) + ' Role';
      await rolesPage.fillDrawerRoleName(longName);
      await page.waitForTimeout(500);

      const error = await rolesPage.getDrawerValidationError();
      if (error) {
        expect(error.toLowerCase()).toMatch(/exceed|max|50|characters/i);
      }
      expect(await rolesPage.isDrawerCreateDisabled()).toBeTruthy();
    });

    // TC-RP-010: Same role name under different role types
    test('TC-RP-010: should allow same role name under different role types', async ({ page }) => {
      const baseName = uniqueRoleName('Manager');

      for (const type of ['Provider', 'Admin', 'Biller']) {
        await rolesPage.createRole(type, baseName);
        const success = await rolesPage.waitForToast('Role created successfully');
        expect(success, `Should create "${baseName}" under ${type}`).toBeTruthy();
        await page.waitForTimeout(1500);
      }
    });

    // TC-RP-011: Role name with leading/trailing spaces
    test('TC-RP-011: should trim whitespace from role name', async ({ page }) => {
      const coreName = uniqueRoleName('Trimmed Role');
      await rolesPage.createRole('Provider', `  ${coreName}  `);
      const success = await rolesPage.waitForToast('Role created successfully');
      expect(success).toBeTruthy();

      // Verify saved name is trimmed
      await rolesPage.selectRoleType('Provider');
      const exists = await rolesPage.isRoleNameInDropdown(coreName);
      expect(exists).toBeTruthy();
    });

    // TC-RP-012: Role name with only whitespace
    test('TC-RP-012: should reject role name with only whitespace', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Provider');
      await rolesPage.fillDrawerRoleName('   ');
      await page.waitForTimeout(500);

      expect(await rolesPage.isDrawerCreateDisabled()).toBeTruthy();
    });

    // TC-RP-013: No Delete option for roles (per permission doc)
    test('TC-RP-013: should not show Delete button for roles', async ({ page }) => {
      await rolesPage.selectRoleType('Provider');
      await page.waitForTimeout(1000);

      const deleteBtn = page.getByRole('button', { name: /delete/i });
      const deleteVisible = await deleteBtn.isVisible().catch(() => false);
      expect(deleteVisible).toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE SELECTION (TC-RP-014 to TC-RP-017)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Role Selection', () => {

    // TC-RP-014: Switch between role types — feature list loads correctly
    test('TC-RP-014: should load correct features when switching role types', async ({ page }) => {
      // Select Provider type and get roles
      await rolesPage.selectRoleType('Provider');
      const providerOptions = await rolesPage.getRoleNameOptions();
      expect(providerOptions.length).toBeGreaterThan(0);

      // Select first Provider role → features load
      await rolesPage.selectRoleType('Provider');
      await rolesPage.selectRoleName(providerOptions[0].trim());
      const providerFeatures = await rolesPage.getFeatureCount();
      expect(providerFeatures).toBeGreaterThan(0);

      // Switch to Admin type — roles should refresh
      await rolesPage.selectRoleType('Admin');
      const adminOptions = await rolesPage.getRoleNameOptions();
      expect(adminOptions.length).toBeGreaterThan(0);
    });

    // TC-RP-015: Switch between roles within same role type
    test('TC-RP-015: should refresh permissions when switching roles', async ({ page }) => {
      await rolesPage.selectRoleType('Provider');
      const options = await rolesPage.getRoleNameOptions();

      if (options.length >= 2) {
        await rolesPage.selectRoleType('Provider');
        await rolesPage.selectRoleName(options[0].trim());
        const features1 = await rolesPage.getFeatureNames();

        // Re-select role type to reset dropdown, then pick second role
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        await rolesPage.navigateToRoles();
        await rolesPage.selectRoleType('Provider');
        await rolesPage.selectRoleName(options[1].trim());
        const features2 = await rolesPage.getFeatureNames();

        expect(features1.length).toBeGreaterThan(0);
        expect(features2.length).toBeGreaterThan(0);
      }
    });

    // TC-RP-016: Admin role type shows correct Admin portal feature list
    test('TC-RP-016: should show Admin portal features for Admin role type', async ({ page }) => {
      await rolesPage.selectRoleType('Admin');
      const options = await rolesPage.getRoleNameOptions();
      if (options.length === 0) return;

      await rolesPage.selectRoleType('Admin');
      await rolesPage.selectRoleName(options[0].trim());

      const features = await rolesPage.getFeatureNames();
      expect(features.length).toBeGreaterThan(0);

      const featureText = features.join(' ').toLowerCase();
      const adminFeatures = ['dashboard', 'clinic', 'master', 'admin', 'role', 'audit'];
      const foundSome = adminFeatures.some(f => featureText.includes(f));
      expect(foundSome).toBeTruthy();
    });

    // TC-RP-017: Biller role type shows billing-focused features
    test('TC-RP-017: should show billing-focused features for Biller role type', async ({ page }) => {
      await rolesPage.selectRoleType('Biller');
      const options = await rolesPage.getRoleNameOptions();
      if (options.length === 0) return;

      await rolesPage.selectRoleType('Biller');
      await rolesPage.selectRoleName(options[0].trim());

      const features = await rolesPage.getFeatureNames();
      expect(features.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSION MANAGEMENT (TC-RP-018 to TC-RP-039)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Permission Management', () => {

    /**
     * Helper: Select a Provider role and enter edit mode.
     * Returns the selected role name.
     */
    async function enterEditMode(page, rolesPage) {
      await rolesPage.selectRoleType('Provider');
      const options = await rolesPage.getRoleNameOptions();
      expect(options.length).toBeGreaterThan(0);

      await rolesPage.selectRoleType('Provider');
      const roleName = options[0].trim();
      await rolesPage.selectRoleName(roleName);
      await rolesPage.clickEditPermissions();
      return roleName;
    }

    // TC-RP-018: Assign ALL permissions using 'All' checkbox
    test('TC-RP-018: should assign all permissions when All checkbox is checked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      expect(features.length).toBeGreaterThan(0);
      const featureName = features[0].trim();

      // Check 'All' for first feature
      await rolesPage.setPermission(featureName, 'all', true);

      // Verify all individual permissions are auto-checked
      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeTruthy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-019: Assign View-only permission
    test('TC-RP-019: should assign View-only permission', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'view', true);

      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeFalsy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-020: Assign View + Create permissions
    test('TC-RP-020: should assign View + Create permissions only', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'view', true);
      await rolesPage.setPermission(featureName, 'create', true);

      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeTruthy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-021: Remove a specific permission
    test('TC-RP-021: should remove Delete permission while keeping others', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Enable all first
      await rolesPage.setPermission(featureName, 'all', true);
      // Uncheck Delete
      await rolesPage.setPermission(featureName, 'delete', false);

      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeFalsy();
      // 'All' should auto-uncheck
      expect(await rolesPage.isPermissionChecked(featureName, 'all')).toBeFalsy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-022: Uncheck 'All' removes all permissions
    test('TC-RP-022: should remove all permissions when All is unchecked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Enable all, then uncheck All
      await rolesPage.setPermission(featureName, 'all', true);
      await rolesPage.setPermission(featureName, 'all', false);

      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeFalsy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-023: Set View + Delete independently
    test('TC-RP-023: should set View + Delete permission independently', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'view', true);
      await rolesPage.setPermission(featureName, 'delete', true);

      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeFalsy();

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-024: Edit multiple features with different permission combos
    test('TC-RP-024: should edit multiple features independently', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      if (features.length >= 4) {
        // Feature 1: View + Delete only
        await rolesPage.setPermission(features[0].trim(), 'all', false);
        await rolesPage.setPermission(features[0].trim(), 'view', true);
        await rolesPage.setPermission(features[0].trim(), 'delete', true);

        // Feature 2: View only
        await rolesPage.setPermission(features[1].trim(), 'all', false);
        await rolesPage.setPermission(features[1].trim(), 'view', true);

        // Feature 3: All permissions
        await rolesPage.setPermission(features[2].trim(), 'all', true);

        // Feature 4: View + Create
        await rolesPage.setPermission(features[3].trim(), 'all', false);
        await rolesPage.setPermission(features[3].trim(), 'view', true);
        await rolesPage.setPermission(features[3].trim(), 'create', true);

        await rolesPage.clickSaveChanges();
        await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
      }
    });

    // TC-RP-027: Permissions persist after page refresh
    test('TC-RP-027: should persist permissions after page refresh', async ({ page }) => {
      await rolesPage.selectRoleType('Provider');
      const options = await rolesPage.getRoleNameOptions();
      if (options.length === 0) return;

      const selectedRole = options[0].trim();
      await rolesPage.selectRoleType('Provider');
      await rolesPage.selectRoleName(selectedRole);

      // Enter edit mode and set specific permissions
      await rolesPage.clickEditPermissions();
      const features = await rolesPage.getFeatureNames();
      if (features.length === 0) return;

      const featureName = features[0].trim();
      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'view', true);
      await rolesPage.setPermission(featureName, 'create', true);

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      // Re-navigate and re-select the role
      await rolesPage.navigateToRoles();
      await rolesPage.selectRoleType('Provider');
      await rolesPage.selectRoleName(selectedRole);

      // Verify permissions persisted (check icons in view mode)
      const viewEnabled = await rolesPage.isPermissionEnabled(featureName, 'view');
      expect(viewEnabled).toBeTruthy();
    });

    // TC-RP-028: Save permissions with no changes
    test('TC-RP-028: should handle save with no changes gracefully', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      // Click Save without making changes
      await rolesPage.clickSaveChanges();
      await page.waitForTimeout(2000);

      // Should exit edit mode
      const inEditMode = await rolesPage.isInEditMode();
      expect(inEditMode).toBeFalsy();
    });

    // TC-RP-029: Edit Permissions disabled when no role selected
    test('TC-RP-029: should disable Edit Permissions when no role selected', async ({ page }) => {
      const isEnabled = await rolesPage.isEditPermissionsEnabled();
      expect(isEnabled).toBeFalsy();
    });

    // TC-RP-030: 'All' checkbox auto-select/deselect behavior
    test('TC-RP-030: should auto-toggle All checkbox bidirectionally', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Check "All" → all auto-checked
      await rolesPage.setPermission(featureName, 'all', true);
      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeTruthy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeTruthy();

      // Uncheck Delete → "All" auto-unchecks
      await rolesPage.setPermission(featureName, 'delete', false);
      expect(await rolesPage.isPermissionChecked(featureName, 'all')).toBeFalsy();

      // Re-check Delete → "All" auto-checks
      await rolesPage.setPermission(featureName, 'delete', true);
      expect(await rolesPage.isPermissionChecked(featureName, 'all')).toBeTruthy();

      await rolesPage.clickCancel();
    });

    // TC-RP-031: Create auto-enables View
    test('TC-RP-031: should auto-enable View when Create is checked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Uncheck all
      await rolesPage.setPermission(featureName, 'all', false);

      // Check only Create → View should auto-enable
      await rolesPage.setPermission(featureName, 'create', true);
      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();

      await rolesPage.clickCancel();
    });

    // TC-RP-032: Update auto-enables View
    test('TC-RP-032: should auto-enable View when Update is checked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'update', true);
      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();

      await rolesPage.clickCancel();
    });

    // TC-RP-033: Delete auto-enables View
    test('TC-RP-033: should auto-enable View when Delete is checked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      await rolesPage.setPermission(featureName, 'all', false);
      await rolesPage.setPermission(featureName, 'delete', true);
      expect(await rolesPage.isPermissionChecked(featureName, 'view')).toBeTruthy();

      await rolesPage.clickCancel();
    });

    // TC-RP-034: Unchecking View auto-unchecks Create/Update/Delete
    test('TC-RP-034: should auto-uncheck Create/Update/Delete when View is unchecked', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Enable all
      await rolesPage.setPermission(featureName, 'all', true);
      // Uncheck View
      await rolesPage.setPermission(featureName, 'view', false);

      expect(await rolesPage.isPermissionChecked(featureName, 'create')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'update')).toBeFalsy();
      expect(await rolesPage.isPermissionChecked(featureName, 'delete')).toBeFalsy();

      await rolesPage.clickCancel();
    });

    // TC-RP-036: Select All button checks all features
    test('TC-RP-036: should check all permissions on all features with Select All', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      await rolesPage.clickSelectAll();

      // Verify first 3 features have all checked
      const features = await rolesPage.getFeatureNames();
      for (const feature of features.slice(0, 3)) {
        const trimmed = feature.trim();
        if (!trimmed) continue;
        expect(await rolesPage.isPermissionChecked(trimmed, 'all')).toBeTruthy();
      }

      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-037: Cancel editing discards changes
    test('TC-RP-037: should discard changes on Cancel', async ({ page }) => {
      await enterEditMode(page, rolesPage);

      const features = await rolesPage.getFeatureNames();
      const featureName = features[0].trim();

      // Make a change
      await rolesPage.setPermission(featureName, 'all', true);

      // Cancel
      await rolesPage.clickCancel();

      // Should exit edit mode
      const inEditMode = await rolesPage.isInEditMode();
      expect(inEditMode).toBeFalsy();
    });

    // TC-RP-025: Edit Admin role permissions
    test('TC-RP-025: should edit Admin role permissions', async ({ page }) => {
      await rolesPage.selectRoleType('Admin');
      const options = await rolesPage.getRoleNameOptions();
      if (options.length === 0) return;

      await rolesPage.selectRoleType('Admin');
      await rolesPage.selectRoleName(options[0].trim());
      await rolesPage.clickEditPermissions();

      const features = await rolesPage.getFeatureNames();
      expect(features.length).toBeGreaterThan(0);

      await rolesPage.setPermission(features[0].trim(), 'all', true);
      await rolesPage.clickSaveChanges();
      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
    });

    // TC-RP-026: Edit Biller role permissions
    test('TC-RP-026: should edit Biller role permissions', async ({ page }) => {
      await rolesPage.selectRoleType('Biller');
      const options = await rolesPage.getRoleNameOptions();
      if (options.length === 0) return;

      await rolesPage.selectRoleType('Biller');
      await rolesPage.selectRoleName(options[0].trim());
      await rolesPage.clickEditPermissions();

      const features = await rolesPage.getFeatureNames();
      if (features.length > 0) {
        await rolesPage.setPermission(features[0].trim(), 'all', false);
        await rolesPage.setPermission(features[0].trim(), 'view', true);

        await rolesPage.clickSaveChanges();
        await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY - INPUT VALIDATION (TC-RP-104, TC-RP-105)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Security - Role Name Input Validation', () => {

    // TC-RP-104: XSS injection in role name field
    test('TC-RP-104: should reject XSS in role name', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Provider');
      await rolesPage.fillDrawerRoleName('<script>alert(1)</script>');
      await page.waitForTimeout(500);

      // Validation rejects (only letters and spaces allowed)
      expect(await rolesPage.isDrawerCreateDisabled()).toBeTruthy();
    });

    // TC-RP-105: SQL injection in role name field
    test('TC-RP-105: should reject SQL injection in role name', async ({ page }) => {
      await rolesPage.clickNewRole();
      await rolesPage.selectDrawerRoleType('Admin');
      await rolesPage.fillDrawerRoleName("'; DROP TABLE roles; --");
      await page.waitForTimeout(500);

      expect(await rolesPage.isDrawerCreateDisabled()).toBeTruthy();
    });
  });
});
