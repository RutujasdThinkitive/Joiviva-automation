require('dotenv').config();

/**
 * Explorer Configuration
 * Defaults can be overridden via CLI arguments or environment variables.
 */

const DEFAULT_CONFIG = {
  // Crawling limits
  maxDepth: 3,
  maxPages: 50,
  pageTimeout: 30000,
  screenshotDelay: 1000,

  // Browser settings
  headless: false,
  viewport: { width: 1920, height: 1080 },

  // Crawling behavior
  sameDomainOnly: true,
  ignorePatterns: [
    /logout/i,
    /signout/i,
    /sign-out/i,
    /delete/i,
    /remove/i,
    /\.pdf$/,
    /\.zip$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /#$/,
    /mailto:/i,
    /tel:/i,
    /javascript:/i,
  ],
  ignoreSelectors: [
    '[data-testid*="delete"]',
    '[data-testid*="remove"]',
    'button[type="reset"]',
  ],

  // Authentication
  url: null,
  email: null,
  password: null,
  loginPath: null,

  // Output
  screenshotDir: 'explorer/screenshots',
  outputDir: null,
};

/**
 * Parse CLI arguments from process.argv
 * Supports --key value and --key=value formats
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      const key = arg.substring(2, eqIndex);
      args[key] = arg.substring(eqIndex + 1);
    } else {
      const key = arg.substring(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

/**
 * Build final configuration by merging defaults, env vars, and CLI args.
 * CLI args take highest priority.
 * @returns {Object} Merged configuration
 */
function buildConfig() {
  const args = parseArgs();

  const config = { ...DEFAULT_CONFIG };

  // Environment variable overrides
  if (process.env.BASE_URL) config.url = process.env.BASE_URL;
  if (process.env.TEST_USER_EMAIL) config.email = process.env.TEST_USER_EMAIL;
  if (process.env.TEST_USER_PASSWORD) config.password = process.env.TEST_USER_PASSWORD;

  // CLI argument overrides
  if (args.url) config.url = args.url;
  if (args.email) config.email = args.email;
  if (args.password) config.password = args.password;
  if (args['login-path']) config.loginPath = args['login-path'];
  if (args['max-depth']) config.maxDepth = parseInt(args['max-depth'], 10);
  if (args['max-pages']) config.maxPages = parseInt(args['max-pages'], 10);
  if (args['page-timeout']) config.pageTimeout = parseInt(args['page-timeout'], 10);
  if (args.headless) config.headless = args.headless === 'true' || args.headless === true;
  if (args['output-dir']) config.outputDir = args['output-dir'];

  return config;
}

module.exports = { DEFAULT_CONFIG, parseArgs, buildConfig };
