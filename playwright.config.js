// @ts-check
require('dotenv').config();
const path = require('path');

const { defineConfig, devices } = require('@playwright/test');

const ADMIN_AUTH_FILE = path.join(__dirname, '.auth/admin.json');
const PROVIDER_AUTH_FILE = path.join(__dirname, '.auth/provider.json');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://portal.qa.joiviva.org',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // --- Auth Setup (runs once, saves session) ---
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
      testDir: './fixtures',
    },

    // --- Chromium with Admin auth ---
    {
      name: 'chromium-admin',
      testMatch: /admin-.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_AUTH_FILE,
      },
      dependencies: ['setup'],
    },

    // --- Chromium with Provider auth ---
    {
      name: 'chromium-provider',
      testMatch: /provider-.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: PROVIDER_AUTH_FILE,
      },
      dependencies: ['setup'],
    },

    // --- Chromium for login tests (no pre-auth) ---
    {
      name: 'chromium-login',
      testMatch: /login-.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // --- Default chromium (general tests, no pre-auth) ---
    {
      name: 'chromium',
      testIgnore: /\b(admin|provider|login)-.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // --- Multi-browser (regression) ---
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // --- API tests ---
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
      use: {
        baseURL: process.env.API_BASE_URL || 'https://portal.qa.joiviva.org',
      },
    },
  ],
});
