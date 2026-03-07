/**
 * Helper utilities for Playwright tests
 */

/**
 * Wait for API response after an action
 * @param {import('@playwright/test').Page} page
 * @param {string} urlPattern - URL pattern to wait for
 * @param {Function} action - Action that triggers the API call
 * @returns {Promise<import('@playwright/test').Response>}
 */
async function waitForApiResponse(page, urlPattern, action) {
  const [response] = await Promise.all([
    page.waitForResponse((resp) => resp.url().includes(urlPattern)),
    action(),
  ]);
  return response;
}

/**
 * Get auth headers for API requests
 * @returns {Object} Headers with Bearer token
 */
function getAuthHeaders() {
  return {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Generate a unique string for test data
 * @param {string} prefix
 * @returns {string}
 */
function uniqueId(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Retry an async function with delay
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 */
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = { waitForApiResponse, getAuthHeaders, uniqueId, retry };
