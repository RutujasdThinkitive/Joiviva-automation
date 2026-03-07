/**
 * API Helper utilities for API testing with Playwright
 */

const { getAuthHeaders } = require('./helpers');

/**
 * Make an authenticated GET request
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
async function authGet(request, endpoint, params = {}) {
  return await request.get(endpoint, {
    headers: getAuthHeaders(),
    params,
  });
}

/**
 * Make an authenticated POST request
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint
 * @param {Object} data - Request body
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
async function authPost(request, endpoint, data) {
  return await request.post(endpoint, {
    headers: getAuthHeaders(),
    data,
  });
}

/**
 * Make an authenticated PUT request
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint
 * @param {Object} data
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
async function authPut(request, endpoint, data) {
  return await request.put(endpoint, {
    headers: getAuthHeaders(),
    data,
  });
}

/**
 * Make an authenticated DELETE request
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
async function authDelete(request, endpoint) {
  return await request.delete(endpoint, {
    headers: getAuthHeaders(),
  });
}

/**
 * Validate common response properties
 * @param {import('@playwright/test').APIResponse} response
 * @param {number} expectedStatus
 * @returns {Promise<Object>} Parsed response body
 */
async function validateResponse(response, expectedStatus) {
  const { expect } = require('@playwright/test');
  expect(response.status()).toBe(expectedStatus);
  expect(response.headers()['content-type']).toContain('application/json');
  return await response.json();
}

module.exports = { authGet, authPost, authPut, authDelete, validateResponse };
