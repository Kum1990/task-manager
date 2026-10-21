const request = require('supertest');
const createApp = require('../../src/app');

const app = createApp();

describe('Health and routing', () => {
  it('returns ok for the liveness probe', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
  });
});
