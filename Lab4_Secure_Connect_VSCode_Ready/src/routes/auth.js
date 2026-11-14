const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const events = require('../events');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 40 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Username must be 3-40 characters, email must be valid, and password must be 8-72 bytes' });
    }
    const user = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'user',
      createdAt: new Date()
    };
    const saved = await db().collection('users').insertOne(user);
    events.emit('user:registered', { username: user.username });
    res.status(201).json({ message: 'User registered', id: String(saved.insertedId), username: user.username, email: user.email, role: user.role });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required' });
    const user = await db().collection('users').findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '2h' });
    events.emit('user:login', { username: user.username });
    res.status(200).json({ message: 'Login successful', token, role: user.role, username: user.username });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, (req, res) => res.json({ id: String(req.user._id), username: req.user.username, email: req.user.email, role: req.user.role }));

router.get('/admin', authenticate, requireRole('admin'), (req, res) => res.json({ message: 'Admin access granted', role: req.user.role }));

module.exports = router;
