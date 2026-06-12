const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');
const { requireAuth, requireAdmin, logActivity } = require('./auth');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Set up Multer for PDF file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
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

// GET /api/documents - Retrieve documents with joining information and filters
router.get('/', requireAuth, async (req, res) => {
  const { service_id, category_id, type, search } = req.query;

  try {
    let sql = `
      SELECT d.*, s.service_name, c.category_name 
      FROM documents d 
      LEFT JOIN services s ON d.service_id = s.id 
      LEFT JOIN categories c ON d.category_id = c.id
    `;
    
    // In our SQL emulator, we can filter using JS arrays after the query,
    // or pass standard parameters. To keep SQL emulator code clean and simple, 
    // we fetch and filter the results in JS if filters are passed, 
    // which makes both MySQL and JSON DB compatibility 100% robust!
    const [documents] = await db.query(sql);

    // Apply filtering in JavaScript for maximum portability
    let filtered = [...documents];

    if (service_id) {
      filtered = filtered.filter(d => d.service_id == service_id);
    }
    if (category_id) {
      filtered = filtered.filter(d => d.category_id == category_id);
    }
    if (type) {
      filtered = filtered.filter(d => d.type.toLowerCase() === type.toLowerCase());
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(d => 
        (d.title && d.title.toLowerCase().includes(searchLower)) ||
        (d.description && d.description.toLowerCase().includes(searchLower)) ||
        (d.tags && d.tags.toLowerCase().includes(searchLower))
      );
    }

    // Sort by created_at DESC
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(filtered);
  } catch (err) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/documents - Create new document/video (Admin only)
router.post('/', requireAdmin, (req, res) => {
  // Use multer's upload middleware
  upload.single('pdf_file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { title, description, type, service_id, category_id, tags, video_url } = req.body;

    if (!title || !type || !service_id || !category_id) {
      return res.status(400).json({ error: 'Title, type, service, and category are required' });
    }

    let filePath = '';
    if (type.toUpperCase() === 'PDF') {
      if (!req.file) {
        return res.status(400).json({ error: 'PDF file upload is required for PDF documents' });
      }
      // Save relative path for browser access
      filePath = '/uploads/documents/' + req.file.filename;
    } else if (type.toUpperCase() === 'VIDEO') {
      if (!video_url) {
        return res.status(400).json({ error: 'Video URL is required for video links' });
      }
      filePath = video_url;
    } else {
      return res.status(400).json({ error: 'Invalid document type. Must be PDF or VIDEO.' });
    }

    try {
      const [result] = await db.query(
        'INSERT INTO documents (title, description, file_path, type, service_id, category_id, tags, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          title, 
          description || '', 
          filePath, 
          type.toUpperCase(), 
          parseInt(service_id), 
          parseInt(category_id), 
          tags || '', 
          req.user.id, 
          new Date().toISOString()
        ]
      );

      const newDocId = result.insertId;

      // Log activity
      await logActivity(req.user.id, `Uploaded ${type.toUpperCase()}: ${title}`, newDocId);

      res.status(201).json({
        id: newDocId,
        title,
        description,
        file_path: filePath,
        type: type.toUpperCase(),
        service_id,
        category_id,
        tags
      });
    } catch (dbErr) {
      console.error('Insert document error:', dbErr);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

module.exports = router;
