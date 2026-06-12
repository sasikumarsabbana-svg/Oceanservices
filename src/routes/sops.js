const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');
const { requireAuth, requireAdmin, logActivity } = require('./auth');

const UPLOAD_BASE_DIR = path.join(__dirname, '..', '..', 'uploads', 'sop');
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// Multer storage for SOP files (saves files inside uploads/sop/sop_<id>/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sopId = req.params.id;
    const dest = path.join(UPLOAD_BASE_DIR, `sop_${sopId}`);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'version-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

// GET /api/sops - Retrieve all master SOPs
router.get('/', requireAuth, async (req, res) => {
  const { search } = req.query;

  try {
    const sql = `
      SELECT s.*, svc.service_name, c.category_name
      FROM sop_master s
      LEFT JOIN services svc ON s.service_id = svc.id
      LEFT JOIN categories c ON s.category_id = c.id
    `;
    const [sops] = await db.query(sql);

    // Apply filtering in JavaScript for portability
    let filtered = [...sops];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => s.title && s.title.toLowerCase().includes(searchLower));
    }

    // Sort by created_at DESC
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(filtered);
  } catch (err) {
    console.error('Fetch SOPs error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/sops - Create a new master SOP (Admin/User allowed, typically Admin)
router.post('/', requireAuth, async (req, res) => {
  const { title, service_id, category_id } = req.body;

  if (!title || !service_id || !category_id) {
    return res.status(400).json({ error: 'Title, service, and category are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO sop_master (title, service_id, category_id, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
      [title, parseInt(service_id), parseInt(category_id), req.user.id, new Date().toISOString()]
    );

    const newSopId = result.insertId;

    // Log activity
    await logActivity(req.user.id, `Created SOP Document: ${title}`, newSopId);

    res.status(201).json({
      id: newSopId,
      title,
      service_id,
      category_id,
      created_by: req.user.id
    });
  } catch (err) {
    console.error('Create SOP error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/sops/:id/versions - Retrieve versions of a specific SOP
router.get('/:id/versions', requireAuth, async (req, res) => {
  const sopId = req.params.id;

  try {
    const [versions] = await db.query(
      'SELECT * FROM sop_versions WHERE sop_id = ? ORDER BY version_no DESC',
      [sopId]
    );
    res.json(versions);
  } catch (err) {
    console.error('Fetch SOP versions error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/sops/:id/versions - Upload a new version of an SOP (Admin only)
router.post('/:id/versions', requireAdmin, (req, res) => {
  upload.single('pdf_file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const sopId = req.params.id;
    const { version_no, status } = req.body;

    if (!version_no) {
      return res.status(400).json({ error: 'Version number is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file upload is required' });
    }

    const relativePath = `/uploads/sop/sop_${sopId}/${req.file.filename}`;
    const targetStatus = status || 'Draft';

    try {
      // Check if version number already exists for this SOP
      const [existing] = await db.query(
        'SELECT * FROM sop_versions WHERE sop_id = ? AND version_no = ?',
        [sopId, version_no]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `Version ${version_no} already exists for this SOP` });
      }

      const [result] = await db.query(
        'INSERT INTO sop_versions (sop_id, version_no, file_path, status, created_at) VALUES (?, ?, ?, ?, ?)',
        [parseInt(sopId), version_no, relativePath, targetStatus, new Date().toISOString()]
      );

      const newVersionId = result.insertId;

      // Log activity
      await logActivity(req.user.id, `Uploaded SOP v${version_no} (Status: ${targetStatus})`, sopId);

      res.status(201).json({
        id: newVersionId,
        sop_id: parseInt(sopId),
        version_no,
        file_path: relativePath,
        status: targetStatus
      });
    } catch (dbErr) {
      console.error('Insert SOP version error:', dbErr);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

// PUT /api/sops/versions/:version_id/status - Update status of a version (Admin only)
router.put('/versions/:version_id/status', requireAdmin, async (req, res) => {
  const versionId = req.params.version_id;
  const { status } = req.body;

  if (!status || (status !== 'Draft' && status !== 'Approved')) {
    return res.status(400).json({ error: 'Status must be Approved or Draft' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM sop_versions WHERE id = ?', [versionId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'SOP version not found' });
    }

    const version = existing[0];

    await db.query(
      'UPDATE sop_versions SET status = ? WHERE id = ?',
      [status, versionId]
    );

    // Log activity
    await logActivity(
      req.user.id, 
      `Changed SOP (ID: ${version.sop_id}) v${version.version_no} status to ${status}`, 
      version.sop_id
    );

    res.json({
      id: parseInt(versionId),
      sop_id: version.sop_id,
      version_no: version.version_no,
      status
    });
  } catch (err) {
    console.error('Update SOP version status error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
