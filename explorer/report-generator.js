const fs = require('fs');
const path = require('path');

/**
 * ReportGenerator - Transforms raw crawl data into JSON and Markdown reports.
 */
class ReportGenerator {
  /**
   * @param {Array} pages - Array of page analysis data from the crawler
   * @param {Object} config - Explorer config
   * @param {Object} meta - Additional metadata (startTime, endTime, authUsed)
   */
  constructor(pages, config, meta = {}) {
    this.pages = pages;
    this.config = config;
    this.meta = meta;
  }

  /**
   * Generate both JSON and Markdown reports
   * @param {string} outputDir - Directory to save reports
   * @returns {{jsonPath: string, mdPath: string}}
   */
  generate(outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = this._buildReport();
    const jsonPath = path.join(outputDir, 'exploration-report.json');
    const mdPath = path.join(outputDir, 'exploration-report.md');

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`[Report] JSON report saved to ${jsonPath}`);

    const markdown = this._generateMarkdown(report);
    fs.writeFileSync(mdPath, markdown);
    console.log(`[Report] Markdown report saved to ${mdPath}`);

    return { jsonPath, mdPath };
  }

  /**
   * Build the structured report object
   * @returns {Object}
   */
  _buildReport() {
    const siteMap = this._buildSiteMap();
    const summary = this._buildSummary();
    const suggestedTestAreas = this._suggestTestAreas();

    const durationMs = this.meta.endTime
      ? this.meta.endTime - this.meta.startTime
      : 0;

    return {
      metadata: {
        baseUrl: this.config.url,
        exploredAt: new Date().toISOString(),
        totalPages: this.pages.length,
        maxDepthReached: Math.max(...this.pages.map((p) => p.depth || 0), 0),
        durationMs,
        duration: this._formatDuration(durationMs),
        authUsed: !!(this.config.email && this.config.password),
        config: {
          maxDepth: this.config.maxDepth,
          maxPages: this.config.maxPages,
        },
      },
      siteMap,
      pages: this.pages,
      summary: {
        ...summary,
        suggestedTestAreas,
      },
    };
  }

  /**
   * Build site map showing page relationships
   * @returns {Object}
   */
  _buildSiteMap() {
    const map = {};

    // Build outgoing links
    for (const page of this.pages) {
      const parsedUrl = new URL(page.url);
      const pagePath = page.path || (parsedUrl.hash && /^#\//.test(parsedUrl.hash)
        ? parsedUrl.hash.substring(1)
        : parsedUrl.pathname);
      map[pagePath] = {
        title: page.title || 'Unknown',
        depth: page.depth || 0,
        linksTo: [],
        linkedFrom: [],
      };

      if (page.links) {
        for (const link of page.links) {
          try {
            const linkParsed = new URL(link.href);
            const linkPath = linkParsed.hash && /^#\//.test(linkParsed.hash)
              ? linkParsed.hash.substring(1)
              : linkParsed.pathname;
            if (!map[pagePath].linksTo.includes(linkPath)) {
              map[pagePath].linksTo.push(linkPath);
            }
          } catch {
            // Invalid URL
          }
        }
      }
    }

    // Build incoming links
    for (const [pagePath, data] of Object.entries(map)) {
      for (const targetPath of data.linksTo) {
        if (map[targetPath] && !map[targetPath].linkedFrom.includes(pagePath)) {
          map[targetPath].linkedFrom.push(pagePath);
        }
      }
    }

    return map;
  }

  /**
   * Build summary statistics
   * @returns {Object}
   */
  _buildSummary() {
    let totalForms = 0;
    let totalButtons = 0;
    let totalLinks = 0;
    let totalInputFields = 0;
    let totalInteractiveElements = 0;
    const pagesWithForms = [];
    const pagesWithTables = [];
    const pagesWithModals = [];
    const allPatterns = new Set();
    const pagesWithErrors = [];
    const crudPages = { create: [], read: [], update: [], delete: [] };

    for (const page of this.pages) {
      if (page.error) {
        pagesWithErrors.push({ path: page.path, error: page.error });
      }

      totalLinks += (page.links || []).length;
      totalButtons += (page.buttons || []).length;
      totalForms += (page.forms || []).length;
      totalInteractiveElements += (page.interactiveElements || []).length;

      if (page.forms && page.forms.length > 0) {
        pagesWithForms.push(page.path);
        for (const form of page.forms) {
          totalInputFields += (form.inputs || []).length;
        }
      }

      if (page.tables && page.tables.length > 0) {
        pagesWithTables.push(page.path);
      }

      const modalTriggers = (page.interactiveElements || []).filter(
        (el) => el.type === 'modal-trigger'
      );
      if (modalTriggers.length > 0) {
        pagesWithModals.push(page.path);
      }

      if (page.patterns) {
        for (const [pattern, detected] of Object.entries(page.patterns)) {
          if (detected) allPatterns.add(pattern.replace('has', ''));
        }
      }

      // Track CRUD operations per page
      if (page.crudOperations && page.crudOperations.summary) {
        const crud = page.crudOperations.summary;
        if (crud.hasCreate) crudPages.create.push(page.path);
        if (crud.hasRead) crudPages.read.push(page.path);
        if (crud.hasUpdate) crudPages.update.push(page.path);
        if (crud.hasDelete) crudPages.delete.push(page.path);
      }
    }

    return {
      totalForms,
      totalButtons,
      totalLinks,
      totalInputFields,
      totalInteractiveElements,
      pagesWithForms,
      pagesWithTables,
      pagesWithModals,
      detectedPatterns: [...allPatterns],
      pagesWithErrors,
      crudPages,
    };
  }

  /**
   * Suggest test areas based on discovered pages and elements
   * @returns {Array}
   */
  _suggestTestAreas() {
    const areas = [];

    for (const page of this.pages) {
      if (page.error) continue;

      // Forms with password fields -> Critical (auth/security)
      for (const form of page.forms || []) {
        const hasPassword = form.inputs.some((i) => i.type === 'password');
        const hasEmail = form.inputs.some(
          (i) => i.type === 'email' || (i.name && /email/i.test(i.name))
        );
        const requiredCount = form.inputs.filter((i) => i.required).length;

        if (hasPassword && hasEmail) {
          areas.push({
            area: 'Authentication Form',
            page: page.path,
            priority: 'Critical',
            reason: 'Login/signup form with email and password fields',
            suggestedTestCount: 8,
            categories: ['Positive', 'Negative', 'Edge Case', 'Security'],
          });
        } else if (hasPassword) {
          areas.push({
            area: 'Password Form',
            page: page.path,
            priority: 'Critical',
            reason: 'Form with password field (change password, reset, etc.)',
            suggestedTestCount: 6,
            categories: ['Positive', 'Negative', 'Security'],
          });
        } else if (requiredCount > 0) {
          areas.push({
            area: `Form: ${form.submitButton?.text || 'Submit'}`,
            page: page.path,
            priority: 'High',
            reason: `Form with ${form.inputs.length} fields (${requiredCount} required)`,
            suggestedTestCount: 3 + requiredCount * 2,
            categories: ['Positive', 'Negative', 'Edge Case'],
          });
        } else if (form.inputs.length > 0) {
          areas.push({
            area: `Form: ${form.submitButton?.text || 'Submit'}`,
            page: page.path,
            priority: 'Medium',
            reason: `Form with ${form.inputs.length} fields (no required validation)`,
            suggestedTestCount: 3 + form.inputs.length,
            categories: ['Positive', 'Negative'],
          });
        }
      }

      // Tables -> Medium (data display)
      for (const table of page.tables || []) {
        areas.push({
          area: `Data Table: ${table.ariaLabel || table.headers.join(', ').substring(0, 40)}`,
          page: page.path,
          priority: 'Medium',
          reason: `Table with ${table.rowCount} rows and ${table.headers.length} columns`,
          suggestedTestCount: 4,
          categories: ['Positive', 'Edge Case'],
        });
      }

      // Pages with multiple patterns -> Medium
      const patternCount = Object.values(page.patterns || {}).filter(Boolean).length;
      if (patternCount >= 3) {
        areas.push({
          area: `Feature-rich Page`,
          page: page.path,
          priority: 'Medium',
          reason: `Page with ${patternCount} interactive patterns (search, pagination, etc.)`,
          suggestedTestCount: patternCount * 2,
          categories: ['Positive', 'Negative', 'Edge Case'],
        });
      }
    }

    // CRUD operations coverage
    for (const page of this.pages) {
      if (page.error || !page.crudOperations) continue;

      const crud = page.crudOperations.summary;
      if (crud.isCrudPage) {
        const ops = [];
        if (crud.hasCreate) ops.push('Create');
        if (crud.hasRead) ops.push('Read');
        if (crud.hasUpdate) ops.push('Update');
        if (crud.hasDelete) ops.push('Delete');

        areas.push({
          area: `CRUD Operations (${ops.join('/')})`,
          page: page.path,
          priority: 'High',
          reason: `Page supports ${ops.join(', ')} operations — full CRUD lifecycle testing needed`,
          suggestedTestCount: ops.length * 3,
          categories: ['Positive', 'Negative', 'Edge Case', 'Security'],
        });
      } else {
        // Individual CRUD operations that don't form a full CRUD page
        if (crud.hasCreate && !crud.isCrudPage) {
          areas.push({
            area: 'Create Operation',
            page: page.path,
            priority: 'High',
            reason: `Page has ${page.crudOperations.create.elements.length} create action(s)`,
            suggestedTestCount: 5,
            categories: ['Positive', 'Negative', 'Edge Case'],
          });
        }
        if (crud.hasDelete && !crud.isCrudPage) {
          areas.push({
            area: 'Delete Operation',
            page: page.path,
            priority: 'High',
            reason: `Page has ${page.crudOperations.delete.elements.length} delete action(s) — test confirmation and rollback`,
            suggestedTestCount: 4,
            categories: ['Positive', 'Negative', 'Security'],
          });
        }
      }
    }

    // Navigation coverage
    if (this.pages.length > 1) {
      areas.push({
        area: 'Navigation',
        page: '/*',
        priority: 'High',
        reason: `${this.pages.length} pages discovered - verify all navigation paths`,
        suggestedTestCount: this.pages.length,
        categories: ['Positive'],
      });
    }

    return areas;
  }

  /**
   * Generate Markdown report
   * @param {Object} report - The structured report
   * @returns {string}
   */
  _generateMarkdown(report) {
    const lines = [];
    const { metadata, siteMap, pages, summary } = report;

    // Header
    lines.push('# Site Exploration Report');
    lines.push('');
    lines.push(`**URL**: ${metadata.baseUrl}`);
    lines.push(`**Date**: ${metadata.exploredAt.split('T')[0]}`);
    lines.push(`**Pages Discovered**: ${metadata.totalPages}`);
    lines.push(`**Max Depth Reached**: ${metadata.maxDepthReached}`);
    lines.push(`**Duration**: ${metadata.duration}`);
    lines.push(`**Authentication**: ${metadata.authUsed ? 'Yes' : 'No'}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Pages | ${metadata.totalPages} |`);
    lines.push(`| Total Forms | ${summary.totalForms} |`);
    lines.push(`| Total Buttons | ${summary.totalButtons} |`);
    lines.push(`| Total Links | ${summary.totalLinks} |`);
    lines.push(`| Total Input Fields | ${summary.totalInputFields} |`);
    lines.push(`| Total Interactive Elements | ${summary.totalInteractiveElements} |`);
    lines.push('');

    if (summary.detectedPatterns.length > 0) {
      lines.push(`**Detected Patterns**: ${summary.detectedPatterns.join(', ')}`);
      lines.push('');
    }

    // CRUD Operations Summary
    if (summary.crudPages) {
      const { create, read, update } = summary.crudPages;
      const del = summary.crudPages.delete;
      const hasCrud = create.length > 0 || read.length > 0 || update.length > 0 || del.length > 0;
      if (hasCrud) {
        lines.push('## CRUD Operations Discovered');
        lines.push('');
        lines.push('| Operation | Pages Found | Page Paths |');
        lines.push('|-----------|-------------|------------|');
        lines.push(`| **Create** | ${create.length} | ${create.join(', ') || 'None'} |`);
        lines.push(`| **Read** | ${read.length} | ${read.join(', ') || 'None'} |`);
        lines.push(`| **Update** | ${update.length} | ${update.join(', ') || 'None'} |`);
        lines.push(`| **Delete** | ${del.length} | ${del.join(', ') || 'None'} |`);
        lines.push('');
      }
    }

    // Site Map
    lines.push('## Site Map');
    lines.push('');
    lines.push('| Page | Title | Depth | Links To | Linked From |');
    lines.push('|------|-------|-------|----------|-------------|');
    for (const [pagePath, data] of Object.entries(siteMap)) {
      lines.push(
        `| ${pagePath} | ${data.title} | ${data.depth} | ${data.linksTo.length} pages | ${data.linkedFrom.length} pages |`
      );
    }
    lines.push('');

    // Page Details
    lines.push('## Page Details');
    lines.push('');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      lines.push(`### ${i + 1}. ${page.path} - ${page.title || 'Untitled'}`);
      lines.push('');

      if (page.error) {
        lines.push(`**Error**: ${page.error}`);
        lines.push('');
        continue;
      }

      if (page.screenshotPath) {
        lines.push(`**Screenshot**: ${page.screenshotPath}`);
      }
      lines.push(`**HTTP Status**: ${page.httpStatus || 'N/A'}`);
      lines.push('');

      // Forms
      if (page.forms && page.forms.length > 0) {
        lines.push('**Forms**:');
        for (const form of page.forms) {
          const fieldNames = form.inputs.map((i) => {
            const req = i.required ? '*' : '';
            return `${i.label || i.name || i.type}${req} (${i.type})`;
          });
          lines.push(
            `- ${form.submitButton?.text || 'Form'}: ${fieldNames.join(', ')}`
          );
        }
        lines.push('');
      }

      // Buttons
      if (page.buttons && page.buttons.length > 0) {
        const buttonTexts = page.buttons
          .map((b) => b.text)
          .filter(Boolean)
          .slice(0, 15);
        lines.push(`**Buttons**: ${buttonTexts.join(', ')}`);
        lines.push('');
      }

      // Tables
      if (page.tables && page.tables.length > 0) {
        lines.push('**Tables**:');
        for (const table of page.tables) {
          lines.push(
            `- ${table.ariaLabel || 'Data table'}: ${table.headers.join(', ')} (${table.rowCount} rows)`
          );
        }
        lines.push('');
      }

      // Patterns
      const activePatterns = Object.entries(page.patterns || {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace('has', ''));
      if (activePatterns.length > 0) {
        lines.push(`**Patterns**: ${activePatterns.join(', ')}`);
        lines.push('');
      }

      // CRUD Operations
      if (page.crudOperations && page.crudOperations.summary) {
        const crud = page.crudOperations.summary;
        const ops = [];
        if (crud.hasCreate) ops.push(`Create (${page.crudOperations.create.elements.length})`);
        if (crud.hasRead) ops.push(`Read${page.crudOperations.read.hasDataDisplay ? ' (data listing)' : ` (${page.crudOperations.read.elements.length})`}`);
        if (crud.hasUpdate) ops.push(`Update (${page.crudOperations.update.elements.length})`);
        if (crud.hasDelete) ops.push(`Delete (${page.crudOperations.delete.elements.length})`);
        if (ops.length > 0) {
          lines.push(`**CRUD Operations**: ${ops.join(', ')}${crud.isCrudPage ? ' — **Full CRUD Page**' : ''}`);
          lines.push('');
        }
      }

      // Headings
      if (page.headings && page.headings.length > 0) {
        const headingList = page.headings
          .slice(0, 10)
          .map((h) => `${'#'.repeat(h.level)} ${h.text}`)
          .join(', ');
        lines.push(`**Headings**: ${headingList}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Suggested Test Areas
    lines.push('## Suggested Test Areas');
    lines.push('');
    lines.push('| Priority | Area | Page | Reason | Est. Tests | Categories |');
    lines.push('|----------|------|------|--------|------------|------------|');
    for (const area of summary.suggestedTestAreas) {
      lines.push(
        `| ${area.priority} | ${area.area} | ${area.page} | ${area.reason} | ${area.suggestedTestCount} | ${area.categories.join(', ')} |`
      );
    }
    lines.push('');

    // Errors
    if (summary.pagesWithErrors && summary.pagesWithErrors.length > 0) {
      lines.push('## Pages with Errors');
      lines.push('');
      for (const errPage of summary.pagesWithErrors) {
        lines.push(`- **${errPage.path}**: ${errPage.error}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format milliseconds into human-readable duration
   * @param {number} ms
   * @returns {string}
   */
  _formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }
}

module.exports = { ReportGenerator };
