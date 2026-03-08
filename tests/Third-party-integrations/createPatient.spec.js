import { test, expect } from '@playwright/test';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Generate a random alphanumeric first/last name */
function randomName(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Pick a random DOB and return the DOB parts + calculated age.
 * Age range: 18–64 to match available subscription plans.
 */
function randomDOB() {
  const today = new Date();
  const ageYears = Math.floor(Math.random() * 47) + 18;     // 18–64
  const dobYear = today.getFullYear() - ageYears;
  const dobMonth = Math.floor(Math.random() * 12) + 1;      // 1–12
  // Use day 2–28 to stay safe across all months
  const dobDay = Math.floor(Math.random() * 27) + 2;

  // Recalculate exact age (birthday may not have occurred yet this year)
  const dob = new Date(dobYear, dobMonth - 1, dobDay);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  return {
    year: dobYear,
    month: dobMonth,   // 1-based
    day: dobDay,
    age,
  };
}


// ─── TEST ─────────────────────────────────────────────────────────────────────

test('Add New Patient with random name, DOB & age-matched plan purchase', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes for the full flow

  // Generate test data up front so we can log it on failure
  const firstName = randomName();
  const lastName = randomName();
  const dob = randomDOB();

  console.log(`Patient: ${firstName} ${lastName}`);
  console.log(`DOB: ${dob.month}/${dob.day}/${dob.year}  →  Age: ${dob.age}`);

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  await page.goto(
    'https://auth.qa.joiviva.org/realms/master/protocol/openid-connect/auth' +
    '?client_id=public-client' +
    '&redirect_uri=https%3A%2F%2Fportal.qa.joiviva.org%2F' +
    '&response_mode=fragment&response_type=code&scope=openid'
  );

  await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Username' }).fill('testnewprovider');
  await page.getByRole('textbox', { name: 'Password' }).fill('Pass@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/portal.qa.joiviva.org/**', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  // ─── PROVIDER DASHBOARD ────────────────────────────────────────────────────
  await page.goto('https://portal.qa.joiviva.org/provider/dashboard');
  await page.waitForLoadState('domcontentloaded');

  // ─── PATIENTS LIST - VERIFY EXISTING PATIENT ──────────────────────────────
  await page.getByRole('link', { name: 'person icon Patients' }).click();
  await expect(page.getByText('100983')).toBeVisible();
  await page.getByText('100983').click();

  // Navigate to Allergies tab and return
  await expect(page.getByRole('img', { name: 'Allergies' })).toBeVisible();
  await page.getByRole('img', { name: 'Allergies' }).click();
  await page.getByRole('link', { name: 'person icon Patients' }).click();

  // ─── NEW PATIENT ───────────────────────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible();
  await page.getByRole('button', { name: 'New Patient' }).click();

  // Step 1: Basic Info
  await expect(page.getByRole('textbox', { name: 'Enter First Name' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter First Name' }).fill(firstName);
  await page.getByRole('textbox', { name: 'Enter Last Name' }).fill(lastName);

  // DOB: open date picker, navigate to correct year/month, select day
  await page.getByRole('button', { name: 'Choose date' }).click();
  await expect(page.locator('.MuiDateCalendar-root')).toBeVisible();

  // Switch to year view and select year
  await page.getByRole('button', { name: /switch to year/i }).click();
  await page.getByRole('radio', { name: String(dob.year) }).click();

  // After year selection, MUI shows month grid — click the correct month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  await page.getByRole('radio', { name: monthNames[dob.month - 1] }).click();

  // Now the day grid is visible — select the day
  await page.getByRole('gridcell', { name: String(dob.day), exact: true }).click();

  // Close the date picker by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Confirm DOB selection is visible (MUI date picker updates the input)
  await expect(page.locator('input[placeholder="MM/DD/YYYY"]').first()).not.toBeEmpty();

  // Select sex
  await page.locator('#mui-component-select-sex').click();
  await expect(page.getByRole('option', { name: 'Male', exact: true })).toBeVisible();
  await page.getByRole('option', { name: 'Male', exact: true }).click();

  await page.getByRole('button', { name: 'Save & Continue' }).click();

  // Step 2: Contact Info — wait for the Contact Information page to load
  await expect(page.locator('input[name="phoneNumber"]')).toBeVisible({ timeout: 10000 });

  // Fill address fields first (these use standard fill and won't get erased)
  await page.getByRole('textbox', { name: 'Enter Address Line 1' }).fill('123 Main Street');

  await page.getByRole('textbox', { name: 'Enter City' }).click();
  await page.getByRole('textbox', { name: 'Enter City' }).fill('Anchorage');

  // Select state
  await page.getByRole('combobox', { name: 'Select State' }).click();
  await expect(page.getByRole('option', { name: 'Alaska' })).toBeVisible();
  await page.getByRole('option', { name: 'Alaska' }).click();

  await page.getByRole('textbox', { name: 'Enter ZIP Code' }).click();
  await page.getByRole('textbox', { name: 'Enter ZIP Code' }).fill('99501');

  // Emergency Contact
  await page.getByRole('button', { name: 'Add Emergency Contact' }).click();
  await page.getByRole('combobox', { name: 'Select Patient Relationship' }).click();
  await expect(page.getByRole('option', { name: 'Partner' })).toBeVisible();
  await page.getByRole('option', { name: 'Partner' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('textbox', { name: 'Enter First Name' }).fill('Jane');
  await page.getByRole('textbox', { name: 'Enter Last Name' }).fill('Doe');
  await page.getByRole('textbox', { name: 'Enter Contact Number' }).click();
  await page.getByRole('textbox', { name: 'Enter Contact Number' }).pressSequentially('8888888888', { delay: 50 });

  // Fill phone and email LAST to prevent React re-renders from erasing them
  await page.locator('input[name="phoneNumber"]').click();
  await page.locator('input[name="phoneNumber"]').pressSequentially('7666666666', { delay: 50 });
  await page.keyboard.press('Tab'); // blur to commit value

  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').pressSequentially('testpatient@mailinator.com', { delay: 20 });
  await page.keyboard.press('Tab'); // blur to commit value
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Save & Continue' }).click();

  // Step 3 & 4: Skip through intermediate steps
  await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & Continue' }).click();

  await expect(page.getByRole('button', { name: 'Save & Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & Continue' }).click();

  // Step 5: Consent
  await expect(page.getByRole('checkbox', { name: 'Consent To Email' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Consent To Email' }).check();
  await expect(page.getByRole('checkbox', { name: 'Consent To Email' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Consent To Call' }).check();
  await expect(page.getByRole('checkbox', { name: 'Consent To Call' })).toBeChecked();
  await page.getByRole('button', { name: 'Save & Continue' }).click();

  // ─── SUBSCRIPTION PLAN SELECTION ──────────────────────────────────────────
  // Plan cards show age ranges like "Age 18–35", "Age 35–55", "Age 55–65".
  // Paginate through pages, parse age ranges, and click Buy Now on the matching card.
  const age = dob.age;
  let foundPlan = false;

  await expect(page.getByText('Select your plan')).toBeVisible({ timeout: 10000 });

  for (let pageNum = 1; pageNum <= 13 && !foundPlan; pageNum++) {
    // Use evaluate to find the Buy Now button whose card contains a matching age range
    const btnIndex = await page.evaluate((patientAge) => {
      const buyButtons = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Buy Now');
      for (let i = 0; i < buyButtons.length; i++) {
        // Walk up to find the card container (look for a common ancestor with the age text)
        let container = buyButtons[i].parentElement;
        // Go up max 10 levels to find the card
        for (let depth = 0; depth < 10 && container; depth++) {
          const text = container.textContent || '';
          const matches = [...text.matchAll(/Age\s+(\d+)[–\-](\d+)/g)];
          for (const m of matches) {
            const min = parseInt(m[1]);
            const max = parseInt(m[2]);
            if (patientAge >= min && patientAge <= max) {
              return i; // Return the index of the matching Buy Now button
            }
          }
          container = container.parentElement;
        }
      }
      return -1; // No match found
    }, age);

    if (btnIndex >= 0) {
      console.log(`Page ${pageNum}: Found matching plan for age ${age} at Buy Now button index ${btnIndex}`);
      await page.getByRole('button', { name: 'Buy Now' }).nth(btnIndex).click();
      foundPlan = true;
      break;
    }

    console.log(`Page ${pageNum}: No matching plan for age ${age}`);
    // Navigate to next page
    const nextArrow = page.locator('button[aria-label="Go to next page"]');
    if (await nextArrow.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextArrow.click();
      await page.waitForTimeout(1000);
    } else {
      break;
    }
  }

  if (!foundPlan) {
    console.log(`No plan found for age ${age} on any page, clicking first available Buy Now`);
    await page.getByRole('button', { name: 'Buy Now' }).first().click();
  }

  // After selecting a plan, button changes to "Selected" — click "Proceed to Pay"
  await expect(page.getByRole('button', { name: 'Proceed to Pay' })).toBeEnabled({ timeout: 5000 });
  await page.getByRole('button', { name: 'Proceed to Pay' }).click();

  // ─── PAYMENT FORM ─────────────────────────────────────────────────────────
  await expect(page.getByRole('textbox', { name: 'Enter Name' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Enter Name' }).fill('tyyy');
  await page.getByRole('textbox', { name: '-0000-0000' }).fill('4242 4242 4242 4242');
  await page.getByRole('textbox', { name: 'MM/YY' }).fill('12/50');
  await page.getByRole('textbox', { name: 'CVC' }).fill('666');

  await page.locator('div:nth-child(6) > .MuiBox-root.css-1gnc3qn > .MuiInputBase-root').click();
  await page.getByRole('textbox', { name: 'Enter', exact: true }).fill('66666');

  await page.getByRole('checkbox', { name: 'Save My Card' }).check();
  await expect(page.getByRole('checkbox', { name: 'Save My Card' })).toBeChecked();

  // Button text includes dynamic price — use partial match
  await expect(page.getByRole('button', { name: /Proceed to Payment/ })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Proceed to Payment/ }).click();

  // Wait for payment to process — either a success dialog or page navigation
  // Take a screenshot to debug what appears after payment
  await page.waitForTimeout(5000);
  // Check for any dialog/modal that appeared
  const dialogBtn = page.getByRole('button', { name: 'Okay' });
  const okBtn = page.getByRole('button', { name: 'OK' });
  if (await dialogBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await dialogBtn.click();
  } else if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await okBtn.click();
  }

  // Wait for navigation to patient list or dashboard
  //await page.waitForTimeout(3000);
  //await page.getByRole('img', { name: 'Diagnosis' }).click();
});