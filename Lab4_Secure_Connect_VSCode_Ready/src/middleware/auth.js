const jwt = require('jsonwebtoken');
const { db, ObjectId, validId } = require('../db');

async function userFromToken(token) {
  if (typeof token !== 'string' || !token) throw new Error('Invalid token');
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (!validId(payload.sub)) throw new Error('Invalid token');
  const user = await db().collection('users').findOne({ _id: new ObjectId(payload.sub) });
  if (!user) throw new Error('Invalid token');
  return user;
}

async function authenticate(req, res, next) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = await userFromToken(match[1].trim());
    next();
  } catch (error) {
    if (error.name === 'MongoServerError' || error.name === 'MongoNetworkError') return next(error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ message: 'Access denied' });
    next();
  };
}

module.exports = { authenticate, requireRole, userFromToken };
