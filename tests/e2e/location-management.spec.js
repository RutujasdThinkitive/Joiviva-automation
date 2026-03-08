import { test, expect } from '@playwright/test';

test('Clinic Groups - Full Workflow Test', async ({ page }) => {

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto(
    'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth' +
    '?client_id=public-client' +
    '&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F' +
    '&state=d7d761d5-61ad-40fc-925f-4238cb4e642c' +
    '&response_mode=fragment&response_type=code&scope=openid' +
    '&nonce=7704bdcf-2b7e-443d-a17c-5d754d25695f' +
    '&code_challenge=jRJ9yOjNMAXDcT3Z7jcKs43LVcGNrMmP18XrQGbGUjo' +
    '&code_challenge_method=S256'
  );

  await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Username' }).fill('olivia');
  await page.getByRole('textbox', { name: 'Password' }).fill('Pass@123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to portal after login
  await page.waitForURL('**/portal.qa.joiviva.org/**', { timeout: 15000 });

  // ─── NAVIGATE TO DASHBOARD ───────────────────────────────────────────────────
  await page.goto('https://portal.qa.joiviva.org/admin/dashboard');
  await expect(page).toHaveURL(/dashboard/);

//   // ─── NAVIGATE TO CLINIC GROUPS ───────────────────────────────────────────────
  await page.getByRole('link', { name: 'hospital icon Clinic Groups' }).click();
//   await expect(page.getByText('Metro Hospital')).toBeVisible();

//   // Select Metro Hospital (2nd occurrence = row item)
//   await page.getByText('Metro Hospital').nth(1).click();

//   // ─── USERS TAB ───────────────────────────────────────────────────────────────
//   await page.getByRole('tab', { name: 'Users' }).click();
//   await expect(page.getByRole('tab', { name: 'Users' })).toHaveAttribute('aria-selected', 'true');

  // Search and select clinic group
await page.getByRole('textbox', { name: 'Search by clinic name or' }).fill('Appolosh');
  await page.waitForTimeout(2000);
 // await page.waitForTimeout(1000);
  await expect(page.getByText('Appolosh')).toBeVisible();
  await page.getByText('Appolosh').click();

  // Return to Users tab
  await page.getByRole('tab', { name: 'Users' }).click();

  // ─── LOCATIONS TAB ───────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Locations' }).click();
  await expect(page.getByText('Alaska', { exact: true })).toBeVisible();
  await page.getByText('Alaska', { exact: true }).click();

  // ─── DEPARTMENTS TAB ─────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Departments' }).click();
  await expect(page.getByRole('button', { name: 'New Department' })).toBeVisible();
  await page.getByRole('button', { name: 'New Department' }).click();

  // Fill department form
  await expect(page.getByRole('textbox', { name: 'Enter Departments Name' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Departments Name' }).fill('cordio new');
  await page.getByRole('combobox', { name: 'Select Department Admin' }).click();
  await page.getByRole('option', { name: 'Pankaj chaudhari' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Number' }).fill('9999999999');
  await page.getByRole('button', { name: 'Save' }).click();
//await page.getByRole('textbox', { name: 'Search by clinic name or' }).fill(clinicName);
  await page.waitForTimeout(2000);
  // Search for created department
  await page.getByRole('textbox', { name: 'Search here' }).fill('cordio new');
  await expect(page.getByRole('checkbox')).toBeVisible();

  // Toggle status
  await page.getByRole('checkbox').check();
  await expect(page.getByText('Status updated successfully')).toBeVisible();

  // Archive department
  await page.getByTestId('MoreVertIcon').locator('path').click();
  await page.getByRole('button', { name: 'Archive Department' }).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Department deleted')).toBeVisible();

  // ─── MODIFIERS TAB ───────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Modifiers' }).click();
  await expect(page.getByRole('button', { name: 'Add New Modifier' })).toBeVisible();
  await page.getByRole('button', { name: 'Add New Modifier' }).click();

  // Fill modifier form
  await expect(page.getByRole('textbox', { name: 'Enter Modifier Code' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Modifier Code' }).fill('s3');
  await page.getByRole('combobox', { name: 'Select Type' }).click();
  await page.getByRole('option', { name: 'M1' }).click();
  await page.locator('.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.css-j5005a > div > .MuiInputBase-root').click();
  await page.getByRole('textbox', { name: 'Enter Description' }).fill('this is new modifier');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify modifier row exists then edit
  await expect(page.getByRole('row', { name: 's3 this is new modifier M1' })).toBeVisible();
  await page.getByRole('row', { name: 's3 this is new modifier M1' }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  // Update modifier description
  await page.getByRole('textbox', { name: 'Enter Description' }).fill('this is new modifier updated');
  await page.getByRole('button', { name: 'Save' }).click();

  // Delete modifier
  await expect(page.getByRole('row', { name: /s3 this is new modifier/ })).toBeVisible();
  await page.getByRole('row', { name: /s3 this is new modifier/ }).getByRole('button').click();
  await page.getByText('Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Modifier deleted successfully')).toBeVisible();

  // ─── FEE SCHEDULE TAB ────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Fee Schedule' }).click();
  await expect(page.getByRole('button', { name: 'Add New Fee Schedule' })).toBeVisible();
  await page.getByRole('button', { name: 'Add New Fee Schedule' }).click();

  // Fill fee schedule form
  await page.getByRole('combobox', { name: 'Select Procedure Code' }).click();
  await page.getByRole('option', { name: '- 765878' }).click();
  await page.getByRole('textbox', { name: 'Enter Description' }).fill('new fee schedule');

  // Select providers
  await page.getByRole('combobox', { name: 'Select Provider(s)' }).click();
  await page.getByText('alex pathab').click();
  await page.getByText('Ayush Dumbre').click();

  // Select payers
  await page.getByRole('combobox', { name: 'Select Payer(s)' }).click();
  await page.getByText('vgjhbvgjhbvgjhbvgjhbvgjhbvgjhb').click();
  await page.getByRole('option', { name: 'ftghj7\\' }).click();
  await page.locator('div').filter({ hasText: /^Payer\*$/ }).click();

  // Select modifier
  await page.getByRole('combobox', { name: 'M 1' }).click();
  await page.getByRole('option', { name: '26' }).click();

  // Enter amount
  await page.getByRole('textbox', { name: 'Enter Amount' }).fill('30');

  // Select start date
  await page.getByRole('button', { name: 'Choose date' }).first().click();
  await page.getByRole('gridcell', { name: '1', exact: true }).click();

  // Select end date
  await page.getByRole('button', { name: 'Choose date', exact: true }).click();
  await page.getByRole('gridcell', { name: '31' }).click();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Fee schedule created')).toBeVisible();

  // Search fee schedule
  await page.getByRole('textbox', { name: 'Search by code' }).fill('new');
  await expect(page.getByRole('row', { name: 'Ayush Dumbre, alex pathab' })).toBeVisible();

  // Deactivate fee schedule
  await page.getByRole('row', { name: 'Ayush Dumbre, alex pathab' }).getByRole('checkbox').uncheck();
  await expect(page.getByText('User status updated')).toBeVisible();

  // Edit fee schedule
  await page.getByRole('row', { name: 'Ayush Dumbre, alex pathab' }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('checkbox', { name: 'Applies to All Payers' }).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Fee schedule updated')).toBeVisible();

  // Delete fee schedule
  await page.getByRole('row', { name: 'Ayush Dumbre, alex pathab' }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Fee schedule deleted')).toBeVisible();

  // ─── SUBSCRIPTION TAB ────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Subscription' }).click();
  await expect(page.getByRole('button', { name: 'Create Plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Create Plan' }).click();

  // Fill subscription plan form
  await expect(page.locator('.MuiInputBase-root').first()).toBeVisible();
  await page.locator('.MuiInputBase-root').first().click();
  await page.getByRole('textbox', { name: 'Enter Plan Name' }).fill('joiviva health');

  await page.getByRole('combobox', { name: 'Select', exact: true }).click();
  await page.getByRole('option', { name: '-12' }).click();

  await page.getByRole('combobox', { name: 'Select Type' }).click();
  await page.getByText('Individual').click();

  await page.getByRole('textbox', { name: 'Enter Monthly Price' }).fill('10');
  await page.getByRole('textbox', { name: 'Enter Services' }).fill('services');
  await page.getByPlaceholder('Enter Duration in Minutes').fill('10');
  await page.getByRole('textbox', { name: 'Enter Value' }).fill('10');

  await page.getByRole('textbox', { name: 'Enter Discount Note' }).click();
  await page.getByRole('textbox', { name: 'Enter Value' }).fill('10n');
  await page.getByRole('textbox', { name: 'Enter Discount Note' }).fill('ote');
  await page.getByRole('textbox', { name: 'Enter Value' }).fill('10');

  await page.getByRole('button', { name: 'Create' }).click();

  // Edit subscription plan
  await page.getByRole('button', { name: /data:image\/svg\+xml/ }).first().click();
  await page.getByRole('textbox', { name: 'Enter Services' }).fill('services updated');
  await page.getByRole('button', { name: 'Update' }).click();

  // Delete subscription plan
  await page.getByRole('button', { name: /data:image\/svg\+xml/ }).nth(1).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Plan deleted successfully')).toBeVisible();
});