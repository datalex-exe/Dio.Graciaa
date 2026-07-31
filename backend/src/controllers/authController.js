import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : 'dio_grace_secret_key_change_me_later');
console.log('JWT_SECRET in authController.js:', JWT_SECRET);
if (isProd && (!JWT_SECRET || JWT_SECRET === 'dio_grace_secret_key_change_me_later')) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing or set to the default fallback key in production!');
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
