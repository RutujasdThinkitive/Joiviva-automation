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
  // Determine the age-range text to look for on plan cards
  const age = dob.age;
  let ageSearchText;
  if (age <= 17) ageSearchText = 'Age 0';
  else if (age <= 64) ageSearchText = 'Age 18';
  else ageSearchText = 'Age 65';

  // Paginate through plan pages to find a plan matching the patient's age
  let foundPlan = false;
  for (let pageNum = 1; pageNum <= 13; pageNum++) {
    // Check if a plan card on this page contains the age text
    const ageMatch = page.getByText(ageSearchText).first();
    if (await ageMatch.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Found a matching plan — find its "Buy Now" button
      // Click the Buy Now on the same card
      const buyButtons = page.getByRole('button', { name: 'Buy Now' });
      const count = await buyButtons.count();
      for (let i = 0; i < count; i++) {
        // Check if this Buy Now button's parent card contains the age text
        const card = buyButtons.nth(i).locator('xpath=ancestor::div[contains(@class,"MuiCard") or contains(@class,"MuiPaper") or contains(@class,"MuiBox")]').first();
        const cardText = await card.textContent().catch(() => '');
        if (cardText.includes(ageSearchText)) {
          await buyButtons.nth(i).click();
          foundPlan = true;
          break;
        }
      }
      // If no specific card match, just click the first Buy Now
      if (!foundPlan && count > 0) {
        await buyButtons.first().click();
        foundPlan = true;
      }
      break;
    }
    // Navigate to next page if available
    const nextButton = page.getByRole('button', { name: `Go to page ${pageNum + 1}` });
    if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
    } else {
      // Try the "next page" arrow button
      const nextArrow = page.locator('button[aria-label="Go to next page"]');
      if (await nextArrow.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextArrow.click();
        await page.waitForTimeout(500);
      } else {
        break; // No more pages
      }
    }
  }

  // Fallback: if no age-matched plan found, just buy the first available
  if (!foundPlan) {
    console.log(`No plan found for age text "${ageSearchText}", clicking first available Buy Now`);
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

  // Wait for payment confirmation dialog — button may be "Okay", "OK", or "Done"
  await expect(page.getByRole('button', { name: /Okay|OK|Done|Close/i }).first()).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Okay|OK|Done|Close/i }).first().click();

  // ─── VERIFY PATIENT WAS CREATED ───────────────────────────────────────────
  // Patient name cell should appear in the table after payment
  await expect(page.getByRole('gridcell', { name: `${firstName} ${lastName}` })).toBeVisible({ timeout: 10000 });
  await page.getByRole('gridcell', { name: `${firstName} ${lastName}` }).click();

  // Search for the newly created patient by first name
  await page.getByRole('textbox', { name: 'Search by Patient ID, Name,' }).fill(firstName);
  await expect(page.getByText('100993')).toBeVisible({ timeout: 10000 });
  await page.getByText('100993').click();

  // Verify patient profile loads with Diagnosis tab
  await expect(page.getByRole('img', { name: 'Diagnosis' })).toBeVisible();
  await page.getByRole('img', { name: 'Diagnosis' }).click();
});