#!/usr/bin/env node

/**
 * Site Explorer - Main entry point
 *
 * Launches a headed Chrome browser, optionally logs in,
 * crawls the site, analyzes pages, and generates reports.
 *
 * Usage:
 *   node explorer/site-explorer.js --url https://myapp.com --email user@test.com --password Pass123!
 *   node explorer/site-explorer.js --url https://myapp.com --max-depth 2 --max-pages 20
 */

const path = require('path');
const { chromium } = require('@playwright/test');
const { buildConfig } = require('./config');
const { LoginHandler } = require('./login-handler');
const { Crawler } = require('./crawler');
const { ReportGenerator } = require('./report-generator');

async function main() {
  const config = buildConfig();

  // Validate required args
  if (!config.url) {
    console.error('Error: --url is required.');
    console.error('');
    console.error('Usage:');
    console.error('  node explorer/site-explorer.js --url https://myapp.com');
    console.error('  node explorer/site-explorer.js --url https://myapp.com --email user@test.com --password Pass123!');
    console.error('');
    console.error('Options:');
    console.error('  --url           Application URL (required)');
    console.error('  --email         Login email/username');
    console.error('  --password      Login password');
    console.error('  --login-path    Path to login page (e.g., /login)');
    console.error('  --max-depth     Max crawl depth (default: 3)');
    console.error('  --max-pages     Max pages to visit (default: 50)');
    console.error('  --headless      Run headless (default: false)');
    console.error('  --output-dir    Output directory for reports');
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('    BMAD QA - Site Explorer');
  console.log('========================================');
  console.log(`  URL:        ${config.url}`);
  console.log(`  Auth:       ${config.email ? 'Yes' : 'No'}`);
  console.log(`  Max Depth:  ${config.maxDepth}`);
  console.log(`  Max Pages:  ${config.maxPages}`);
  console.log(`  Headless:   ${config.headless}`);
  console.log('========================================');
  console.log('');

  const startTime = Date.now();

  // Launch browser
  console.log('[Explorer] Launching browser...');
  const browser = await chromium.launch({
    headless: config.headless,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: config.viewport,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  let startUrl = config.url;

  try {
    const outputDir = config.outputDir
      || path.resolve(__dirname, '../../outputs/automation-agent');

    // Step 1: Login (if credentials provided)
    if (config.email && config.password) {
      console.log('[Explorer] Step 1: Authenticating...');
      const loginHandler = new LoginHandler(page, config);
      const loginResult = await loginHandler.login();

      if (!loginResult.success) {
        // LOGIN FAILED → Save failure report with screenshot, then STOP
        console.error('');
        console.error('========================================');
        console.error('    LOGIN FAILED - Exploration Stopped');
        console.error('========================================');
        console.error(`  Error:       ${loginResult.error}`);
        console.error(`  URL:         ${loginResult.landingUrl}`);
        if (loginResult.screenshotPath) {
          console.error(`  Screenshot:  ${loginResult.screenshotPath}`);
        }
        console.error('========================================');

        // Save a failure report so the agent can read it
        const fs = require('fs');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const failureReport = {
          status: 'FAILED',
          reason: 'LOGIN_FAILED',
          metadata: {
            baseUrl: config.url,
            attemptedAt: new Date().toISOString(),
            error: loginResult.error,
            landingUrl: loginResult.landingUrl,
            screenshotPath: loginResult.screenshotPath,
          },
          networkLogs: loginResult.networkLogs || [],
          consoleLogs: loginResult.consoleLogs || [],
          recommendation: 'Please verify credentials and try again. Use --login-path if the login page is not auto-detected.',
        };

        const jsonPath = path.join(outputDir, 'exploration-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(failureReport, null, 2));

        // Build network logs markdown section
        const networkLogLines = [];
        if (loginResult.networkLogs && loginResult.networkLogs.length > 0) {
          networkLogLines.push('## Backend / Network Logs');
          networkLogLines.push('');
          networkLogLines.push('API requests captured during the login attempt:');
          networkLogLines.push('');
          networkLogLines.push('| Time | Method | URL | Status | Type |');
          networkLogLines.push('|------|--------|-----|--------|------|');
          for (const log of loginResult.networkLogs) {
            const time = log.timestamp.split('T')[1].split('.')[0];
            const shortUrl = log.url.length > 80 ? log.url.substring(0, 80) + '...' : log.url;
            networkLogLines.push(`| ${time} | ${log.method} | ${shortUrl} | ${log.status} ${log.statusText} | ${log.resourceType} |`);
          }
          networkLogLines.push('');

          // Show detailed response bodies for failed/auth requests
          const detailedLogs = loginResult.networkLogs.filter((l) => l.responseBody);
          if (detailedLogs.length > 0) {
            networkLogLines.push('### Response Details');
            networkLogLines.push('');
            for (const log of detailedLogs) {
              networkLogLines.push(`**${log.method} ${log.url}** — ${log.status} ${log.statusText}`);
              if (log.requestBody) {
                networkLogLines.push('');
                networkLogLines.push('Request body:');
                networkLogLines.push('```json');
                networkLogLines.push(log.requestBody);
                networkLogLines.push('```');
              }
              networkLogLines.push('');
              networkLogLines.push('Response body:');
              networkLogLines.push('```json');
              networkLogLines.push(log.responseJson ? JSON.stringify(log.responseJson, null, 2) : log.responseBody);
              networkLogLines.push('```');
              networkLogLines.push('');
            }
          }
        }

        // Build console logs markdown section
        const consoleLogLines = [];
        if (loginResult.consoleLogs && loginResult.consoleLogs.length > 0) {
          consoleLogLines.push('## Browser Console Errors');
          consoleLogLines.push('');
          for (const log of loginResult.consoleLogs) {
            const time = log.timestamp.split('T')[1].split('.')[0];
            consoleLogLines.push(`- **[${time}] ${log.type}**: ${log.text}`);
          }
          consoleLogLines.push('');
        }

        const mdContent = [
          '# Site Exploration Report - FAILED',
          '',
          `**URL**: ${config.url}`,
          `**Date**: ${new Date().toISOString().split('T')[0]}`,
          `**Status**: LOGIN FAILED`,
          '',
          '## Error',
          '',
          loginResult.error,
          '',
          '## Screenshot',
          '',
          loginResult.screenshotPath
            ? `![Login Failure](${loginResult.screenshotPath})`
            : 'No screenshot captured.',
          '',
          ...networkLogLines,
          ...consoleLogLines,
          '## Recommendation',
          '',
          '1. Verify that the email and password are correct',
          '2. Try providing `--login-path /your-login-page` if the login page was not auto-detected',
          '3. Check if the app uses OAuth/SSO (not supported by auto-login)',
          '4. Ensure the application is running and accessible',
          '5. Review the network logs above for API error responses or blocked requests',
          '',
        ].join('\n');

        const mdPath = path.join(outputDir, 'exploration-report.md');
        fs.writeFileSync(mdPath, mdContent);

        // Print network log summary to console
        if (loginResult.networkLogs && loginResult.networkLogs.length > 0) {
          console.error('');
          console.error('  Backend/Network Logs:');
          for (const log of loginResult.networkLogs) {
            const statusIcon = log.status >= 400 ? 'X' : '-';
            console.error(`    ${statusIcon} ${log.method} ${log.status} ${log.url}`);
            if (log.responseJson) {
              const msg = log.responseJson.message || log.responseJson.error || log.responseJson.detail;
              if (msg) console.error(`      Response: ${msg}`);
            }
          }
        }

        if (loginResult.consoleLogs && loginResult.consoleLogs.length > 0) {
          console.error('');
          console.error('  Browser Console Errors:');
          for (const log of loginResult.consoleLogs) {
            console.error(`    [${log.type}] ${log.text}`);
          }
        }

        console.error('');
        console.error(`  Failure report: ${jsonPath}`);
        console.error(`  Failure report: ${mdPath}`);
        console.error('');
        console.error('Fix the credentials and re-run the explorer.');

        await browser.close();
        process.exit(1);
      }

      startUrl = loginResult.landingUrl;
      console.log(`[Explorer] Authentication successful. Starting from: ${startUrl}`);
    } else {
      console.log('[Explorer] Step 1: No credentials provided, skipping authentication.');
      await page.goto(config.url, { waitUntil: 'networkidle', timeout: config.pageTimeout });
      startUrl = page.url();
    }

    // Step 2: Crawl
    console.log('');
    console.log('[Explorer] Step 2: Crawling application...');
    const crawler = new Crawler(page, config);
    const pages = await crawler.crawl(startUrl);

    // Step 3: Generate reports
    console.log('');
    console.log('[Explorer] Step 3: Generating reports...');
    const endTime = Date.now();

    const reportGenerator = new ReportGenerator(pages, config, {
      startTime,
      endTime,
    });

    const { jsonPath, mdPath } = reportGenerator.generate(outputDir);

    // Print summary
    console.log('');
    console.log('========================================');
    console.log('    Exploration Complete!');
    console.log('========================================');
    console.log(`  Pages Discovered:  ${pages.length}`);
    console.log(`  Duration:          ${formatDuration(endTime - startTime)}`);
    console.log(`  Screenshots:       ${config.screenshotDir}/`);
    console.log(`  JSON Report:       ${jsonPath}`);
    console.log(`  Markdown Report:   ${mdPath}`);
    console.log('========================================');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the exploration report');
    console.log('  2. Use the Automation Agent to generate test cases from the report');
    console.log('  3. Review and approve test cases');
    console.log('  4. Generate automation scripts');
    console.log('');
  } catch (error) {
    console.error(`[Explorer] Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

main();
