/**
 * PageAnalyzer - Extracts structured data from a single page.
 * Discovers links, buttons, forms, inputs, tables, interactive elements,
 * headings, ARIA landmarks, and UI patterns.
 */
class PageAnalyzer {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Run full analysis on the current page
   * @returns {Promise<Object>} Structured page data
   */
  async analyze() {
    const url = this.page.url();
    const title = await this.page.title();
    const parsed = new URL(url);
    // Support hash-based routing (e.g. #/dashboard) common in Angular/SPA apps
    const path = parsed.hash && /^#\//.test(parsed.hash)
      ? parsed.hash.substring(1)
      : parsed.pathname;

    const [links, buttons, forms, tables, interactiveElements, headings, landmarks, patterns, crudOperations] =
      await Promise.all([
        this.extractLinks(),
        this.extractButtons(),
        this.extractForms(),
        this.extractTables(),
        this.extractInteractiveElements(),
        this.extractHeadings(),
        this.extractLandmarks(),
        this.detectPatterns(),
        this.detectCrudOperations(),
      ]);

    return {
      url,
      title,
      path,
      screenshotPath: null,
      timestamp: new Date().toISOString(),
      links,
      buttons,
      forms,
      tables,
      interactiveElements,
      headings,
      landmarks,
      patterns,
      crudOperations,
    };
  }

