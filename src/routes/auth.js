const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/db');

// In-memory session store: token -> user info
const sessions = new Map();

// Helper to generate a simple token
function generateToken() {
  return 'session_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// Middleware: Require Auth
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  const userSession = sessions.get(token);
  if (!userSession) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
  req.user = userSession;
  next();
}

// Middleware: Require Admin
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    next();
  });
}

// Log action helper
async function logActivity(userId, action, referenceId) {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action, reference_id, timestamp) VALUES (?, ?, ?, ?)',
      [userId, action, referenceId ? String(referenceId) : null, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken();
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    sessions.set(token, sessionData);
    
    // Log user login
    await logActivity(user.id, 'User Logged In', user.id);

    res.json({
      token,
      user: sessionData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  
  // Log user logout
  await logActivity(req.user.id, 'User Logged Out', req.user.id);
  
  sessions.delete(token);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = {
  router,
  requireAuth,
  requireAdmin,
  logActivity
};
