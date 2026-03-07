const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://portal.qa.joiviva.org';
const AUTH_URL = 'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth';

const USERNAME = 'olivia';
const PASSWORD = 'Pass@123';

// ─── RANDOM DATA GENERATORS ───────────────────────────────────────────────────

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** US phone format: (XXX)-XXX-XXXX */
const randomPhone = () => {
  const a = randInt(200, 999);
  const b = randInt(200, 999);
  const c = randInt(1000, 9999);
  return `(${a})-${b}-${c}`;
};

/** Random email */
const randomEmail = (prefix) => {
  const domains = ['contact.com', 'clinic.org', 'health.net', 'medical.io'];
  return `${prefix.toLowerCase().replace(/\s+/g, '.')}.${randInt(100, 999)}@${domains[randInt(0, domains.length - 1)]}`;
};

/** NPI: exactly 10 digits, starts with 1 or 2 */
const randomNPI = () => {
  const start = randInt(1, 2);
  const rest = Array.from({ length: 9 }, () => randInt(0, 9)).join('');
  return `${start}${rest}`;
};

/** Fax: exactly 10 digits */
const randomFax = () => Array.from({ length: 10 }, () => randInt(0, 9)).join('');

/** ZIP: exactly 5 digits */
const randomZip = () => String(randInt(10000, 99999));

/** Website URL */
const randomWebsite = (name) => `www.${name.toLowerCase().replace(/\s+/g, '')}.com`;

/** Random clinic name */
const randomClinicName = () => {
  const adjectives = ['Central', 'City', 'Metro', 'Valley', 'Summit', 'Lakeside', 'Harbor'];
  const nouns = ['Hospital', 'Clinic', 'Medical Center', 'Health Group', 'Care Center'];
  return `${adjectives[randInt(0, adjectives.length - 1)]} ${nouns[randInt(0, nouns.length - 1)]}`;
};

/** Random location name */
const randomLocationName = () => {
  const prefixes = ['North', 'South', 'East', 'West', 'Downtown', 'Uptown', 'Midtown'];
  const suffixes = ['Branch', 'Location', 'Site', 'Unit', 'Campus'];
  return `${prefixes[randInt(0, prefixes.length - 1)]} ${suffixes[randInt(0, suffixes.length - 1)]}`;
};

/** Random US city */
const randomCity = () => {
  const cities = ['Springfield', 'Riverside', 'Greenville', 'Madison', 'Franklin', 'Clinton', 'Georgetown'];
  return cities[randInt(0, cities.length - 1)];
};

/** Random street address */
const randomAddress = () => {
  const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Blvd', 'Pine Rd', 'Elm Way'];
  return `${randInt(100, 9999)} ${streets[randInt(0, streets.length - 1)]}`;
};

/** Office from-time: 07:00 AM – 10:00 AM */
const randomFromTime = () => `0${randInt(7, 10)}:00 AM`;

/** Office to-time: 05:00 PM – 09:00 PM */
const randomToTime = () => `0${randInt(5, 9)}:00 PM`;

// ─── GENERATE TEST DATA ───────────────────────────────────────────────────────

const clinicName          = randomClinicName();
const clinicNameUpdated   = `${clinicName} Updated`;
const locationName        = randomLocationName();
const locationNameUpdated = `${locationName} Updated`;
const clinicPhone         = randomPhone();
const clinicEmail         = randomEmail(clinicName);
const clinicNPI           = randomNPI();
const clinicFax           = randomFax();
const clinicZip           = randomZip();
const clinicWebsite       = randomWebsite(clinicName);
const clinicAddress       = randomAddress();
const clinicCity          = randomCity();
const locationPhone       = randomPhone();
const locationEmail       = randomEmail(locationName);
const locationFax         = randomFax();
const locationZip         = randomZip();
const locationAddress     = randomAddress();
const locationCity        = randomCity();
const fromTime            = randomFromTime();
const toTime              = randomToTime();

