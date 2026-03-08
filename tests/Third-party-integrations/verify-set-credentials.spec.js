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

// Generate unique Mailinator inbox per test run
const testId = Date.now();
const staffFirstName = randomFirstName();
const staffLastName  = randomLastName();
const mailinatorInbox = `joiviva-staff-${testId}`;
const mailinatorEmail = `${mailinatorInbox}@mailinator.com`;

// New credentials to set for the staff user
const NEW_USERNAME = `staff_${testId}`;
const NEW_PASSWORD = 'Test@1234';

// ─── TEST ────────────────────────────────────────────────────────────────────

test('Verify Set Credentials - Create Staff User and Complete Registration via Email', async ({ browser }) => {
  test.setTimeout(300000); // 5 minutes

  console.log('── Generated Test Data ──────────────────────────');
  console.log(`Staff User  : ${staffFirstName} ${staffLastName}`);
  console.log(`Email       : ${mailinatorEmail}`);
  console.log(`New Username: ${NEW_USERNAME}`);
  console.log('─────────────────────────────────────────────────');

  // Create a browser context for admin operations
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  // ─── STEP 1: LOGIN AS ADMIN ────────────────────────────────────────────────
  await adminPage.goto(`${AUTH_URL}?client_id=public-client&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F&response_mode=fragment&response_type=code&scope=openid`);

  await adminPage.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await adminPage.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await adminPage.getByRole('button', { name: 'Sign In' }).click();

  await adminPage.goto(`${BASE_URL}/admin/dashboard`);

  // ─── STEP 2: NAVIGATE TO CLINIC GROUPS > USERS ─────────────────────────────
  await adminPage.getByRole('link', { name: 'hospital icon Clinic Groups' }).click();
  await adminPage.getByLabel('Metro Medical CenterMedical').click();
  await adminPage.getByRole('tab', { name: 'Users' }).click();

  // ─── STEP 3: ADD STAFF USER WITH MAILINATOR EMAIL ──────────────────────────
  await adminPage.getByRole('button', { name: 'Add New Users' }).click();
  await adminPage.waitForTimeout(1000);
  await adminPage.getByRole('menuitem', { name: 'Staff Users' }).click();
  await adminPage.waitForTimeout(2000);

  await adminPage.getByRole('textbox', { name: 'Enter First Name' }).fill(staffFirstName);
  await adminPage.getByRole('textbox', { name: 'Enter Last Name' }).fill(staffLastName);

  // Date of birth
  await adminPage.getByRole('button', { name: 'Choose date' }).click();
  await adminPage.getByRole('gridcell', { name: '2', exact: true }).click();

  // Gender
  await adminPage.getByLabel('Select', { exact: true }).click();
  await adminPage.getByRole('option', { name: 'Male', exact: true }).click();

  // Location
  await adminPage.getByRole('combobox', { name: 'Select Locations' }).click();
  await adminPage.getByRole('checkbox').check();

  // Mailinator email
  await adminPage.getByRole('textbox', { name: 'Enter Email' }).fill(mailinatorEmail);
  await adminPage.getByRole('textbox', { name: 'Enter Phone Number' }).fill('(705)-865-9504');

  // Role type & role
  await adminPage.getByRole('combobox', { name: 'Select' }).first().click();
  await adminPage.getByRole('option', { name: 'Provider' }).click();
  await adminPage.getByRole('combobox', { name: 'Select' }).nth(1).click();
  await adminPage.getByRole('option', { name: 'Provider staff' }).click();

  await adminPage.getByRole('button', { name: 'Save' }).click();
  await expect(adminPage.getByText('User added successfully')).toBeVisible({ timeout: 15000 });

  console.log('Staff user created. Waiting for invitation email...');
  await adminPage.close();
  await adminContext.close();

  // ─── STEP 4: OPEN MAILINATOR INBOX AND GET REGISTRATION LINK ───────────────
  const mailContext = await browser.newContext();
  const mailPage = await mailContext.newPage();

  let registrationLink = null;

  for (let attempt = 1; attempt <= 12; attempt++) {
    console.log(`Checking Mailinator inbox (attempt ${attempt}/12)...`);

    await mailPage.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${mailinatorInbox}`);
    await mailPage.waitForTimeout(3000);

    // Check if any email row exists in the inbox
    const emailRow = mailPage.locator('tr.ng-scope').first();
    const hasEmail = await emailRow.isVisible().catch(() => false);

    if (hasEmail) {
      // Click the first email
      await emailRow.click();
      await mailPage.waitForTimeout(2000);

      // Switch to the email body iframe
      const bodyFrame = mailPage.frameLocator('#html_msg_body');

      // Look for the "Complete Registration" button/link
      const completeRegLink = bodyFrame.getByRole('link', { name: 'Complete Registration' });

      if (await completeRegLink.isVisible().catch(() => false)) {
        registrationLink = await completeRegLink.getAttribute('href');
        console.log(`Found registration link: ${registrationLink}`);
        break;
      }

      // Fallback: try to find any link with credentials/registration keywords
      const allLinks = bodyFrame.locator('a[href]');
      const linkCount = await allLinks.count();

      for (let j = 0; j < linkCount; j++) {
        const href = await allLinks.nth(j).getAttribute('href');
        if (href && (href.includes('set-password') || href.includes('credential') ||
            href.includes('activate') || href.includes('registration') ||
            href.includes('auth.qa.joiviva'))) {
          registrationLink = href;
          console.log(`Found registration link (fallback): ${registrationLink}`);
          break;
        }
      }

      if (registrationLink) break;
    }

    // Wait 10 seconds before retrying
    await mailPage.waitForTimeout(10000);
  }

  await mailPage.close();
  await mailContext.close();

  if (!registrationLink) {
    throw new Error(`No invitation email received in inbox "${mailinatorInbox}" after 2 minutes`);
  }

  // ─── STEP 5: NAVIGATE TO SET CREDENTIALS PAGE ─────────────────────────────
  const credContext = await browser.newContext();
  const credPage = await credContext.newPage();

  await credPage.goto(registrationLink);
  await credPage.waitForTimeout(2000);

  // Verify we're on the Set Username and Password page
  await expect(credPage.getByText('Set Username and Password')).toBeVisible({ timeout: 15000 });
  console.log('Set Credentials page loaded successfully');

  // ─── STEP 6: FILL SET CREDENTIALS FORM ─────────────────────────────────────
  await credPage.getByRole('textbox', { name: 'Enter Username' }).fill(NEW_USERNAME);
  await credPage.getByRole('textbox', { name: 'Enter New Password' }).fill(NEW_PASSWORD);
  await credPage.getByRole('textbox', { name: 'Enter Confirm Password' }).fill(NEW_PASSWORD);

  await credPage.getByRole('button', { name: 'Confirm and Proceed' }).click();
  await credPage.waitForTimeout(3000);

  console.log('Credentials set successfully!');
  await credPage.close();
  await credContext.close();

  // ─── STEP 7: VERIFY LOGIN WITH NEW CREDENTIALS ────────────────────────────
  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();

  await loginPage.goto(`${AUTH_URL}?client_id=public-client&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F&response_mode=fragment&response_type=code&scope=openid`);

  await loginPage.getByRole('textbox', { name: 'Username' }).fill(NEW_USERNAME);
  await loginPage.getByRole('textbox', { name: 'Password' }).fill(NEW_PASSWORD);
  await loginPage.getByRole('button', { name: 'Sign In' }).click();

  // Verify successful login - should redirect to portal
  await loginPage.waitForURL('**/portal.qa.joiviva.org/**', { timeout: 15000 });
  console.log(`Login verified with new credentials: ${NEW_USERNAME}`);

  await loginPage.close();
  await loginContext.close();
});
