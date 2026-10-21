const request = require('supertest');
const createApp = require('../../src/app');
const { pool } = require('../../src/config/db');
const { runMigrations } = require('../../src/db/migrate');

const app = createApp();

async function registerUser(username) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'Password123!' });
  expect(res.status).toBe(201);
  return res.body.token;
}

describe('Task API with PostgreSQL (integration)', () => {
  let aliceToken;
  let bobToken;

  beforeAll(async () => {
    await runMigrations();
    await pool.query('TRUNCATE tasks, users RESTART IDENTITY CASCADE');
    aliceToken = await registerUser('alice');
    bobToken = await registerUser('bob');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('reports ready when the database is reachable', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
  });

  it('rejects a duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'Password123!' });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice');
  });

  it('runs the full task lifecycle and keeps users isolated', async () => {
    const alice = { Authorization: `Bearer ${aliceToken}` };
    const bob = { Authorization: `Bearer ${bobToken}` };

    const created = await request(app)
      .post('/api/tasks')
      .set(alice)
      .send({ title: 'Prepare demo', priority: 'high', dueDate: '2030-01-15' });
    expect(created.status).toBe(201);
    const { id } = created.body.task;
    expect(created.body.task.dueDate).toBe('2030-01-15');

    const aliceList = await request(app).get('/api/tasks').set(alice);
    expect(aliceList.body.tasks).toHaveLength(1);

    const bobList = await request(app).get('/api/tasks').set(bob);
    expect(bobList.body.tasks).toHaveLength(0);

    expect((await request(app).get(`/api/tasks/${id}`).set(bob)).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${id}`).set(bob)).status).toBe(404);

    const updated = await request(app)
      .patch(`/api/tasks/${id}`)
      .set(alice)
      .send({ status: 'done' });
    expect(updated.status).toBe(200);
    expect(updated.body.task.status).toBe('done');

    const doneOnly = await request(app).get('/api/tasks?status=done').set(alice);
    expect(doneOnly.body.tasks).toHaveLength(1);

    expect((await request(app).delete(`/api/tasks/${id}`).set(alice)).status).toBe(204);
    expect((await request(app).get(`/api/tasks/${id}`).set(alice)).status).toBe(404);
  });
});
