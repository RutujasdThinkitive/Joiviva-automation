const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('API Health Check', () => {
  test('GET /api/health - should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/health - should return valid response body', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });
});
