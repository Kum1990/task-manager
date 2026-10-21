jest.mock('../../src/models/userModel');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const userModel = require('../../src/models/userModel');
const createApp = require('../../src/app');

const app = createApp();

describe('Auth API (unit)', () => {
  afterEach(() => jest.resetAllMocks());

  it('registers a user, hashes the password and returns a token', async () => {
    userModel.create.mockResolvedValue({ id: 1, username: 'alice', email: 'alice@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'Alice@Example.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    const saved = userModel.create.mock.calls[0][0];
    expect(saved.email).toBe('alice@example.com');
    expect(saved.passwordHash).not.toBe('Password123!');
  });

  it('returns 409 when the email or username already exists', async () => {
    userModel.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'Password123!' });

    expect(res.status).toBe(409);
  });

  it('returns 400 with details for invalid registration data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['username', 'email', 'password']),
    );
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with 401', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: await bcrypt.hash('correct-password', 4),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });
});
