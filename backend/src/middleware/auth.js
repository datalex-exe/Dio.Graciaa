import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : 'dio_grace_secret_key_change_me_later');
console.log('JWT_SECRET in auth.js:', JWT_SECRET);
if (isProd && (!JWT_SECRET || JWT_SECRET === 'dio_grace_secret_key_change_me_later')) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing or set to the default fallback key in production!');
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
