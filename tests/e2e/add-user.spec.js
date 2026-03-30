const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://portal.qa.joiviva.org';
const AUTH_URL = 'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth';

const USERNAME = 'olivia';
const PASSWORD = 'Pass@123';

// ─── RANDOM NAME GENERATORS ───────────────────────────────────────────────────

const firstNames = ['James', 'Oliver', 'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Henry', 'Jacob', 'Michael',
                    'Emma', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily'];

const lastNames  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore',
                    'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young', 'Hall'];

const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomFirstName = () => randItem(firstNames);
const randomLastName  = () => randItem(lastNames);

// ─── GENERATED TEST DATA ──────────────────────────────────────────────────────

const staffFirstName  = randomFirstName();
const staffLastName   = randomLastName();
const clinicFirstName = randomFirstName();
const clinicLastName  = randomLastName();

test('Clinic Users - Add Staff User and Clinic User (Provider)', async ({ page }) => {
  test.setTimeout(180000);

  console.log('── Generated Test Data ──────────────────────────');
  console.log(`Staff User   : ${staffFirstName} ${staffLastName}`);
  console.log(`Clinic User  : ${clinicFirstName} ${clinicLastName}`);
  console.log('─────────────────────────────────────────────────');

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto(`${AUTH_URL}?client_id=public-client&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F&response_mode=fragment&response_type=code&scope=openid`);

  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.goto(`${BASE_URL}/admin/dashboard`);

  // ─── NAVIGATE TO CLINIC GROUPS ────────────────────────────────────────────────
  await page.getByRole('link', { name: 'hospital icon Clinic Groups' }).click();
  await page.waitForTimeout(2000);

  // Search for clinic and click the clinic name
  await page.getByPlaceholder(/search by clinic name/i).fill('Metro Care Center');
  await page.waitForTimeout(2000);
  await page.getByText('Metro Care Center Updated').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Users' }).click();

  // ─── ADD STAFF USER ───────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Add New Users' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('menuitem', { name: 'Staff Users' }).click();
  await page.waitForTimeout(2000);

  await page.getByRole('textbox', { name: 'Enter First Name' }).fill(staffFirstName);
  await page.getByRole('textbox', { name: 'Enter Last Name' }).fill(staffLastName);

  // Date of birth
  await page.getByRole('button', { name: 'Choose date' }).click();
  await page.getByRole('gridcell', { name: '2', exact: true }).click();

  // Gender
  await page.getByLabel('Select', { exact: true }).click();
  await page.getByRole('option', { name: 'Male', exact: true }).click();

  // Location — select first available option if any, otherwise skip
  await page.getByRole('combobox', { name: 'Select Locations' }).click();
  await page.waitForTimeout(1000);
  const locationCheckbox = page.getByRole('checkbox').first();
  if (await locationCheckbox.isVisible().catch(() => false)) {
    await locationCheckbox.check();
  }
  await page.keyboard.press('Escape');

  await page.getByRole('textbox', { name: 'Enter Email' }).fill('rutuja.dumbre@thinkitive.com');
  await page.getByRole('textbox', { name: 'Enter Phone Number' }).fill('(705)-865-9504');

  // Role type & role
  await page.getByRole('combobox', { name: 'Select' }).first().click();
  await page.getByRole('option', { name: 'Provider' }).click();
  await page.getByRole('combobox', { name: 'Select' }).nth(1).click();
  await page.getByRole('option', { name: 'Provider staff' }).click();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('User added successfully')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);

  // ─── EDIT STAFF USER ──────────────────────────────────────────────────────────
  // Find the staff user row - may be on page 2 if list is large
  const staffRow = page.getByRole('row', { name: new RegExp(`${staffFirstName} ${staffLastName}`) });
  if (!(await staffRow.isVisible().catch(() => false))) {
    // Click page 2 button if user is not on page 1
    await page.getByRole('button', { name: '2' }).click();
    await page.waitForTimeout(2000);
  }
  await staffRow.getByTestId('MoreVertIcon').click();
  await page.getByRole('button', { name: 'Edit User' }).click();

  // Update date of birth
  await page.getByRole('button', { name: 'Choose date, selected date is' }).click();
  await page.getByRole('gridcell', { name: '3', exact: true }).click();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('User updated successfully')).toBeVisible();

  // ─── ADD CLINIC USER (PROVIDER) ───────────────────────────────────────────────
  await page.getByRole('button', { name: 'Add New Users' }).click();
  await page.getByRole('menuitem', { name: 'Clinic Users' }).click();

  // Provider type & speciality
  await page.getByRole('combobox', { name: 'Select' }).first().click();
  await page.getByRole('option', { name: 'Physician', exact: true }).click();
  await page.getByRole('combobox', { name: 'Select' }).nth(1).click();
  await page.getByRole('option', { name: 'Pain Management Specialist' }).click();

  // Role & credential type
  await page.locator('.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.MuiGrid2-grid-sm-6.MuiGrid2-grid-md-2 > div > .MuiBox-root.css-1setivn > .MuiAutocomplete-root > .MuiFormControl-root > .MuiInputBase-root').first().click();
  await page.getByRole('option', { name: 'Provider' }).click();
  await page.getByRole('button', { name: 'Open' }).nth(3).click();
  await page.getByRole('option', { name: 'Signed' }).click();

  // Personal info
  await page.getByRole('textbox', { name: 'Enter First Name' }).fill(clinicFirstName);
  await page.locator('.MuiGrid2-root > div:nth-child(2) > div > .MuiInputBase-root').first().click();
  await page.getByRole('textbox', { name: 'Enter Last Name' }).fill(clinicLastName);

  // Gender
  await page.locator('#mui-component-select-gender').click();
  await page.getByRole('option', { name: 'Male', exact: true }).click();

  // Contact
  await page.getByRole('textbox', { name: 'Enter Clinician Phone Number' }).fill('(705)-865-9504');
  await page.getByRole('textbox', { name: 'Enter Office Fax Number' }).fill('5555555555');
  await page.getByRole('textbox', { name: 'Enter Email' }).fill('rutuja.dumbre@thinkitive.com');

  // Professional info
  await page.getByRole('textbox', { name: 'Enter Year Of Experience' }).fill('6');
  await page.locator('div:nth-child(4) > div:nth-child(3) > div > .MuiInputBase-root').click();
  await page.getByRole('textbox', { name: 'Enter Taxonomy Number' }).fill('667676777X');

  // Work locations & languages
  await page.getByRole('combobox', { name: 'Select Work Locations' }).click();
  await page.getByText('Midtown Sitewn Site Updated').click();
  await page.getByRole('combobox', { name: 'Select Languages' }).click();
  await page.getByText('Spanish').click();
  await page.getByRole('option', { name: 'French' }).getByRole('checkbox').check();

  // Insurance & verification
  await page.locator('#mui-component-select-insuranceVerification').click();
  await page.getByRole('option', { name: 'No' }).click();
  await page.getByLabel('Select').click();
  await page.getByRole('option', { name: 'Yes' }).click();

  // Script sure clinician ID
  await page.getByRole('textbox', { name: 'Enter Script Sure Clinician ID' }).fill('3333');

  // Appointment type
  await page.getByRole('combobox', { name: 'Select' }).nth(4).click();
  await page.getByRole('option', { name: 'Follow-up Consultation' }).click();

  // Age preference
  await page.locator('input[name="agePreferenceMin"]').fill('01');
  await page.locator('input[name="agePreferenceMax"]').fill('9');

  // Banking info
  await page.getByRole('textbox', { name: 'Enter Bank Name' }).fill('hsbc');
  await page.getByRole('textbox', { name: 'Enter Bank Account Number' }).fill('7666');
  await page.locator('.MuiBox-root.css-0 > .MuiGrid2-root.MuiGrid2-container > div:nth-child(3) > div > .MuiInputBase-root').first().click();
  await page.getByRole('textbox', { name: 'Enter US Routing Number' }).fill('888888888');

  // Bio & expertise
  await page.locator('textarea[name="clinicianBio"]').fill('Test bio for clinician');
  await page.getByRole('textbox', { name: 'Enter Expertise' }).fill('Pain Management');
  await page.locator('textarea[name="educationWorkExperience"]').fill('MD from State University, 5 years experience');

  // License
  await page.getByRole('combobox', { name: 'Select' }).nth(5).click();
  await page.getByRole('option', { name: 'Arkansas' }).click();
  await page.getByRole('textbox', { name: 'Enter Licence Number' }).fill('444444');

  // License expiry date
  await page.getByRole('button', { name: 'Choose date' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('gridcell', { name: '30' }).last().click();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Provider created successfully')).toBeVisible();

  // ─── EDIT CLINIC USER ─────────────────────────────────────────────────────────
  const clinicRow = page.getByRole('row', { name: new RegExp(`${clinicFirstName} ${clinicLastName}`) });
  if (!(await clinicRow.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: '2' }).click();
    await page.waitForTimeout(2000);
  }
  await clinicRow.getByTestId('MoreVertIcon').click();
  await page.getByRole('button', { name: 'Edit User' }).click();

  // Update gender
  await page.locator('#mui-component-select-gender').click();
  await page.getByRole('option', { name: 'Female', exact: true }).click();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('User updated successfully')).toBeVisible({ timeout: 15000 });
});