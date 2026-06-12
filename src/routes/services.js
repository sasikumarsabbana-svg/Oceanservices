const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth, requireAdmin, logActivity } = require('./auth');

// GET /api/services - Retrieve all services
router.get('/', requireAuth, async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY service_name ASC');
    res.json(services);
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/services - Add a new service (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { service_name, description, status } = req.body;

  if (!service_name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    // Check if service name already exists
    const [existing] = await db.query('SELECT * FROM services WHERE service_name = ?', [service_name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Service name already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO services (service_name, description, status) VALUES (?, ?, ?)',
      [service_name, description || '', status || 'Active']
    );

    const newServiceId = result.insertId;
    
    // Log activity
    await logActivity(req.user.id, `Created Ocean Service: ${service_name}`, newServiceId);

    res.status(201).json({
      id: newServiceId,
      service_name,
      description,
      status: status || 'Active'
    });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/services/:id - Update an existing service (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const serviceId = req.params.id;
  const { service_name, description, status } = req.body;

  if (!service_name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    // Verify service exists
    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check name collision with another service
    const [collision] = await db.query('SELECT * FROM services WHERE service_name = ? AND id != ?', [service_name, serviceId]);
    if (collision.length > 0) {
      return res.status(400).json({ error: 'Service name already exists for another service' });
    }

    await db.query(
      'UPDATE services SET service_name = ?, description = ?, status = ? WHERE id = ?',
      [service_name, description || '', status || 'Active', serviceId]
    );

    // Log activity
    await logActivity(req.user.id, `Updated Ocean Service: ${service_name}`, serviceId);

    res.json({
      id: parseInt(serviceId),
      service_name,
      description,
      status
    });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/services/:id - Delete service (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const serviceId = req.params.id;

  try {
    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceName = existing[0].service_name;

    // Optional: check if service is linked to any documents or SOPs
    // For now we allow cascading or simple delete
    await db.query('DELETE FROM services WHERE id = ?', [serviceId]);

    // Log activity
    await logActivity(req.user.id, `Deleted Ocean Service: ${serviceName}`, serviceId);

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
