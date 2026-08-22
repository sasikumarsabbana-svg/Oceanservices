const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Building project assets for Netlify production...');

  // Clean dist directory if it exists
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy public directory to dist
  copyDirSync(publicDir, distDir);
  console.log('Copied public static assets to dist/');

  // Copy uploads directory to dist/uploads
  const uploadsDir = path.join(rootDir, 'uploads');
  const distUploadsDir = path.join(distDir, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    copyDirSync(uploadsDir, distUploadsDir);
    console.log('Copied uploaded document assets to dist/uploads/');
  }

  // Create Netlify SPA routing _redirects file in dist
  const redirectsContent = '/* /index.html 200\n';
  fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent, 'utf8');
  console.log('Created dist/_redirects for Netlify SPA routing.');

  console.log('Build completed successfully! dist directory is ready for deployment.');
} catch (err) {
  console.error('Build process failed:', err);
  process.exit(1);
}
