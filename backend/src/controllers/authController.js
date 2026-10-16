const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
  if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user._id), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(String(password)))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user._id), user });
});

// GET /api/auth/me
const me = (req, res) => res.json({ user: req.user });

module.exports = { register, login, me };
