const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { requireAdmin, logActivity } = require('./auth');

// GET /api/users - List all users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    // Never return passwords
    const safe = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }));
    res.json(safe);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/users - Create a new user (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  if (!['Admin', 'User'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Admin or User' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, new Date().toISOString()]
    );

    await logActivity(req.user.id, `Created User Account: ${name} (${role})`, result.insertId);

    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/users/:id - Delete a user (Admin only, cannot delete self)
router.delete('/:id', requireAdmin, async (req, res) => {
  const userId = req.params.id;

  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userName = existing[0].name;
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    await logActivity(req.user.id, `Deleted User Account: ${userName}`, userId);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
