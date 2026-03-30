/**
 * Explore Questionnaire Form Builder - Field Types Discovery
 */
const { test } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://portal.qa.joiviva.org';
const path = require('path');
const SCREENSHOTS_DIR = path.join(__dirname, '../../explorer/screenshots/questionnaire');

test.describe('Questionnaire Form Builder - Field Discovery', () => {

  test('Discover form builder layout, categories, and field types', async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    if (!page.url().includes('/provider/')) {
      const usernameInput = page.locator('#username, input[name="username"]').first();
      await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
      await usernameInput.fill(process.env.PROVIDER_USERNAME || 'testnewprovider');
      await page.locator('#password, input[name="password"], input[type="password"]').first()
        .fill(process.env.PROVIDER_PASSWORD || 'Pass@123');
      await page.locator('#kc-login, input[name="login"], input[type="submit"]').first().click();
      await page.waitForURL(/\/provider\//, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // Navigate to Settings
    await page.locator('a:has-text("Settings")').first().click();
    await page.waitForTimeout(3000);

    // Navigate to Questionnaires
    await page.locator('text=Questionnaire').first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle').catch(() => {});

    console.log('Questionnaire page URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-questionnaire-page.png'), fullPage: true });

    // List all clickable elements
    const allClickable = await page.locator('a, button, [role="button"], [class*="btn"]').allTextContents();
    console.log('Clickable elements on questionnaire page:', allClickable.filter(t => t.trim()).map(t => t.trim()));

    // Click "Add New Form"
    const addFormBtn = page.locator('text=Add New Form, button:has-text("Add"), a:has-text("Add")').first();
    await addFormBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addFormBtn.click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle').catch(() => {});

    console.log('\nForm Builder URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-form-builder-fresh.png'), fullPage: true });

    // === Capture full page state ===
    // All visible text elements (headings, labels, etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6, label, [class*="label"]').allTextContents();
    console.log('\nHeadings/Labels:', headings.filter(t => t.trim()).map(t => t.trim()));

    // All buttons
    const buttons = await page.locator('button, [role="button"], a[class*="btn"]').allTextContents();
    console.log('\nButtons:', buttons.filter(t => t.trim()).map(t => t.trim()));

    // All inputs
    const inputs = await page.locator('input:visible, select:visible, textarea:visible').all();
    console.log(`\nVisible inputs: ${inputs.length}`);
    for (let i = 0; i < inputs.length; i++) {
      const el = inputs[i];
      const tag = await el.evaluate(el => el.tagName);
      const type = await el.getAttribute('type').catch(() => '');
      const placeholder = await el.getAttribute('placeholder').catch(() => '');
      const value = await el.inputValue().catch(() => '');
      console.log(`  ${i + 1}. ${tag} type=${type} placeholder="${placeholder}" value="${value}"`);
    }

    // === Explore Category dropdown ===
    console.log('\n--- Exploring Category Dropdown ---');
    const categoryArea = page.locator('text=Select form category, [class*="select"]:has-text("category"), [class*="select"]:has-text("Category")').first();
    if (await categoryArea.isVisible().catch(() => false)) {
      await categoryArea.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-category-options.png'), fullPage: true });
      const options = await page.locator('[class*="option"], [role="option"], [class*="menu-item"], [class*="list-item"]').allTextContents();
      console.log('Category options:', options.filter(t => t.trim()).map(t => t.trim()));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // === Scroll down to find Add New Field ===
    console.log('\n--- Scrolling to find Add New Field ---');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-scrolled-down.png'), fullPage: true });

    // Try to find and click "+ Add New Field"
    const addFieldSelectors = [
      'text=+ Add New Field',
      'text=Add New Field',
      'text=Add Field',
      'button:has-text("Add New Field")',
      'button:has-text("Add Field")',
      '[class*="add-field"]',
      'a:has-text("Add New Field")',
      'div:has-text("+ Add New Field")',
    ];

    let addFieldBtn = null;
    for (const sel of addFieldSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        addFieldBtn = el;
        console.log(`Found Add Field with: ${sel}`);
        break;
      }
    }

    if (addFieldBtn) {
      await addFieldBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-after-add-field.png'), fullPage: true });

      // Discover what appeared
      const newInputs = await page.locator('input:visible, select:visible, textarea:visible').all();
      console.log(`\nInputs after Add Field: ${newInputs.length}`);
      for (let i = 0; i < newInputs.length; i++) {
        const el = newInputs[i];
        const tag = await el.evaluate(el => el.tagName);
        const type = await el.getAttribute('type').catch(() => '');
        const placeholder = await el.getAttribute('placeholder').catch(() => '');
        console.log(`  ${i + 1}. ${tag} type=${type} placeholder="${placeholder}"`);
      }

      // Look for field type selection
      const newButtons = await page.locator('button:visible, [role="button"]:visible').allTextContents();
      console.log('\nButtons after Add Field:', newButtons.filter(t => t.trim()).map(t => t.trim()));

      // Look for dropdowns
      const dropdowns = await page.locator('[class*="select"]:visible').allTextContents();
      console.log('\nDropdowns after Add Field:', dropdowns.filter(t => t.trim()).map(t => t.trim().substring(0, 80)));

      // Scroll to see full field form
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-field-form-scrolled.png'), fullPage: true });

      // Look for field type dropdown and click it
      const fieldTypeArea = page.locator('text=Select field type, text=Field Type, [class*="select"]:has-text("type")').first();
      if (await fieldTypeArea.isVisible().catch(() => false)) {
        await fieldTypeArea.click();
        await page.waitForTimeout(1500);
        const fieldTypes = await page.locator('[class*="option"], [role="option"]').allTextContents();
        console.log('\nField Type options:', fieldTypes.filter(t => t.trim()).map(t => t.trim()));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-field-type-options.png'), fullPage: true });
      }

      // Check for toggles (required, etc.)
      const toggles = await page.locator('[class*="toggle"], [class*="switch"], input[type="checkbox"]:visible').all();
      console.log(`\nToggles/Checkboxes: ${toggles.length}`);
      for (let i = 0; i < toggles.length; i++) {
        const label = await toggles[i].evaluate(el => {
          const parent = el.closest('label, [class*="form-group"], [class*="field"]');
          return parent ? parent.textContent.trim().substring(0, 80) : el.getAttribute('name') || 'unknown';
        });
        console.log(`  Toggle ${i + 1}: ${label}`);
      }
    } else {
      console.log('Add New Field button NOT FOUND after scrolling');
      // Capture full page HTML for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('\nFull page text (first 2000 chars):', bodyText.substring(0, 2000));
    }
  });
});
