const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./src/db/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Standard Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folders if they don't exist
const folders = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'documents'),
  path.join(__dirname, 'uploads', 'sop')
];
folders.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static uploaded documents and SOPs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend single page app
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routers
const { router: authRouter, requireAuth, logActivity } = require('./src/routes/auth');
const servicesRouter = require('./src/routes/services');
const docsRouter = require('./src/routes/documents');
const sopsRouter = require('./src/routes/sops');
const logsRouter = require('./src/routes/logs');
const dashboardRouter = require('./src/routes/dashboard');
const usersRouter = require('./src/routes/users');

app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/documents', docsRouter);
app.use('/api/sops', sopsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);

// GET /api/categories - Helper endpoint for category listings
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/documents/:id/download - Track document download in activity log
app.post('/api/documents/:id/download', requireAuth, async (req, res) => {
  const docId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [docId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const doc = rows[0];
    await logActivity(req.user.id, `Downloaded Document: ${doc.title}`, docId);
    res.json({ file_path: doc.file_path, title: doc.title });
  } catch (err) {
    console.error('Download track error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fallback to serving the HTML index for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Operational Ocean Services Knowledge Repository API  `);
  console.log(`  Server running locally at: http://localhost:${PORT}  `);
  console.log(`=======================================================`);
});
