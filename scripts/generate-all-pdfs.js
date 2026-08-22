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
  doc.fillColor('#666666').font('Helvetica-Oblique').fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-US')} | Official Operational Document`);
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

  // Service 1: Wave Forecast
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'wave_guide_v1.pdf'), 'Wave Forecast System Operational Manual v1.0', 'Standard Guidance for Ocean Wave & Swell Predictions', [
    { heading: '1. Executive Summary', body: 'This manual outlines standard numerical modeling procedures for predicting sea surface boundary conditions, wave periods, and swell dynamics.' },
    { heading: '2. Operational Workflow', body: 'Data is ingested every 6 hours from sea level buoys and satellite altimetry to render forecasts for local centers.' }
  ]);
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_1_wave_forecast.pdf'), 'Wave Forecast System Operational Manual v1.0', 'Standard Guidance for Ocean Wave & Swell Predictions', [
    { heading: '1. Executive Summary', body: 'This manual outlines standard numerical modeling procedures for predicting sea surface boundary conditions, wave periods, and swell dynamics.' }
  ]);

  // Service 2: Ocean State Forecast
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_2_ocean_state.pdf'), 'Ocean State Boundary Conditions & Currents Manual', 'Hydrodynamic Currents, Salinity & Temperature Monitoring SOP', [
    { heading: '1. Hydrodynamic Modeling', body: '3D ocean circulation models track sea surface temperature, salinity, and directional ocean currents 24/7.' }
  ]);

  // Service 3: Tsunami Advisory
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_3_tsunami_advisory.pdf'), 'Tsunami Buoy & Seismic Sensor Operational SOP', 'Early Warning Seismic Sensors & Deep Ocean Pressure Recorder Guidelines', [
    { heading: '1. Seismic Trigger Protocol', body: 'Real-time seismic data triggers automated sea level buoy sampling to calculate coastal inundation time windows.' }
  ]);

  // Service 4: Storm Surge
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'storm_surge_response_v1.pdf'), 'Storm Surge Emergency Coastal Response SOP', 'Standard Operating Procedure for High Inundation Risk & Atmospheric Disturbances', [
    { heading: '1. Emergency Trigger Protocol', body: 'When atmospheric pressure drops below thresholds and tide gauges indicate elevated sea levels, level 2 emergency is initialized.' }
  ]);
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_4_storm_surge.pdf'), 'Storm Surge Emergency Coastal Response SOP', 'Standard Operating Procedure for High Inundation Risk & Atmospheric Disturbances', [
    { heading: '1. Emergency Trigger Protocol', body: 'When atmospheric pressure drops below thresholds and tide gauges indicate elevated sea levels, level 2 emergency is initialized.' }
  ]);

  // Service 5: Oil Spill Advisory
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_5_oil_spill.pdf'), 'Oil Spill Chemical Drift & Trajectory Manual', 'Hydrodynamic Drift Trajectory & Containment Protocol', [
    { heading: '1. Spill Trajectory Simulation', body: 'Drift trajectory algorithms project slick movement based on surface wind vector fields and ocean current velocity.' }
  ]);

  // Service 6: Search & Rescue
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_6_search_rescue.pdf'), 'Search & Rescue (SAR) Drift Optimization Manual', 'Maritime Search Area Coordinates & Search Vector SOP', [
    { heading: '1. Target Drift Probability', body: 'Computes probable drift envelopes for maritime vessels and personnel to assist Coast Guard search operations.' }
  ]);

  // Service 7: Coral Bleaching Alerts
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'coral_bleaching_guide_v1.pdf'), 'Coral Bleaching Watch & Thermal Stress Manual', 'Sea Surface Temperature (SST) Anomaly Analysis & Ecosystem Protection', [
    { heading: '1. Satellite Thermal Monitoring', body: 'Sea surface temperatures are continuously tracked via satellite radiometers to calculate Degree Heating Weeks (DHW).' }
  ]);
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_7_coral_bleaching.pdf'), 'Coral Bleaching Watch & Thermal Stress Manual', 'Sea Surface Temperature (SST) Anomaly Analysis & Ecosystem Protection', [
    { heading: '1. Satellite Thermal Monitoring', body: 'Sea surface temperatures are continuously tracked via satellite radiometers to calculate Degree Heating Weeks (DHW).' }
  ]);

  // Service 8: Fisheries Advisory
  await createSamplePDF(path.join(rootDir, 'uploads', 'documents', 'service_8_fisheries_advisory.pdf'), 'Potential Fishing Zone (PFZ) Satellite Advisory Guide', 'Satellite Chlorophyll & SST Frontal Zones Analysis for Coastal Communities', [
    { heading: '1. Chlorophyll Front Identification', body: 'Satellite ocean color sensors detect plankton blooms and sea temperature fronts to broadcast daily fishing zone coordinates.' }
  ]);

  // Master SOP 1 PDF
  await createSamplePDF(path.join(rootDir, 'uploads', 'sop', 'sop_1', 'tsunami_sop_v1.pdf'), 'Tsunami Buoy Calibration Standard Operating Procedure v1.0', 'Master Technical Procedure for Deep Ocean Seismic Buoy Array Maintenance', [
    { heading: '1. Sensor Calibration Routine', body: 'Bi-annual calibration of bottom pressure recorders (BPR) ensures sea level anomaly measurement precision within 1mm.' }
  ]);

  console.log('Successfully generated PDFs for all 8 Ocean Services!');
}

generateAllPDFs().catch(console.error);
