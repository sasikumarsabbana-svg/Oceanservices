const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function createSamplePDF(outputPath, title, subtitle, sections) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#031738');
  doc.fillColor('#00f2fe').font('Helvetica-Bold').fontSize(22).text('OCEANIC SERVICES KNOWLEDGE HUB', 50, 30);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(12).text(title, 50, 60);

  doc.moveDown(4);

  // Subtitle
  doc.fillColor('#0f1c2d').font('Helvetica-Bold').fontSize(16).text(subtitle);
  doc.moveDown(0.5);
  doc.fillColor('#666666').font('Helvetica-Oblique').fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-US')} | Official Document`);
  doc.moveDown(1.5);

  // Sections
  sections.forEach(sec => {
    doc.fillColor('#0088cc').font('Helvetica-Bold').fontSize(13).text(sec.heading);
    doc.moveDown(0.3);
    doc.fillColor('#333333').font('Helvetica').fontSize(10).text(sec.body, { align: 'justify', lineGap: 4 });
    doc.moveDown(1);
  });

  // Footer
  doc.fontSize(9).fillColor('#999999').text('Oceanic Services - Operational Oceanography System & SOP Management Hub', 50, doc.page.height - 40, { align: 'center' });

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function generateAllPDFs() {
  const rootDir = path.join(__dirname, '..');

  const pdf1 = path.join(rootDir, 'uploads', 'documents', 'wave_guide_v1.pdf');
  await createSamplePDF(pdf1, 'Wave Forecast System Operational Manual v1.0', 'Standard Operational Guidance for Ocean Wave & Swell Predictions', [
    { heading: '1. Executive Summary', body: 'This manual outlines the standard numerical modeling procedures for predicting sea surface boundary conditions, wave periods, and swell dynamics across coastal observing networks.' },
    { heading: '2. Operational Workflow', body: 'Data is ingested every 6 hours from sea level buoys and satellite altimetry. Boundary conditions are computed using hydrodynamic models and rendered to local forecasting centers.' },
    { heading: '3. Compliance & Safety', body: 'All forecasting analysts must verify wave height anomalies exceeding 2.5 meters and issue immediate coastal marine advisories.' }
  ]);

  const pdf2 = path.join(rootDir, 'uploads', 'documents', 'storm_surge_response_v1.pdf');
  await createSamplePDF(pdf2, 'Storm Surge Emergency Coastal Response SOP', 'Standard Operating Procedure for High Inundation Risk & Atmospheric Disturbances', [
    { heading: '1. Emergency Trigger Protocol', body: 'When atmospheric pressure drops below thresholds and tide gauges indicate elevated sea levels, emergency response level 2 is automatically initialized.' },
    { heading: '2. Inter-agency Communication', body: 'Automated telemetry notifications are pushed to coastal disaster management authorities and maritime safety centers.' }
  ]);

  const pdf3 = path.join(rootDir, 'uploads', 'documents', 'coral_bleaching_guide_v1.pdf');
  await createSamplePDF(pdf3, 'Coral Bleaching Watch & Thermal Stress Manual', 'Sea Surface Temperature (SST) Anomaly Analysis & Ecosystem Protection', [
    { heading: '1. Satellite Thermal Monitoring', body: 'Sea surface temperatures are continuously tracked via satellite radiometers to calculate Degree Heating Weeks (DHW) across marine coral sanctuaries.' },
    { heading: '2. Warning Level Classification', body: 'Level 1 Watch is triggered when SST exceeds 1.0 °C above monthly maximum mean climatology for more than 4 consecutive weeks.' }
  ]);

  const pdf4 = path.join(rootDir, 'uploads', 'sop', 'sop_1', 'tsunami_sop_v1.pdf');
  await createSamplePDF(pdf4, 'Tsunami Buoy Calibration Standard Operating Procedure v1.0', 'Master Technical Procedure for Deep Ocean Seismic Buoy Array Maintenance', [
    { heading: '1. Sensor Calibration Routine', body: 'Bi-annual calibration of bottom pressure recorders (BPR) ensures sea level anomaly measurement precision within 1 millimeter tolerance.' },
    { heading: '2. Data Telemetry Verification', body: 'Acoustic modems transmit high-frequency sensor readings to surface buoys, broadcasting real-time data packets via satellite link.' }
  ]);

  console.log('All PDF files generated successfully in uploads/');
}

generateAllPDFs().catch(console.error);
