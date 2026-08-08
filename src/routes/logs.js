const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth } = require('./auth');

// GET /api/logs - Retrieve activity logs with joined user details (Requires Auth)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [logs] = await db.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100');
    const [users] = await db.query('SELECT id, name, email FROM users');

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = { name: user.name, email: user.email };
      return acc;
    }, {});

    const sanitizedLogs = logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      reference_id: log.reference_id,
      timestamp: log.timestamp,
      user_name: userMap[log.user_id]?.name || null,
      user_email: userMap[log.user_id]?.email || null
    }));

    res.json(sanitizedLogs);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