  /**
   * Extract all links from the page
   * @returns {Promise<Array>}
   */
  async extractLinks() {
    return await this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map((a) => {
        const nav = a.closest('nav, [role="navigation"], header, .navbar, .sidebar, .nav');
        return {
          text: (a.textContent || '').trim().substring(0, 100),
          href: a.href,
          selector: a.getAttribute('data-testid')
            ? `[data-testid="${a.getAttribute('data-testid')}"]`
            : null,
          isNavigation: !!nav,
          ariaLabel: a.getAttribute('aria-label') || null,
        };
      }).filter((l) => l.text || l.ariaLabel);
    });
  }

  /**
   * Extract all buttons from the page
   * @returns {Promise<Array>}
   */
  async extractButtons() {
    return await this.page.evaluate(() => {
      const selectors = 'button, [role="button"], input[type="submit"], input[type="button"]';
      const elements = Array.from(document.querySelectorAll(selectors));
      return elements.map((el) => ({
        text: (el.textContent || el.value || '').trim().substring(0, 100),
        type: el.getAttribute('type') || 'button',
        testId: el.getAttribute('data-testid') || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        disabled: el.disabled || false,
        selector: el.getAttribute('data-testid')
          ? `[data-testid="${el.getAttribute('data-testid')}"]`
          : el.id
            ? `#${el.id}`
            : null,
      }));
    });
  }

  /**
   * Extract all forms and their fields from the page
   * @returns {Promise<Array>}
   */
  async extractForms() {
    return await this.page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      return forms.map((form) => {
        const inputs = Array.from(
          form.querySelectorAll('input, textarea, select')
        ).filter((el) => el.type !== 'hidden');

        const submitBtn = form.querySelector(
          'button[type="submit"], input[type="submit"], button:not([type])'
        );

        return {
          action: form.action || null,
          method: (form.method || 'GET').toUpperCase(),
          id: form.id || null,
          testId: form.getAttribute('data-testid') || null,
          inputs: inputs.map((input) => {
            const label = input.id
              ? document.querySelector(`label[for="${input.id}"]`)
              : input.closest('label');

            let options = null;
            if (input.tagName === 'SELECT') {
              options = Array.from(input.querySelectorAll('option')).map((o) => ({
                value: o.value,
                text: o.textContent.trim(),
              }));
            }

            return {
              name: input.name || null,
              type: input.type || input.tagName.toLowerCase(),
              required: input.required || input.getAttribute('aria-required') === 'true',
              label: label ? label.textContent.trim().substring(0, 100) : null,
              placeholder: input.placeholder || null,
              testId: input.getAttribute('data-testid') || null,
              ariaLabel: input.getAttribute('aria-label') || null,
              pattern: input.pattern || null,
              minLength: input.minLength > 0 ? input.minLength : null,
              maxLength: input.maxLength > 0 ? input.maxLength : null,
              min: input.min || null,
              max: input.max || null,
              options,
            };
          }),
          submitButton: submitBtn
            ? {
                text: (submitBtn.textContent || submitBtn.value || '').trim(),
                testId: submitBtn.getAttribute('data-testid') || null,
              }
            : null,
        };
      });
    });
  }

  /**
   * Extract tables from the page
   * @returns {Promise<Array>}
   */
  async extractTables() {
    return await this.page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table, [role="table"], [role="grid"]'));
      return tables.map((table) => {
        const headerCells = Array.from(
          table.querySelectorAll('thead th, thead td, [role="columnheader"]')
        );
        const rows = table.querySelectorAll('tbody tr, [role="row"]');
        return {
          headers: headerCells.map((h) => h.textContent.trim()),
          rowCount: rows.length,
          testId: table.getAttribute('data-testid') || null,
          id: table.id || null,
          ariaLabel: table.getAttribute('aria-label') || null,
        };
      });
    });
  }

  /**
   * Extract interactive elements (dropdowns, tabs, modals, accordions)
   * @returns {Promise<Array>}
   */
  async extractInteractiveElements() {
    return await this.page.evaluate(() => {
      const elements = [];

      // Dropdowns
      const dropdowns = document.querySelectorAll(
        '[aria-haspopup], [data-toggle="dropdown"], .dropdown-toggle'
      );
      dropdowns.forEach((el) => {
        elements.push({
          type: 'dropdown',
          text: (el.textContent || '').trim().substring(0, 100),
          ariaExpanded: el.getAttribute('aria-expanded'),
          testId: el.getAttribute('data-testid') || null,
        });
      });

      // Tabs
      const tabLists = document.querySelectorAll('[role="tablist"]');
      tabLists.forEach((tabList) => {
        const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
        elements.push({
          type: 'tabs',
          items: tabs.map((t) => ({
            text: t.textContent.trim(),
            selected: t.getAttribute('aria-selected') === 'true',
          })),
          testId: tabList.getAttribute('data-testid') || null,
        });
      });

      // Modal triggers
      const modalTriggers = document.querySelectorAll(
        '[data-toggle="modal"], [data-bs-toggle="modal"], [aria-haspopup="dialog"]'
      );
      modalTriggers.forEach((el) => {
        elements.push({
          type: 'modal-trigger',
          text: (el.textContent || '').trim().substring(0, 100),
          target: el.getAttribute('data-target') || el.getAttribute('data-bs-target') || null,
          testId: el.getAttribute('data-testid') || null,
        });
      });

      // Accordions
      const accordions = document.querySelectorAll(
        '[data-toggle="collapse"], [data-bs-toggle="collapse"], details'
      );
      accordions.forEach((el) => {
        elements.push({
          type: 'accordion',
          text: (el.textContent || '').trim().substring(0, 60),
          expanded: el.getAttribute('aria-expanded') === 'true' || el.open === true,
          testId: el.getAttribute('data-testid') || null,
        });
      });

      return elements;
    });
  }

  /**
   * Extract heading hierarchy
   * @returns {Promise<Array>}
   */
  async extractHeadings() {
    return await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map((h) => ({
        level: parseInt(h.tagName.substring(1), 10),
        text: h.textContent.trim().substring(0, 200),
      }));
    });
  }

  /**
   * Extract ARIA landmarks and semantic regions
   * @returns {Promise<Array>}
   */
  async extractLandmarks() {
    return await this.page.evaluate(() => {
      const selectors =
        'nav, main, aside, header, footer, [role="navigation"], [role="main"], ' +
        '[role="banner"], [role="complementary"], [role="contentinfo"], [role="search"]';
      const elements = Array.from(document.querySelectorAll(selectors));
      return elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || null,
      }));
    });
  }

  /**
   * Detect CRUD (Create, Read, Update, Delete) operations on the page.
   * Identifies buttons, links, and forms that indicate CRUD capabilities.
   * @returns {Promise<Object>}
   */
  async detectCrudOperations() {
    return await this.page.evaluate(() => {
      const allText = (el) => (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().toLowerCase();
      const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a.btn, a[class*="btn"]'));
      const allLinks = Array.from(document.querySelectorAll('a[href]'));

      const matchElements = (elements, patterns) => {
        return elements
          .filter((el) => {
            const text = allText(el);
            const cls = (el.className || '').toLowerCase();
            const icon = el.querySelector('i, mat-icon, svg, [class*="icon"]');
            const iconCls = icon ? (icon.className || '').toLowerCase() : '';
            const title = (el.getAttribute('title') || '').toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const combined = `${text} ${cls} ${iconCls} ${title} ${ariaLabel}`;
            return patterns.some((p) => combined.includes(p));
          })
          .map((el) => ({
            text: (el.textContent || el.value || '').trim().substring(0, 100),
            tag: el.tagName.toLowerCase(),
            testId: el.getAttribute('data-testid') || null,
            ariaLabel: el.getAttribute('aria-label') || null,
            selector: el.getAttribute('data-testid')
              ? `[data-testid="${el.getAttribute('data-testid')}"]`
              : el.id ? `#${el.id}` : null,
          }));
      };

      // Create patterns
      const createPatterns = ['add', 'create', 'new', 'register', 'insert', 'plus', 'fa-plus', 'add_circle', 'post'];
      const createElements = matchElements([...allButtons, ...allLinks], createPatterns);

      // Read/View patterns
      const readPatterns = ['view', 'detail', 'show', 'preview', 'open', 'read', 'visibility', 'fa-eye', 'info'];
      const readElements = matchElements([...allButtons, ...allLinks], readPatterns);

      // Update patterns
      const updatePatterns = ['edit', 'update', 'modify', 'change', 'save', 'patch', 'pencil', 'fa-edit', 'fa-pencil', 'mode_edit'];
      const updateElements = matchElements([...allButtons, ...allLinks], updatePatterns);

      // Delete patterns
      const deletePatterns = ['delete', 'remove', 'destroy', 'trash', 'discard', 'fa-trash', 'fa-remove', 'fa-times', 'clear'];
      const deleteElements = matchElements([...allButtons, ...allLinks], deletePatterns);

      // Check for data listing (Read in CRUD context)
      const hasTables = document.querySelectorAll('table, [role="table"], [role="grid"]').length > 0;
      const hasLists = document.querySelectorAll('[role="list"], ul.list-group, .data-list, [class*="list-item"], [class*="card-list"]').length > 0;
      const hasDataDisplay = hasTables || hasLists;

      // Check for forms (potential Create/Update)
      const forms = Array.from(document.querySelectorAll('form'));
      const dataForms = forms.filter((f) => {
        const inputs = f.querySelectorAll('input:not([type="hidden"]):not([type="password"]), textarea, select');
        return inputs.length >= 2; // Forms with 2+ visible fields likely manage data
      });

      return {
        create: { detected: createElements.length > 0, elements: createElements },
        read: { detected: readElements.length > 0 || hasDataDisplay, elements: readElements, hasDataDisplay },
        update: { detected: updateElements.length > 0, elements: updateElements },
        delete: { detected: deleteElements.length > 0, elements: deleteElements },
        dataForms: dataForms.length,
        summary: {
          hasCreate: createElements.length > 0,
          hasRead: readElements.length > 0 || hasDataDisplay,
          hasUpdate: updateElements.length > 0,
          hasDelete: deleteElements.length > 0,
          isCrudPage: (createElements.length > 0 || updateElements.length > 0) && (hasDataDisplay || deleteElements.length > 0),
        },
      };
    });
  }

  /**
   * Detect common UI patterns on the page
   * @returns {Promise<Object>}
   */
  async detectPatterns() {
    return await this.page.evaluate(() => {
      const has = (selector) => !!document.querySelector(selector);
      return {
        hasPagination: has(
          '.pagination, [aria-label*="pagination" i], nav[aria-label*="page" i], .pager, [data-testid*="pagination"]'
        ),
        hasSearch: has(
          'input[type="search"], [role="search"], [data-testid*="search"], input[placeholder*="search" i]'
        ),
        hasSorting: has(
          '[aria-sort], .sortable, th[data-sort], [data-testid*="sort"]'
        ),
        hasFilters: has(
          '.filter, [data-testid*="filter"], [aria-label*="filter" i], .filters'
        ),
        hasInfiniteScroll: has(
          '[data-infinite-scroll], .infinite-scroll, [data-testid*="load-more"]'
        ),
        hasBreadcrumbs: has(
          '.breadcrumb, [aria-label*="breadcrumb" i], nav[aria-label*="breadcrumb" i], ol.breadcrumb'
        ),
        hasNotifications: has(
          '.notification, .toast, [role="alert"], [data-testid*="notification"], .alert'
        ),
        hasLoadingIndicator: has(
          '.spinner, .loading, [role="progressbar"], [aria-busy="true"], .skeleton'
        ),
      };
    });
  }
}

module.exports = { PageAnalyzer };