test('Clinic Management - Create, Edit, Status Toggle, Locations & Departments', async ({ page }) => {
  test.setTimeout(180000);

  console.log('── Generated Test Data ──────────────────────────');
  console.log(`Clinic Name   : ${clinicName}`);
  console.log(`Phone         : ${clinicPhone}`);
  console.log(`Email         : ${clinicEmail}`);
  console.log(`NPI           : ${clinicNPI}`);
  console.log(`Fax           : ${clinicFax}`);
  console.log(`ZIP           : ${clinicZip}`);
  console.log(`Website       : ${clinicWebsite}`);
  console.log(`Address       : ${clinicAddress}, ${clinicCity}`);
  console.log(`Location Name : ${locationName}`);
  console.log(`Office Hours  : ${fromTime} – ${toTime}`);
  console.log('─────────────────────────────────────────────────');

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  await page.goto(`${AUTH_URL}?client_id=public-client&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F&response_mode=fragment&response_type=code&scope=openid`);

  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.goto(`${BASE_URL}/admin/dashboard`);

  // ─── NAVIGATE TO CLINIC GROUPS ────────────────────────────────────────────────
  await page.getByRole('link', { name: 'hospital icon Clinic Groups' }).click();

  // ─── CREATE NEW CLINIC ────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'New Clinic' }).click();

  await page.getByRole('textbox', { name: 'Enter Clinic Name' }).fill(clinicName);
  await page.getByRole('textbox', { name: 'Enter Contact Number' }).fill(clinicPhone);
  await page.getByRole('textbox', { name: 'Enter Email' }).fill(clinicEmail);
  await page.getByRole('textbox', { name: 'Enter Group NPI Number' }).fill(clinicNPI);

  // Select specialities (first 3 options)
  await page.getByRole('combobox', { name: 'Select Specialities' }).click();
  await page.locator('.MuiButtonBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium.PrivateSwitchBase-root.css-13qq1a0 > .PrivateSwitchBase-input').first().check();
  await page.locator('#tags-standard-option-1 > .MuiButtonBase-root > .PrivateSwitchBase-input').check();
  await page.locator('#tags-standard-option-2 > .MuiButtonBase-root > .PrivateSwitchBase-input').check();

  await page.getByRole('textbox', { name: 'Enter Website' }).fill(clinicWebsite);
  await page.getByRole('textbox', { name: 'Enter Fax ID' }).fill(clinicFax);

  // Physical Address
  await page.locator('#physicalAddressLine1').fill(clinicAddress);
  await page.locator('#physicalCity').fill(clinicCity);
  await page.getByRole('combobox', { name: 'Select' }).first().click();
  await page.getByRole('option', { name: 'Arizona' }).click();
  await page.locator('#physicalZip').fill(clinicZip);

  // Timezone
  await page.getByRole('combobox', { name: 'Select' }).nth(1).click();
  await page.getByRole('option', { name: 'Mountain Standard Time' }).click();

  // Same as Physical Address
  await page.getByRole('checkbox', { name: 'Same as Physical Address' }).check();

  // Office Hours (Mon–Fri)
  await page.locator('input[name="mondayFromTime"]').fill(fromTime);
  await page.locator('input[name="mondayToTime"]').fill(toTime);
  await page.locator('input[name="tuesdayFromTime"]').fill(fromTime);
  await page.locator('input[name="tuesdayToTime"]').fill(toTime);
  await page.locator('input[name="wednesdayFromTime"]').fill(fromTime);
  await page.locator('input[name="wednesdayToTime"]').fill(toTime);
  await page.locator('input[name="thursdayFromTime"]').fill(fromTime);
  await page.locator('input[name="thursdayToTime"]').fill(toTime);
  await page.locator('input[name="fridayFromTime"]').fill(fromTime);
  await page.locator('input[name="fridayToTime"]').fill(toTime);

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Clinic created successfully')).toBeVisible();

  // ─── SEARCH & TOGGLE STATUS ───────────────────────────────────────────────────
  await page.getByRole('textbox', { name: 'Search by clinic name or' }).fill(clinicName);
  await page.waitForTimeout(2000);

  await page.getByRole('checkbox').click();
  await expect(page.getByText('Clinic status updated')).toBeVisible();

  // ─── EDIT CLINIC ──────────────────────────────────────────────────────────────
  await page.getByTestId('MoreVertIcon').locator('path').click();
  await page.getByRole('button', { name: 'Edit' }).click();

  const clinicNameInput = page.getByRole('textbox', { name: 'Enter Clinic Name' });
  await clinicNameInput.click();
  await clinicNameInput.fill('');
  await clinicNameInput.pressSequentially(clinicNameUpdated, { delay: 50 });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Clinic updated successfully')).toBeVisible();

  // Re-enable clinic
  await page.getByRole('checkbox').click();

  // ─── VIEW DETAILS ─────────────────────────────────────────────────────────────
  await page.getByTestId('MoreVertIcon').click();
  await page.getByRole('button', { name: 'View Details' }).click();

  // ─── LOCATIONS TAB ───────────────────────────────────────────────────────────
  await page.getByRole('tab', { name: 'Locations' }).click();

  await page.getByRole('button', { name: 'Add Location' }).click();

  await page.getByRole('textbox', { name: 'Enter Location Name' }).fill(locationName);
  await page.getByRole('textbox', { name: 'Enter Contact Number' }).fill(locationPhone);
  await page.getByRole('textbox', { name: 'Enter Fax ID (10 digits)' }).fill(locationFax);
  await page.getByRole('textbox', { name: 'Enter Email' }).fill(locationEmail);

  // Physical Address
  await page.locator('#physicalAddressLine1').fill(locationAddress);
  await page.locator('#physicalCity').fill(locationCity);
  await page.getByRole('combobox', { name: 'Select' }).nth(1).click();
  await page.getByRole('option', { name: 'California' }).click();
  await page.locator('#physicalZip').fill(locationZip);

  // Same as Physical Address
  await page.getByRole('checkbox', { name: 'Same as Physical Address' }).check();

  // Location Office Hours (Mon–Fri)
  await page.getByRole('textbox', { name: 'From' }).nth(0).fill(fromTime);
  await page.getByRole('textbox', { name: 'To' }).nth(0).fill(toTime);
  await page.getByRole('textbox', { name: 'From' }).nth(1).fill(fromTime);
  await page.getByRole('textbox', { name: 'To' }).nth(1).fill(toTime);
  await page.getByRole('textbox', { name: 'From' }).nth(2).fill(fromTime);
  await page.getByRole('textbox', { name: 'To' }).nth(2).fill(toTime);
  await page.getByRole('textbox', { name: 'From' }).nth(3).fill(fromTime);
  await page.getByRole('textbox', { name: 'To' }).nth(3).fill(toTime);
  await page.getByRole('textbox', { name: 'From' }).nth(4).fill(fromTime);
  await page.getByRole('textbox', { name: 'To' }).nth(4).fill(toTime);

  // Select specialities for location
  await page.locator('.MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-colorPrimary.MuiInputBase-fullWidth.MuiInputBase-formControl.MuiInputBase-adornedStart').first().click();
  await page.getByText('Pain Management Specialist').click();
  await page.locator('#tags-standard-option-1 > .MuiButtonBase-root > .PrivateSwitchBase-input').check();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Location created successfully!')).toBeVisible();

  // Toggle location status
  await page.getByRole('checkbox').click();
  await expect(page.getByText('Location status updated')).toBeVisible();

  // Edit Location
  await page.getByTestId('MoreVertIcon').click();
  await page.getByRole('button', { name: 'Edit Location' }).click();
  const locationNameInput = page.getByRole('textbox', { name: 'Enter Location Name' });
  await locationNameInput.click();
  await locationNameInput.fill('');
  await locationNameInput.pressSequentially(locationNameUpdated, { delay: 50 });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Location updated successfully!')).toBeVisible();

  // Close context menu via backdrop
  await page.getByTestId('MoreVertIcon').click();
  await page.locator('.MuiBackdrop-root').click();

  
});