/**
 * Provider Portal - Questionnaire Form Builder Exploration
 * Navigate to Settings > Questionnaire > Add New Form
 * Explore the custom form builder and create a US Healthcare EHR form
 */
const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://portal.qa.joiviva.org';
const SCREENSHOTS_DIR = path.join(__dirname, '../../explorer/screenshots/questionnaire');

test.describe('Provider Portal - Questionnaire Form Builder', () => {

  test.beforeEach(async ({ page }) => {
    // Auth is handled by chromium-provider project storage state
    await page.goto(`${BASE_URL}/provider/settings/questionnaires`);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('Navigated to questionnaires page, URL:', page.url());
  });

  test('Step 1: Navigate to Settings and explore Questionnaire section', async ({ page }) => {
    // Click Settings in top nav
    const settingsNav = page.locator('a:has-text("Settings"), [class*="nav"] >> text=Settings').first();
    await settingsNav.waitFor({ state: 'visible', timeout: 10000 });
    await settingsNav.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle').catch(() => {});

    console.log('Settings page URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-settings-page.png'), fullPage: true });

    // Look for Questionnaire menu item / tab / link
    const questionnaireSelectors = [
      'text=Questionnaire',
      'text=questionnaire',
      'text=Questionnaires',
      'a:has-text("Questionnaire")',
      '[class*="menu"] >> text=Questionnaire',
      '[class*="sidebar"] >> text=Questionnaire',
      '[class*="tab"] >> text=Questionnaire',
      'button:has-text("Questionnaire")',
    ];

    let questionnaireFound = false;
    for (const selector of questionnaireSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`Found Questionnaire element with selector: ${selector}`);
        await element.click();
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle').catch(() => {});
        questionnaireFound = true;
        break;
      }
    }

    if (!questionnaireFound) {
      // Log all visible links/tabs/buttons on settings page for discovery
      const allLinks = await page.locator('a, button, [role="tab"], [class*="menu-item"], [class*="nav-item"]')
        .allTextContents();
      console.log('All visible navigation elements on Settings page:',
        allLinks.filter(t => t.trim()).map(t => t.trim()));

      // Try clicking on sub-menu items
      const sidebarItems = await page.locator('[class*="sidebar"] *, [class*="menu"] *, [class*="list"] a, [class*="list"] button')
        .allTextContents();
      console.log('Sidebar/menu items:', sidebarItems.filter(t => t.trim()).map(t => t.trim()));
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-questionnaire-section.png'), fullPage: true });
    console.log('Questionnaire section URL:', page.url());
  });

  test('Step 2: Explore form list and click Add New Form', async ({ page }) => {
    // Navigate to Settings > Questionnaire
    await page.locator('a:has-text("Settings"), [class*="nav"] >> text=Settings').first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle').catch(() => {});

    // Click Questionnaire
    const questionnaire = page.locator('text=Questionnaire').first();
    if (await questionnaire.isVisible().catch(() => false)) {
      await questionnaire.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // Screenshot the questionnaire list
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-questionnaire-list.png'), fullPage: true });

    // Look for existing forms
    const formCards = await page.locator('[class*="card"], [class*="form-item"], [class*="list-item"], table tbody tr')
      .count();
    console.log('Number of existing forms/cards:', formCards);

    // Look for Add New Form button
    const addButtonSelectors = [
      'button:has-text("Add")',
      'button:has-text("New")',
      'button:has-text("Create")',
      'button:has-text("Add New")',
      'button:has-text("Add Form")',
      'button:has-text("New Form")',
      'button:has-text("Create Form")',
      'a:has-text("Add")',
      'a:has-text("New Form")',
      '[class*="add"], [class*="create"]',
      'button >> svg', // icon buttons
    ];

    let addButtonFound = false;
    for (const selector of addButtonSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent().catch(() => '');
        console.log(`Found add button with selector: ${selector}, text: "${text.trim()}"`);
        await element.click();
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle').catch(() => {});
        addButtonFound = true;
        break;
      }
    }

    if (!addButtonFound) {
      const allButtons = await page.locator('button, a[class*="btn"]').allTextContents();
      console.log('All buttons on page:', allButtons.filter(t => t.trim()).map(t => t.trim()));
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-add-new-form.png'), fullPage: true });
    console.log('After Add New Form click, URL:', page.url());
  });

  test('Step 3: Explore the form builder UI elements', async ({ page }) => {
    // Navigate to Settings > Questionnaire > Add New Form
    await page.locator('a:has-text("Settings"), [class*="nav"] >> text=Settings').first().click();
    await page.waitForTimeout(3000);

    const questionnaire = page.locator('text=Questionnaire').first();
    if (await questionnaire.isVisible().catch(() => false)) {
      await questionnaire.click();
      await page.waitForTimeout(3000);
    }

    // Click Add/New/Create button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // Explore form builder UI
    console.log('Form Builder URL:', page.url());

    // Discover form builder components
    const formFields = await page.locator('input, select, textarea, [contenteditable]').all();
    console.log('Number of input elements:', formFields.length);

    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];
      const type = await field.getAttribute('type').catch(() => 'N/A');
      const name = await field.getAttribute('name').catch(() => 'N/A');
      const placeholder = await field.getAttribute('placeholder').catch(() => 'N/A');
      const ariaLabel = await field.getAttribute('aria-label').catch(() => 'N/A');
      const tagName = await field.evaluate(el => el.tagName).catch(() => 'N/A');
      console.log(`  Field ${i + 1}: tag=${tagName}, type=${type}, name=${name}, placeholder=${placeholder}, aria-label=${ariaLabel}`);
    }

    // Look for drag-and-drop components, toolbox, sidebar with form elements
    const builderSelectors = [
      '[class*="builder"]', '[class*="toolbox"]', '[class*="palette"]',
      '[class*="drag"]', '[class*="component"]', '[class*="field-type"]',
      '[class*="sidebar"]', '[class*="panel"]', '[class*="widget"]',
    ];

    for (const sel of builderSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        console.log(`Found ${count} elements matching: ${sel}`);
      }
    }

    // Look for form element types (text, checkbox, radio, dropdown, etc.)
    const elementTypes = await page.locator('[class*="element"], [class*="field"], [class*="widget"], [class*="item"]')
      .allTextContents();
    const uniqueTypes = [...new Set(elementTypes.filter(t => t.trim()).map(t => t.trim().substring(0, 80)))];
    console.log('Form element types available:', uniqueTypes.slice(0, 30));

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-form-builder-ui.png'), fullPage: true });
  });

  test('Step 4: Create a US Healthcare EHR Form', async ({ page }) => {
    // Navigate to Settings > Questionnaire > Add New Form
    await page.locator('a:has-text("Settings"), [class*="nav"] >> text=Settings').first().click();
    await page.waitForTimeout(3000);

    const questionnaire = page.locator('text=Questionnaire').first();
    if (await questionnaire.isVisible().catch(() => false)) {
      await questionnaire.click();
      await page.waitForTimeout(3000);
    }

    // Click Add/New/Create button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-ehr-form-start.png'), fullPage: true });

    // --- Fill form name/title ---
    const nameInput = page.locator('input[name*="name" i], input[name*="title" i], input[placeholder*="name" i], input[placeholder*="title" i], input[placeholder*="form" i]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('US Healthcare EHR - Patient Health Assessment');
      console.log('Filled form name');
    }

    // Look for description field
    const descInput = page.locator('textarea[name*="desc" i], textarea[placeholder*="desc" i], input[name*="desc" i]').first();
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('Comprehensive EHR patient health assessment questionnaire for US healthcare providers. Includes demographics, medical history, medications, allergies, and review of systems.');
      console.log('Filled description');
    }

    // Look for category/type dropdown
    const categorySelect = page.locator('select, [class*="select"], [class*="dropdown"]').first();
    if (await categorySelect.isVisible().catch(() => false)) {
      const tagName = await categorySelect.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        const options = await categorySelect.locator('option').allTextContents();
        console.log('Category options:', options);
      } else {
        await categorySelect.click();
        await page.waitForTimeout(1000);
        const dropdownItems = await page.locator('[class*="option"], [class*="menu-item"], [role="option"], li').allTextContents();
        console.log('Dropdown items:', dropdownItems.filter(t => t.trim()).map(t => t.trim()));
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-ehr-form-details.png'), fullPage: true });

    // --- Add form fields (EHR Healthcare fields) ---
    // The form builder may have a drag-and-drop interface or an "Add Field" button

    const addFieldBtn = page.locator(
      'button:has-text("Add Field"), button:has-text("Add Question"), button:has-text("Add Element"), ' +
      'button:has-text("Add Section"), button:has-text("Add Item"), button:has-text("Add"), ' +
      '[class*="add-field"], [class*="add-question"]'
    ).first();

    // EHR Form Sections to create
    const ehrSections = [
      // Section 1: Patient Demographics
      { section: 'Patient Demographics', fields: [
        { label: 'Full Legal Name', type: 'text', required: true },
        { label: 'Date of Birth', type: 'date', required: true },
        { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], required: true },
        { label: 'Social Security Number (Last 4)', type: 'text', required: false },
        { label: 'Preferred Language', type: 'select', options: ['English', 'Spanish', 'Mandarin', 'Other'], required: true },
        { label: 'Race/Ethnicity', type: 'select', options: ['White', 'Black/African American', 'Hispanic/Latino', 'Asian', 'Native American', 'Pacific Islander', 'Two or More Races', 'Other', 'Prefer not to say'], required: false },
        { label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Domestic Partner'], required: false },
      ]},
      // Section 2: Insurance Information
      { section: 'Insurance Information', fields: [
        { label: 'Primary Insurance Provider', type: 'text', required: true },
        { label: 'Insurance Policy Number', type: 'text', required: true },
        { label: 'Group Number', type: 'text', required: false },
        { label: 'Insurance Phone Number', type: 'text', required: false },
        { label: 'Secondary Insurance (if applicable)', type: 'text', required: false },
      ]},
      // Section 3: Medical History
      { section: 'Medical History', fields: [
        { label: 'Current Medical Conditions', type: 'textarea', required: true },
        { label: 'Previous Surgeries', type: 'textarea', required: false },
        { label: 'Do you have any of the following conditions?', type: 'checkbox',
          options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma/COPD', 'Cancer', 'Stroke', 'Kidney Disease', 'Liver Disease', 'Thyroid Disorder', 'Mental Health Condition', 'None'], required: true },
        { label: 'Family Medical History', type: 'textarea', required: false },
      ]},
      // Section 4: Current Medications
      { section: 'Current Medications', fields: [
        { label: 'Are you currently taking any medications?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'List all current medications (name, dosage, frequency)', type: 'textarea', required: false },
        { label: 'Are you taking any over-the-counter supplements?', type: 'radio', options: ['Yes', 'No'], required: false },
        { label: 'List supplements', type: 'textarea', required: false },
      ]},
      // Section 5: Allergies
      { section: 'Allergies', fields: [
        { label: 'Do you have any known drug allergies?', type: 'radio', options: ['Yes', 'No', 'Unknown'], required: true },
        { label: 'List drug allergies and reactions', type: 'textarea', required: false },
        { label: 'Do you have any food allergies?', type: 'radio', options: ['Yes', 'No'], required: false },
        { label: 'Do you have any environmental allergies?', type: 'radio', options: ['Yes', 'No'], required: false },
        { label: 'List all allergies and reactions', type: 'textarea', required: false },
      ]},
      // Section 6: Review of Systems (ROS)
      { section: 'Review of Systems', fields: [
        { label: 'General: Have you experienced unexplained weight loss, fatigue, or fever?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Cardiovascular: Chest pain, palpitations, or shortness of breath?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Respiratory: Cough, wheezing, or difficulty breathing?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Gastrointestinal: Nausea, vomiting, diarrhea, or abdominal pain?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Musculoskeletal: Joint pain, muscle weakness, or back pain?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Neurological: Headaches, dizziness, numbness, or tingling?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Psychiatric: Depression, anxiety, or sleep disturbances?', type: 'radio', options: ['Yes', 'No'], required: true },
        { label: 'Additional comments or concerns', type: 'textarea', required: false },
      ]},
      // Section 7: Social History
      { section: 'Social History', fields: [
        { label: 'Tobacco Use', type: 'select', options: ['Never', 'Former smoker', 'Current smoker', 'Vaping/E-cigarettes'], required: true },
        { label: 'Alcohol Use', type: 'select', options: ['None', 'Occasional (1-2/week)', 'Moderate (3-7/week)', 'Heavy (>7/week)'], required: true },
        { label: 'Recreational Drug Use', type: 'radio', options: ['Yes', 'No', 'Prefer not to answer'], required: false },
        { label: 'Exercise Frequency', type: 'select', options: ['None', '1-2 times/week', '3-4 times/week', '5+ times/week'], required: false },
        { label: 'Occupation', type: 'text', required: false },
      ]},
      // Section 8: Consent & Acknowledgment
      { section: 'Consent & Acknowledgment', fields: [
        { label: 'I acknowledge that the information provided is accurate to the best of my knowledge', type: 'checkbox', required: true },
        { label: 'I consent to the use of my health information for treatment purposes as per HIPAA regulations', type: 'checkbox', required: true },
        { label: 'I consent to receive electronic communications regarding my healthcare', type: 'checkbox', required: false },
        { label: 'Patient Signature (Type Full Name)', type: 'text', required: true },
        { label: 'Date', type: 'date', required: true },
      ]},
    ];

    console.log('\n=== EHR Form Structure ===');
    console.log(`Total Sections: ${ehrSections.length}`);
    console.log(`Total Fields: ${ehrSections.reduce((sum, s) => sum + s.fields.length, 0)}`);

    // Try to add fields using the form builder
    for (const section of ehrSections) {
      console.log(`\nSection: ${section.section} (${section.fields.length} fields)`);

      // Try to add a section header
      const sectionBtn = page.locator(
        'button:has-text("Add Section"), button:has-text("Section"), [class*="section"]'
      ).first();

      if (await sectionBtn.isVisible().catch(() => false)) {
        await sectionBtn.click();
        await page.waitForTimeout(1000);

        // Fill section name
        const sectionNameInput = page.locator('input:visible').last();
        if (await sectionNameInput.isVisible().catch(() => false)) {
          await sectionNameInput.fill(section.section);
        }
      }

      // Try to add each field
      for (const field of section.fields) {
        if (await addFieldBtn.isVisible().catch(() => false)) {
          await addFieldBtn.click();
          await page.waitForTimeout(1000);

          // Try to fill field label
          const labelInput = page.locator(
            'input[placeholder*="label" i], input[placeholder*="question" i], input[name*="label" i], input[name*="question" i]'
          ).first();
          if (await labelInput.isVisible().catch(() => false)) {
            await labelInput.fill(field.label);
          }

          // Try to select field type
          const typeSelect = page.locator(
            'select[name*="type" i], [class*="type-select"], [class*="field-type"]'
          ).first();
          if (await typeSelect.isVisible().catch(() => false)) {
            const tagName = await typeSelect.evaluate(el => el.tagName);
            if (tagName === 'SELECT') {
              await typeSelect.selectOption({ label: field.type });
            } else {
              await typeSelect.click();
              await page.waitForTimeout(500);
              await page.locator(`text=${field.type}`).first().click().catch(() => {});
            }
          }

          // Set required toggle
          if (field.required) {
            const requiredToggle = page.locator(
              'input[type="checkbox"][name*="required" i], [class*="required"] input, label:has-text("Required")'
            ).first();
            if (await requiredToggle.isVisible().catch(() => false)) {
              const isChecked = await requiredToggle.isChecked().catch(() => false);
              if (!isChecked) await requiredToggle.click();
            }
          }

          // Save/confirm the field
          const saveFieldBtn = page.locator(
            'button:has-text("Save"), button:has-text("Done"), button:has-text("OK"), button:has-text("Add")'
          ).first();
          if (await saveFieldBtn.isVisible().catch(() => false)) {
            await saveFieldBtn.click();
            await page.waitForTimeout(500);
          }
        }

        console.log(`  + ${field.label} (${field.type}${field.required ? ', required' : ''})`);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-ehr-form-fields-added.png'), fullPage: true });

    // --- Save/Submit the form ---
    const saveFormBtn = page.locator(
      'button:has-text("Save"), button:has-text("Submit"), button:has-text("Publish"), button:has-text("Create Form")'
    ).first();

    if (await saveFormBtn.isVisible().catch(() => false)) {
      const btnText = await saveFormBtn.textContent();
      console.log(`Clicking save button: "${btnText.trim()}"`);
      await saveFormBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-ehr-form-saved.png'), fullPage: true });
    console.log('\nEHR Form creation completed. Final URL:', page.url());

    // Check for success message
    const successMsg = page.locator('[class*="success"], [class*="toast"], [class*="alert"], [class*="notification"]').first();
    if (await successMsg.isVisible().catch(() => false)) {
      const msg = await successMsg.textContent();
      console.log('Success message:', msg.trim());
    }
  });
});
