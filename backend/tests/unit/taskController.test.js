jest.mock('../../src/models/taskModel');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const taskModel = require('../../src/models/taskModel');
const config = require('../../src/config');
const createApp = require('../../src/app');

const app = createApp();
const token = jwt.sign({ username: 'alice' }, config.jwtSecret, { subject: '1' });
const auth = { Authorization: `Bearer ${token}` };

describe('Tasks API (unit)', () => {
  afterEach(() => jest.resetAllMocks());

  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}x`);
    expect(res.status).toBe(401);
  });

  it('lists only the current user tasks', async () => {
    taskModel.findAllByUser.mockResolvedValue([{ id: 1, title: 'A' }]);

    const res = await request(app).get('/api/tasks').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(taskModel.findAllByUser).toHaveBeenCalledWith(1, { status: undefined });
  });

  it('rejects an unknown status filter', async () => {
    const res = await request(app).get('/api/tasks?status=bogus').set(auth);
    expect(res.status).toBe(400);
  });

  it('creates a task with default values', async () => {
    taskModel.create.mockResolvedValue({ id: 5, title: 'Write tests' });

    const res = await request(app).post('/api/tasks').set(auth).send({ title: '  Write tests ' });

    expect(res.status).toBe(201);
    expect(taskModel.create).toHaveBeenCalledWith(1, {
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
    });
  });

  it('validates the task payload', async () => {
    const res = await request(app).post('/api/tasks').set(auth).send({ title: '' });
    expect(res.status).toBe(400);
    expect(taskModel.create).not.toHaveBeenCalled();
  });

  it('returns 404 for a task owned by someone else', async () => {
    taskModel.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/tasks/99').set(auth);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/tasks/abc').set(auth);
    expect(res.status).toBe(400);
  });

  it('rejects an empty update', async () => {
    const res = await request(app).patch('/api/tasks/1').set(auth).send({});
    expect(res.status).toBe(400);
  });

  it('deletes a task', async () => {
    taskModel.remove.mockResolvedValue(true);
    const res = await request(app).delete('/api/tasks/1').set(auth);
    expect(res.status).toBe(204);
    expect(taskModel.remove).toHaveBeenCalledWith(1, 1);
  });
});
