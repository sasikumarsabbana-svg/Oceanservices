const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function renderMarkdownToPDF(md, doc) {
  const lines = md.split(/\r?\n/);
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCode = !inCode;
      if (inCode) doc.moveDown(0.2);
      continue;
    }
    if (inCode) {
      doc.font('Courier').fontSize(9).text(line);
      continue;
    }
    if (line.startsWith('# ')) {
      doc.moveDown(0.5).font('Helvetica-Bold').fontSize(20).text(line.replace('# ', ''), { continued: false });
      continue;
    }
    if (line.startsWith('## ')) {
      doc.moveDown(0.3).font('Helvetica-Bold').fontSize(16).text(line.replace('## ', ''), { continued: false });
      continue;
    }
    if (line.startsWith('### ')) {
      doc.moveDown(0.2).font('Helvetica-Bold').fontSize(13).text(line.replace('### ', ''), { continued: false });
      continue;
    }
    if (line.startsWith('- ')) {
      doc.font('Helvetica').fontSize(11).text('• ' + line.replace('- ', ''), { indent: 10 });
      continue;
    }
    if (line.trim() === '') {
      doc.moveDown(0.5);
      continue;
    }
    doc.font('Helvetica').fontSize(11).text(line);
  }
}

// Usage: node scripts/md-to-pdf.js [input.md] [output.pdf]
(async () => {
  try {
    const inputArg = process.argv[2] || 'DEPLOYMENT.md';
    const outputArg = process.argv[3] || 'DEPLOYMENT.pdf';
    const mdPath = path.isAbsolute(inputArg) ? inputArg : path.join(__dirname, '..', inputArg);
    const outPath = path.isAbsolute(outputArg) ? outputArg : path.join(__dirname, '..', outputArg);
    const md = fs.readFileSync(mdPath, 'utf8');

    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    doc.addPage({ size: 'A4', margin: 50 });
    renderMarkdownToPDF(md, doc);
    doc.end();

    await new Promise((res, rej) => {
      stream.on('finish', res);
      stream.on('error', rej);
    });
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Error creating PDF:', err);
    process.exit(1);
  }
})();
