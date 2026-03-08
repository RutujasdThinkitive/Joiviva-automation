/**
 * Generates a simple HTML test report from Playwright JSON output.
 * Usage: node utils/generate-report.js test-results.json
 */
const fs = require('fs');
const path = require('path');

const jsonFile = process.argv[2] || 'test-results.json';

if (!fs.existsSync(jsonFile)) {
  console.error(`File not found: ${jsonFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

// ─── Extract test cases from suites ─────────────────────────────────────────
function extractTests(suites, specFile = '') {
  const tests = [];
  for (const suite of suites) {
    const file = suite.file || specFile;
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          const result = test.results?.[test.results.length - 1];
          tests.push({
            name: spec.title,
            file: path.basename(file),
            status: result?.status || test.status || 'unknown',
            duration: result?.duration || 0,
            error: result?.error?.message || '',
          });
        }
      }
    }
    if (suite.suites) {
      tests.push(...extractTests(suite.suites, file));
    }
  }
  return tests;
}

const tests = extractTests(data.suites || []);

// ─── Counts ─────────────────────────────────────────────────────────────────
const passed = tests.filter(t => t.status === 'expected' || t.status === 'passed').length;
const failed = tests.filter(t => t.status === 'unexpected' || t.status === 'failed').length;
const skipped = tests.filter(t => t.status === 'skipped').length;
const total = tests.length;
const duration = data.stats?.duration ? (data.stats.duration / 1000).toFixed(1) : '0';
const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
const runDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

// ─── Status helpers ─────────────────────────────────────────────────────────
function statusBadge(status) {
  if (status === 'expected' || status === 'passed') return '<span class="badge pass">PASSED</span>';
  if (status === 'unexpected' || status === 'failed') return '<span class="badge fail">FAILED</span>';
  if (status === 'skipped') return '<span class="badge skip">SKIPPED</span>';
  return `<span class="badge skip">${status.toUpperCase()}</span>`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Build test rows ────────────────────────────────────────────────────────
const testRows = tests.map((t, i) => `
  <tr>
    <td>${i + 1}</td>
    <td>${t.file}</td>
    <td>${t.name}</td>
    <td>${statusBadge(t.status)}</td>
    <td>${formatDuration(t.duration)}</td>
    <td class="error-cell">${t.error ? `<details><summary>View</summary><pre>${t.error.replace(/</g, '&lt;')}</pre></details>` : '-'}</td>
  </tr>
`).join('');

// ─── HTML Report ────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Joiviva QA - E2E Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }

    /* Header */
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #333; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #fff; margin-bottom: 5px; }
    .header .subtitle { color: #888; font-size: 14px; }

    /* Summary Cards */
    .summary { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px; }
    .card { background: #16213e; border-radius: 12px; padding: 20px 30px; text-align: center; min-width: 140px; border: 1px solid #333; }
    .card .count { font-size: 36px; font-weight: 700; }
    .card .label { font-size: 12px; text-transform: uppercase; color: #888; margin-top: 5px; letter-spacing: 1px; }
    .card.total .count { color: #7c83ff; }
    .card.pass .count { color: #4caf50; }
    .card.fail .count { color: #f44336; }
    .card.skip .count { color: #ff9800; }
    .card.time .count { color: #00bcd4; font-size: 28px; }
    .card.rate .count { color: ${parseFloat(successRate) >= 80 ? '#4caf50' : parseFloat(successRate) >= 50 ? '#ff9800' : '#f44336'}; }

    /* Table */
    .table-container { background: #16213e; border-radius: 12px; overflow: hidden; border: 1px solid #333; }
    .table-header { padding: 15px 20px; background: #0f3460; font-size: 16px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a40; padding: 12px 15px; text-align: left; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
    td { padding: 12px 15px; border-top: 1px solid #2a2a4a; font-size: 14px; }
    tr:hover { background: #1e2a4a; }

    /* Badges */
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .badge.pass { background: #1b5e20; color: #a5d6a7; }
    .badge.fail { background: #b71c1c; color: #ef9a9a; }
    .badge.skip { background: #e65100; color: #ffcc80; }

    /* Error */
    .error-cell details summary { cursor: pointer; color: #f44336; font-size: 12px; }
    .error-cell pre { margin-top: 8px; padding: 10px; background: #0d1117; border-radius: 6px; font-size: 11px; overflow-x: auto; color: #f88; white-space: pre-wrap; max-height: 200px; }

    /* Footer */
    .footer { text-align: center; padding: 20px 0; color: #555; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Joiviva QA - E2E Test Report</h1>
      <div class="subtitle">Run Date: ${runDate} IST</div>
    </div>

    <div class="summary">
      <div class="card total"><div class="count">${total}</div><div class="label">Total Tests</div></div>
      <div class="card pass"><div class="count">${passed}</div><div class="label">Passed</div></div>
      <div class="card fail"><div class="count">${failed}</div><div class="label">Failed</div></div>
      <div class="card skip"><div class="count">${skipped}</div><div class="label">Skipped</div></div>
      <div class="card time"><div class="count">${duration}s</div><div class="label">Duration</div></div>
      <div class="card rate"><div class="count">${successRate}%</div><div class="label">Success Rate</div></div>
    </div>

    <div class="table-container">
      <div class="table-header">Test Case Details</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Spec File</th>
            <th>Test Case Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${testRows || '<tr><td colspan="6" style="text-align:center;padding:30px;color:#888;">No test results found</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="footer">Generated by Joiviva QA Automation</div>
  </div>
</body>
</html>`;

// ─── Write report ───────────────────────────────────────────────────────────
const outputDir = 'test-report';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
console.log(`Report generated: ${outputDir}/index.html`);
console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped} | Duration: ${duration}s`);