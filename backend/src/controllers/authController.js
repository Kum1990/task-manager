const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

function signToken(user) {
  return jwt.sign({ username: user.username }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });
}

async function register(req, res) {
  const { username, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const user = await userModel.create({ username, email, passwordHash });
    req.log.info({ userId: user.id }, 'User registered');
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw new AppError(409, 'Username or email is already in use');
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const record = await userModel.findByEmail(email);
  const valid = record && (await bcrypt.compare(password, record.passwordHash));
  if (!valid) {
    req.log.warn({ email }, 'Failed login attempt');
    throw new AppError(401, 'Invalid email or password');
  }
  const { passwordHash: _omit, ...user } = record;
  req.log.info({ userId: user.id }, 'User logged in');
  res.json({ user, token: signToken(user) });
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user });
}

module.exports = { register, login, me };
