const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth } = require('./auth');

// GET /api/logs - Retrieve activity logs with joined user details (Requires Auth)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
