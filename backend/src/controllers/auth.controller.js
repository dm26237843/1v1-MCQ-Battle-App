import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { signupSchema, loginSchema } from '../validators/auth.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  const payload = { sub: user._id.toString(), username: user.username, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const signup = asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);

  const [u1, u2] = await Promise.all([
    User.findOne({ username: data.username }).lean(),
    User.findOne({ email: data.email }).lean(),
  ]);
  if (u1) return res.status(409).json({ error: { message: 'Username already in use' } });
  if (u2) return res.status(409).json({ error: { message: 'Email already in use' } });

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({ username: data.username, email: data.email, passwordHash });

  const token = signToken(user);
  return res.status(201).json({ user: sanitizeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const query = data.email ? { email: data.email.toLowerCase() } : { username: data.username };
  const user = await User.findOne(query);
  if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { message: 'Invalid credentials' } });

  const token = signToken(user);
  return res.json({ user: sanitizeUser(user), token });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  return res.json({ user: sanitizeUser(user) });
});