const taskModel = require('../models/taskModel');
const { TASK_STATUSES } = require('../validators/taskValidators');
const AppError = require('../utils/AppError');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'Invalid task id');
  return id;
}

async function list(req, res) {
  const { status } = req.query;
  if (status && !TASK_STATUSES.includes(status)) {
    throw new AppError(400, `Status must be one of: ${TASK_STATUSES.join(', ')}`);
  }
  const tasks = await taskModel.findAllByUser(req.user.id, { status });
  res.json({ tasks });
}

async function getOne(req, res) {
  const task = await taskModel.findById(parseId(req.params.id), req.user.id);
  if (!task) throw new AppError(404, 'Task not found');
  res.json({ task });
}

async function create(req, res) {
  const task = await taskModel.create(req.user.id, req.body);
  req.log.info({ taskId: task.id, userId: req.user.id }, 'Task created');
  res.status(201).json({ task });
}

async function update(req, res) {
  const task = await taskModel.update(parseId(req.params.id), req.user.id, req.body);
  if (!task) throw new AppError(404, 'Task not found');
  req.log.info({ taskId: task.id, fields: Object.keys(req.body) }, 'Task updated');
  res.json({ task });
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  const deleted = await taskModel.remove(id, req.user.id);
  if (!deleted) throw new AppError(404, 'Task not found');
  req.log.info({ taskId: id }, 'Task deleted');
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
