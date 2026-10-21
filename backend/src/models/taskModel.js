const db = require('../config/db');

// Maps API field names to database column names for partial updates.
const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
};

function toTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findAllByUser(userId, { status } = {}) {
  const params = [userId];
  let sql = 'SELECT * FROM tasks WHERE user_id = $1';
  if (status) {
    params.push(status);
    sql += ' AND status = $2';
  }
  sql += ' ORDER BY created_at DESC, id DESC';
  const { rows } = await db.query(sql, params);
  return rows.map(toTask);
}

async function findById(id, userId) {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return toTask(rows[0]);
}

async function create(userId, { title, description, status, priority, dueDate }) {
  const { rows } = await db.query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, title, description, status, priority, dueDate ?? null],
  );
  return toTask(rows[0]);
}

async function update(id, userId, changes) {
  const sets = [];
  const values = [];
  for (const [field, column] of Object.entries(UPDATABLE_COLUMNS)) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findById(id, userId);

  values.push(id, userId);
  const { rows } = await db.query(
    `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING *`,
    values,
  );
  return toTask(rows[0]);
}

async function remove(id, userId) {
  const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return rowCount > 0;
}

module.exports = { findAllByUser, findById, create, update, remove };
