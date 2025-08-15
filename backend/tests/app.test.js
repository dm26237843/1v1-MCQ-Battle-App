// Simple smoke test hitting the running API.
// Make sure your backend is running locally (e.g., `npm run dev`) before running `npm test`.

import request from 'supertest';

const API = process.env.API_URL || 'http://localhost:4000';

describe('Health check', () => {
  it('GET /health should return { ok: true }', async () => {
    const res = await request(API).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});