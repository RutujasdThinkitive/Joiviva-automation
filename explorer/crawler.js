const path = require('path');
const fs = require('fs');
const { PageAnalyzer } = require('./page-analyzer');

/**
 * Crawler - BFS crawling engine that discovers pages, follows links,
 * takes screenshots, and builds a complete site map.
 * Supports both standard and hash-based SPA routing (Angular, etc.).
 */
class Crawler {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config - Explorer configuration
   */
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.visited = new Set();
    this.results = [];
    this.baseOrigin = null;
    this.isHashRouting = false;
    this.basePathname = '/';
  }

  /**
   * Start crawling from the given URL
   * @param {string} startUrl - URL to begin crawling from
   * @returns {Promise<Array>} Array of page analysis results
   */
  async crawl(startUrl) {
    const parsedStart = new URL(startUrl);
    this.baseOrigin = parsedStart.origin;

    // Detect hash-based routing
    this.isHashRouting = /^#\//.test(parsedStart.hash);
    if (this.isHashRouting) {
      this.basePathname = parsedStart.pathname;
      console.log(`[Crawler] Detected hash-based routing (SPA mode). Base path: ${this.basePathname}`);
    }

    // Dismiss any unexpected dialogs
    this.page.on('dialog', async (dialog) => {
      console.log(`[Crawler] Dialog dismissed: ${dialog.type()} - "${dialog.message()}"`);
      await dialog.dismiss();
    });

    const normalizedStart = this._normalizeUrl(startUrl);

    console.log(`[Crawler] Starting crawl from ${startUrl}`);
    console.log(`[Crawler] Max depth: ${this.config.maxDepth}, Max pages: ${this.config.maxPages}`);

    // Step 1: Analyze the current page (already navigated after login)
    const firstPageData = await this._analyzeCurrentPage(normalizedStart, 0);
    if (firstPageData) {
      this.visited.add(normalizedStart);
      this.results.push(firstPageData);
    }

    // Step 2: Discover navigation items by clicking sidebar/menu elements
    if (this.isHashRouting) {
      console.log(`[Crawler] Discovering SPA navigation items...`);
      const navLinks = await this._discoverSpaNavigation();
      console.log(`[Crawler] Found ${navLinks.length} navigation links via SPA discovery.`);

      // BFS queue from discovered links
      const queue = navLinks
        .filter((link) => !this.visited.has(link))
        .map((url) => ({ url, depth: 1 }));

      // Also add any standard <a href> links found on the first page
      if (firstPageData) {
        const standardLinks = this._extractCrawlableLinks(firstPageData);
        for (const link of standardLinks) {
          if (!this.visited.has(link) && !queue.some((q) => q.url === link)) {
            queue.push({ url: link, depth: 1 });
          }
        }
      }

      // BFS crawl
      while (queue.length > 0 && this.results.length < this.config.maxPages) {
        const { url, depth } = queue.shift();

        if (this.visited.has(url)) continue;
        if (depth > this.config.maxDepth) continue;
        if (this._shouldIgnoreUrl(url)) continue;

        this.visited.add(url);

        const pageData = await this._visitSpaPage(url, depth);
        if (!pageData) continue;

        this.results.push(pageData);

        // Enqueue discovered links from this page
        if (depth < this.config.maxDepth) {
          const newLinks = this._extractCrawlableLinks(pageData);
          // Also discover SPA nav from this page
          const spaLinks = await this._discoverSpaNavigation();
          for (const link of [...newLinks, ...spaLinks]) {
            if (!this.visited.has(link) && !queue.some((q) => q.url === link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
    } else {
      // Standard BFS crawl for non-hash-routing apps
      const queue = [];
      if (firstPageData) {
        const links = this._extractCrawlableLinks(firstPageData);
        for (const link of links) {
          if (!this.visited.has(link)) {
            queue.push({ url: link, depth: 1 });
          }
        }
      }

      while (queue.length > 0 && this.results.length < this.config.maxPages) {
        const { url, depth } = queue.shift();

        if (this.visited.has(url)) continue;
        if (depth > this.config.maxDepth) continue;
        if (this._shouldIgnoreUrl(url)) continue;

        this.visited.add(url);

        const pageData = await this._visitPage(url, depth);
        if (!pageData) continue;

        this.results.push(pageData);

        if (depth < this.config.maxDepth) {
          const newLinks = this._extractCrawlableLinks(pageData);
          for (const link of newLinks) {
            if (!this.visited.has(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
    }

    console.log(`[Crawler] Crawl complete. Visited ${this.results.length} pages.`);
    return this.results;
  }

  /**
   * Analyze the current page without navigating (used for first page after login)
   * @param {string} url - The expected URL
   * @param {number} depth
   * @returns {Promise<Object|null>}
   */
  async _analyzeCurrentPage(url, depth) {
    const pageNum = this.results.length + 1;
    console.log(`[Crawler] [${pageNum}/${this.config.maxPages}] Analyzing current page (depth ${depth}): ${this.page.url()}`);

    try {
      await this.page.waitForLoadState('domcontentloaded');
      if (this.config.screenshotDelay > 0) {
        await this.page.waitForTimeout(this.config.screenshotDelay);
      }

      const analyzer = new PageAnalyzer(this.page);
      const pageData = await analyzer.analyze();

      const screenshotPath = await this._takeScreenshot(pageData.path);
      pageData.screenshotPath = screenshotPath;
      pageData.depth = depth;
      pageData.httpStatus = 200;

      console.log(
        `[Crawler] Found: ${pageData.links.length} links, ` +
        `${pageData.buttons.length} buttons, ${pageData.forms.length} forms`
      );

      // Log CRUD operations if detected
      if (pageData.crudOperations && pageData.crudOperations.summary) {
        const crud = pageData.crudOperations.summary;
        const ops = [];
        if (crud.hasCreate) ops.push('Create');
        if (crud.hasRead) ops.push('Read');
        if (crud.hasUpdate) ops.push('Update');
        if (crud.hasDelete) ops.push('Delete');
        if (ops.length > 0) {
          console.log(`[Crawler] CRUD: ${ops.join(', ')}${crud.isCrudPage ? ' (Full CRUD page)' : ''}`);
        }
      }

      return pageData;
    } catch (error) {
      console.log(`[Crawler] Error analyzing current page: ${error.message}`);
      return null;
    }
  }

  /**
   * Navigate to a hash-based SPA page by changing the hash fragment.
   * This avoids a full page reload that would lose SPA state.
   * @param {string} url - Target URL with hash route
   * @param {number} depth
   * @returns {Promise<Object|null>}
   */
  async _visitSpaPage(url, depth) {
    const pageNum = this.results.length + 1;
    console.log(`[Crawler] [${pageNum}/${this.config.maxPages}] SPA navigating (depth ${depth}): ${url}`);

    try {
      const parsed = new URL(url);
      const targetHash = parsed.hash || '';

      // Navigate by changing the hash (avoids full reload)
      await this.page.evaluate((hash) => {
        window.location.hash = hash;
      }, targetHash);

      // Wait for Angular/SPA to process the route change
      await this.page.waitForTimeout(2000);
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Check if we got redirected (e.g., back to login)
      const currentUrl = this.page.url();
      if (this.isHashRouting) {
        const currentHash = new URL(currentUrl).hash;
        if (/login|signin/i.test(currentHash) && !/login|signin/i.test(targetHash)) {
          console.log(`[Crawler] Redirected to login from ${url}, skipping.`);
          return null;
        }
      }

      if (this.config.screenshotDelay > 0) {
        await this.page.waitForTimeout(this.config.screenshotDelay);
      }

      const analyzer = new PageAnalyzer(this.page);
      const pageData = await analyzer.analyze();

      const screenshotPath = await this._takeScreenshot(pageData.path);
      pageData.screenshotPath = screenshotPath;
      pageData.depth = depth;
      pageData.httpStatus = 200;

      console.log(
        `[Crawler] Found: ${pageData.links.length} links, ` +
        `${pageData.buttons.length} buttons, ${pageData.forms.length} forms`
      );

      // Log CRUD operations if detected
      if (pageData.crudOperations && pageData.crudOperations.summary) {
        const crud = pageData.crudOperations.summary;
        const ops = [];
        if (crud.hasCreate) ops.push('Create');
        if (crud.hasRead) ops.push('Read');
        if (crud.hasUpdate) ops.push('Update');
        if (crud.hasDelete) ops.push('Delete');
        if (ops.length > 0) {
          console.log(`[Crawler] CRUD: ${ops.join(', ')}${crud.isCrudPage ? ' (Full CRUD page)' : ''}`);
        }
      }

      return pageData;
    } catch (error) {
      console.log(`[Crawler] Error visiting SPA page ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Discover navigation links in an SPA by finding sidebar/menu items.
   * Extracts href from <a> elements inside nav, sidebar, and menu containers.
   * Also finds elements with routerLink (Angular) attributes.
   * @returns {Promise<string[]>} Array of normalized URLs
   */
  async _discoverSpaNavigation() {
    try {
      const hrefs = await this.page.evaluate(() => {
        const links = new Set();

        // Selectors for navigation containers
        const navContainers = document.querySelectorAll(
          'nav, [role="navigation"], .sidebar, .side-nav, .sidenav, .side-menu, ' +
          '.nav-menu, .main-nav, .app-sidebar, .left-sidebar, .menu, ' +
          '[class*="sidebar"], [class*="sidenav"], [class*="nav-menu"], ' +
          '[class*="side-nav"], [class*="left-nav"], [class*="main-menu"], ' +
          'aside, .mat-sidenav, .mat-nav-list, mat-sidenav, mat-nav-list, ' +
          '.ant-menu, .ant-layout-sider, ul.nav, .navbar'
        );

        // Extract hrefs from anchors inside navigation containers
        navContainers.forEach((container) => {
          const anchors = container.querySelectorAll('a[href]');
          anchors.forEach((a) => {
            if (a.href && !a.href.startsWith('javascript:')) {
              links.add(a.href);
            }
          });

          // Also look for Angular routerLink attributes
          const routerLinks = container.querySelectorAll('[routerLink], [routerlink], [ng-href]');
          routerLinks.forEach((el) => {
            const route = el.getAttribute('routerLink') || el.getAttribute('routerlink') || el.getAttribute('ng-href');
            if (route) {
              // Convert relative route to absolute URL
              const base = window.location.origin + window.location.pathname;
              try {
                if (route.startsWith('/')) {
                  links.add(base + '#' + route);
                } else if (route.startsWith('#')) {
                  links.add(base + route);
                }
              } catch {
                // Invalid URL
              }
            }
          });
        });

        // Also check all <a> elements on the page with hash-based hrefs
        const allAnchors = document.querySelectorAll('a[href*="#/"]');
        allAnchors.forEach((a) => {
          if (a.href && !a.href.startsWith('javascript:')) {
            links.add(a.href);
          }
        });

        return [...links];
      });

      // Normalize and filter
      const normalizedLinks = [];
      for (const href of hrefs) {
        try {
          const normalized = this._normalizeUrl(href);
          if (
            normalized &&
            !this.visited.has(normalized) &&
            !this._shouldIgnoreUrl(normalized) &&
            this._isSameDomain(normalized)
          ) {
            normalizedLinks.push(normalized);
          }
        } catch {
          // Skip invalid URLs
        }
      }

      return [...new Set(normalizedLinks)];
    } catch (error) {
      console.log(`[Crawler] Error discovering SPA navigation: ${error.message}`);
      return [];
    }
  }

  /**
   * Visit a single page via full navigation (for non-SPA sites)
   * @param {string} url
   * @param {number} depth
   * @returns {Promise<Object|null>}
   */
  async _visitPage(url, depth) {
    const pageNum = this.results.length + 1;
    console.log(`[Crawler] [${pageNum}/${this.config.maxPages}] Visiting (depth ${depth}): ${url}`);

    try {
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.pageTimeout,
      });

      if (!response) {
        console.log(`[Crawler] No response for ${url}, skipping.`);
        return null;
      }

      const status = response.status();
      if (status >= 400) {
        console.log(`[Crawler] HTTP ${status} for ${url}, recording but not crawling further.`);
        const parsedUrl = new URL(url);
        return {
          url,
          path: parsedUrl.hash && /^#\//.test(parsedUrl.hash) ? parsedUrl.hash.substring(1) : parsedUrl.pathname,
          title: await this.page.title(),
          httpStatus: status,
          depth,
          error: `HTTP ${status}`,
          links: [],
          buttons: [],
          forms: [],
          tables: [],
          interactiveElements: [],
          headings: [],
          landmarks: [],
          patterns: {},
          screenshotPath: null,
          timestamp: new Date().toISOString(),
        };
      }

      await this.page.waitForLoadState('domcontentloaded');
      if (this.config.screenshotDelay > 0) {
        await this.page.waitForTimeout(this.config.screenshotDelay);
      }

      // Check if we got redirected
      const finalUrl = this._normalizeUrl(this.page.url());
      if (finalUrl !== url && this.visited.has(finalUrl)) {
        console.log(`[Crawler] Redirected to already-visited ${finalUrl}, skipping.`);
        return null;
      }
      if (finalUrl !== url) {
        this.visited.add(finalUrl);
      }

      const analyzer = new PageAnalyzer(this.page);
      const pageData = await analyzer.analyze();

      const screenshotPath = await this._takeScreenshot(pageData.path);
      pageData.screenshotPath = screenshotPath;
      pageData.depth = depth;
      pageData.httpStatus = status;

      console.log(
        `[Crawler] Found: ${pageData.links.length} links, ` +
        `${pageData.buttons.length} buttons, ${pageData.forms.length} forms`
      );

      // Log CRUD operations if detected
      if (pageData.crudOperations && pageData.crudOperations.summary) {
        const crud = pageData.crudOperations.summary;
        const ops = [];
        if (crud.hasCreate) ops.push('Create');
        if (crud.hasRead) ops.push('Read');
        if (crud.hasUpdate) ops.push('Update');
        if (crud.hasDelete) ops.push('Delete');
        if (ops.length > 0) {
          console.log(`[Crawler] CRUD: ${ops.join(', ')}${crud.isCrudPage ? ' (Full CRUD page)' : ''}`);
        }
      }

      return pageData;
    } catch (error) {
      console.log(`[Crawler] Error visiting ${url}: ${error.message}`);
      const parsedUrl = new URL(url);
      return {
        url,
        path: parsedUrl.hash && /^#\//.test(parsedUrl.hash) ? parsedUrl.hash.substring(1) : parsedUrl.pathname,
        title: null,
        depth,
        error: error.message,
        httpStatus: null,
        links: [],
        buttons: [],
        forms: [],
        tables: [],
        interactiveElements: [],
        headings: [],
        landmarks: [],
        patterns: {},
        screenshotPath: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Take a full-page screenshot
   * @param {string} pagePath - The URL path (used for filename)
   * @returns {Promise<string|null>} Screenshot file path
   */
  async _takeScreenshot(pagePath) {
    try {
      const safeName = pagePath
        .replace(/^\//, '')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '_') || 'home';

      const filename = `${safeName}.png`;
      const screenshotDir = path.resolve(this.config.screenshotDir);

      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const filepath = path.join(screenshotDir, filename);
      await this.page.screenshot({ path: filepath, fullPage: true });
      return filepath;
    } catch (error) {
      console.log(`[Crawler] Screenshot failed for ${pagePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract crawlable links from page data
   * @param {Object} pageData - Analyzed page data
   * @returns {string[]} Array of normalized URLs to crawl
   */
  _extractCrawlableLinks(pageData) {
    const links = [];
    for (const link of pageData.links) {
      try {
        const normalized = this._normalizeUrl(link.href);
        if (
          normalized &&
          !this.visited.has(normalized) &&
          !this._shouldIgnoreUrl(normalized) &&
          this._isSameDomain(normalized)
        ) {
          links.push(normalized);
        }
      } catch {
        // Invalid URL, skip
      }
    }
    return [...new Set(links)];
  }

  /**
   * Normalize a URL for deduplication.
   * Preserves hash fragments that look like routes (e.g. #/dashboard)
   * since many SPAs (Angular, etc.) use hash-based routing.
   * @param {string} url
   * @returns {string}
   */
  _normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Preserve hash-based routes (e.g. #/login, #/dashboard)
      if (parsed.hash && /^#\//.test(parsed.hash)) {
        // Hash-based route — keep it but remove trailing slash from hash
        let hash = parsed.hash;
        if (hash.length > 2 && hash.endsWith('/')) {
          hash = hash.slice(0, -1);
        }
        // Keep pathname as-is (preserve trailing slash for SPA base paths)
        const pathname = parsed.pathname;
        parsed.hash = '';
        parsed.searchParams.sort();
        // Rebuild: origin + pathname + search + hash
        return parsed.origin + pathname + parsed.search + hash;
      }
      // Non-route hash — strip it
      parsed.hash = '';
      if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.slice(0, -1);
      }
      parsed.searchParams.sort();
      return parsed.href;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL belongs to the same domain
   * @param {string} url
   * @returns {boolean}
   */
  _isSameDomain(url) {
    if (!this.config.sameDomainOnly) return true;
    try {
      return new URL(url).origin === this.baseOrigin;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL matches any ignore pattern
   * @param {string} url
   * @returns {boolean}
   */
  _shouldIgnoreUrl(url) {
    return this.config.ignorePatterns.some((pattern) => pattern.test(url));
  }
}

module.exports = { Crawler };
