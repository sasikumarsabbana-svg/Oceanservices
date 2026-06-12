const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth } = require('./auth');

// GET /api/dashboard - Retrieve overview metrics and distributions
router.get('/', requireAuth, async (req, res) => {
  try {
    const [docs] = await db.query('SELECT id, service_id, title, type, created_at FROM documents');
    const [sops] = await db.query('SELECT id, service_id, title, created_at FROM sop_master');
    const [services] = await db.query('SELECT id, service_name FROM services');

    const totalDocsCount = docs.length;
    const sopCount = sops.length;

    // Build service map to calculate distribution dynamically
    const serviceMap = {};
    services.forEach(s => {
      serviceMap[s.id] = { id: s.id, name: s.service_name, count: 0 };
    });

    docs.forEach(d => {
      if (serviceMap[d.service_id]) {
        serviceMap[d.service_id].count++;
      }
    });

    sops.forEach(s => {
      if (serviceMap[s.service_id]) {
        serviceMap[s.service_id].count++;
      }
    });

    const distribution = Object.values(serviceMap);

    // Merge recent uploads (Documents and SOPs), sort descending by created_at, slice top 5
    const recentList = [];

    docs.forEach(d => {
      recentList.push({
        id: d.id,
        title: d.title,
        type: d.type, // 'PDF' or 'VIDEO'
        created_at: d.created_at,
        source: 'General Media'
      });
    });

    sops.forEach(s => {
      recentList.push({
        id: s.id,
        title: s.title,
        type: 'SOP',
        created_at: s.created_at,
        source: 'SOP Lifecycle'
      });
    });

    recentList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentUploads = recentList.slice(0, 5);

    res.json({
      totalDocsCount,
      sopCount,
      distribution,
      recentUploads
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
