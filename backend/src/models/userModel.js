const db = require('../config/db');

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  };
}

async function create({ username, email, passwordHash }) {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, passwordHash],
  );
  return toUser(rows[0]);
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0]) return null;
  return { ...toUser(rows[0]), passwordHash: rows[0].password_hash };
}

async function findById(id) {
  const { rows } = await db.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [id],
  );
  return toUser(rows[0]);
}

module.exports = { create, findByEmail, findById };
