const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', '..', 'data', 'db_fallback');

// Ensure database folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Helper to read table
function readTable(tableName) {
  const file = path.join(DB_DIR, `${tableName}.json`);
  if (!fs.existsSync(file)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Helper to write table
function writeTable(tableName, data) {
  const file = path.join(DB_DIR, `${tableName}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Seed Initial Data
function seedDatabase() {
  // 1. Users
  const usersFile = path.join(DB_DIR, 'users.json');
  if (!fs.existsSync(usersFile)) {
    const adminHash = bcrypt.hashSync('admin123', 8);
    const userHash = bcrypt.hashSync('user123', 8);
    const users = [
      { id: 1, name: 'Admin Officer', email: 'admin@ocean.gov', password: adminHash, role: 'Admin', created_at: new Date().toISOString() },
      { id: 2, name: 'Service Analyst', email: 'user@ocean.gov', password: userHash, role: 'User', created_at: new Date().toISOString() }
    ];
    writeTable('users', users);
  }

  // 2. Services
  const servicesFile = path.join(DB_DIR, 'services.json');
  if (!fs.existsSync(servicesFile)) {
    const services = [
      { id: 1, service_name: 'Wave Forecast', description: 'Real-time and forecasted wave heights and periods.', status: 'Active' },
      { id: 2, service_name: 'Ocean State Forecast', description: 'General ocean parameters including currents and temperatures.', status: 'Active' },
      { id: 3, service_name: 'Tsunami Advisory', description: 'Early warning and advisories for seismic sea waves.', status: 'Active' },
      { id: 4, service_name: 'Storm Surge', description: 'Advisories on coastal water rises due to atmospheric disturbances.', status: 'Active' },
      { id: 5, service_name: 'Oil Spill Advisory', description: 'Trajectory and impact assessment of marine oil pollution.', status: 'Active' },
      { id: 6, service_name: 'Search & Rescue', description: 'Drift forecasts to assist maritime search and rescue operations.', status: 'Active' },
      { id: 7, service_name: 'Coral Bleaching Alerts', description: 'Monitoring and alerts for sea surface temperature bleaching risks.', status: 'Active' },
      { id: 8, service_name: 'Fisheries Advisory', description: 'Potential Fishing Zones (PFZ) advisory for fishermen.', status: 'Active' }
    ];
    writeTable('services', services);
  }

  // 3. Categories
  const categoriesFile = path.join(DB_DIR, 'categories.json');
  if (!fs.existsSync(categoriesFile)) {
    const categories = [
      { id: 1, category_name: 'Standard Operating Procedures', parent_id: null },
      { id: 2, category_name: 'Technical Reports', parent_id: null },
      { id: 3, category_name: 'Video Guides', parent_id: null }
    ];
    writeTable('categories', categories);
  }

  // 4. Documents
  const documentsFile = path.join(DB_DIR, 'documents.json');
  if (!fs.existsSync(documentsFile)) {
    const dummyPdfDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
    if (!fs.existsSync(dummyPdfDir)) {
      fs.mkdirSync(dummyPdfDir, { recursive: true });
    }
    const pdfPath = path.join(dummyPdfDir, 'wave_guide_v1.pdf');
    const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 60 >>\nstream\nBT /F1 12 Tf 70 700 Td (Wave Forecast System Operational Guide - v1.0) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n325\n%%EOF";
    fs.writeFileSync(pdfPath, pdfContent, 'utf8');

    const docs = [
      { id: 1, title: 'Wave Forecast Model Operational Guide', description: 'Comprehensive manual describing the numeric model settings, boundary conditions, and wave forecasting steps.', file_path: '/uploads/documents/wave_guide_v1.pdf', type: 'PDF', service_id: 1, category_id: 1, tags: 'wave, model, operational, guide', uploaded_by: 1, created_at: new Date().toISOString() },
      { id: 2, title: 'Coral Bleaching Alert Sea Temperature Video Guide', description: 'Video instructions showing how to navigate SST dashboards and interpret bleaching warning levels.', file_path: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'VIDEO', service_id: 7, category_id: 3, tags: 'coral, bleaching, sea temperature, sst, tutorial', uploaded_by: 1, created_at: new Date().toISOString() }
    ];
    writeTable('documents', docs);
  }

  // 5. SOP Master
  const sopMasterFile = path.join(DB_DIR, 'sop_master.json');
  if (!fs.existsSync(sopMasterFile)) {
    const sops = [
      { id: 1, title: 'Tsunami Buoy Calibration Standard Procedure', service_id: 3, category_id: 1, created_by: 1, created_at: new Date().toISOString() }
    ];
    writeTable('sop_master', sops);
  }

  // 6. SOP Versions
  const sopVersionsFile = path.join(DB_DIR, 'sop_versions.json');
  if (!fs.existsSync(sopVersionsFile)) {
    const dummySopDir = path.join(__dirname, '..', '..', 'uploads', 'sop', 'sop_1');
    if (!fs.existsSync(dummySopDir)) {
      fs.mkdirSync(dummySopDir, { recursive: true });
    }
    const pdfPath = path.join(dummySopDir, 'tsunami_sop_v1.pdf');
    const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 60 >>\nstream\nBT /F1 12 Tf 70 700 Td (Tsunami Buoy Calibration SOP - Version 1.0) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n325\n%%EOF";
    fs.writeFileSync(pdfPath, pdfContent, 'utf8');

    const versions = [
      { id: 1, sop_id: 1, version_no: '1.0', file_path: '/uploads/sop/sop_1/tsunami_sop_v1.pdf', status: 'Approved', created_at: new Date().toISOString() }
    ];
    writeTable('sop_versions', versions);
  }

  // 7. Activity Logs
  const logsFile = path.join(DB_DIR, 'activity_logs.json');
  if (!fs.existsSync(logsFile)) {
    const logs = [
      { id: 1, user_id: 1, action: 'System Seeding Completed', reference_id: null, timestamp: new Date().toISOString() }
    ];
    writeTable('activity_logs', logs);
  }
}

seedDatabase();

// Clean string for parsing
function cleanSql(sql) {
  return sql.replace(/\s+/g, ' ').trim();
}

// Execute query emulator
async function query(sql, params = []) {
  const clean = cleanSql(sql);
  let paramIndex = 0;
  
  const getNextParam = () => {
    return params[paramIndex++];
  };

  // --- SELECT QUERY ---
  if (clean.toLowerCase().startsWith('select')) {
    // Determine the primary table name
    // Support SELECT ... FROM <table> with optional joins
    const selectRegex = /from\s+(\w+)(?:\s+\w+)?/i;
    const match = selectRegex.exec(clean);
    if (!match) throw new Error(`Could not parse select table: ${sql}`);
    
    const tableName = match[1];
    let data = readTable(tableName);

    // Filter by WHERE
    // Handles WHERE col = ? (simple), WHERE col = ? AND/OR col = ? etc.
    const whereMatch = /where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i.exec(clean);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const conditions = whereClause.split(/\band\b/i).map(c => c.trim());
      const whereParamCount = (whereClause.match(/\?/g) || []).length;
      const whereParams = params.slice(0, whereParamCount);

      data = data.filter(row => {
        let matchAll = true;
        let whereParamIdx = 0;
        for (const condition of conditions) {
          const parts = condition.split(/\s*=\s*/);
          const col = parts[0].trim().replace(/^\w+\./, '');
          const valPlaceholder = parts[1] ? parts[1].trim() : '';

          if (valPlaceholder === '?') {
            const expectedVal = whereParams[whereParamIdx++];
            if (row[col] != expectedVal) {
              matchAll = false;
            }
          }
        }
        return matchAll;
      });
    }

    paramIndex = whereMatch ? (whereMatch[1].match(/\?/g) || []).length : 0;

    // Process LEFT JOINs
    // e.g. LEFT JOIN services s ON d.service_id = s.id
    const joinRegex = /left\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+([\w.]+)\s*=\s*([\w.]+)/ig;
    let joinMatch;
    while ((joinMatch = joinRegex.exec(clean)) !== null) {
      const joinTable = joinMatch[1];
      const joinAlias = joinMatch[2] || joinTable;
      const onLeft = joinMatch[3];
      const onRight = joinMatch[4];

      const joinData = readTable(joinTable);
      
      // Determine columns to map
      const leftCol = onLeft.split('.')[1] || onLeft;
      const rightCol = onRight.split('.')[1] || onRight;

      data = data.map(row => {
        // Find matching row in joined table
        // We know standard joins are: d.service_id = s.id, so if primary table has service_id and joined has id
        let keyVal = row[leftCol];
        let joinRow = joinData.find(jr => jr[rightCol] == keyVal);
        if (!joinRow && row[rightCol] !== undefined) {
          keyVal = row[rightCol];
          joinRow = joinData.find(jr => jr[leftCol] == keyVal);
        }

        const merged = { ...row };
        if (joinRow) {
          // Copy joined fields
          // E.g. service_name -> service_name, category_name -> category_name, name -> user_name
          Object.keys(joinRow).forEach(k => {
            if (k !== 'id') {
              if (joinTable === 'users' && k === 'name') {
                merged['uploaded_by_name'] = joinRow[k];
                merged['created_by_name'] = joinRow[k];
                merged['user_name'] = joinRow[k];
              } else {
                merged[k] = joinRow[k];
              }
            }
          });
        }
        return merged;
      });
    }

    // ORDER BY
    const orderByMatch = /order\s+by\s+(\w+)(?:\s+(asc|desc))?/i.exec(clean);
    if (orderByMatch) {
      const orderCol = orderByMatch[1].replace(/^\w+\./, ''); // remove table prefix
      const direction = (orderByMatch[2] || 'asc').toLowerCase();
      
      data.sort((a, b) => {
        let valA = a[orderCol];
        let valB = b[orderCol];
        if (typeof valA === 'string') {
          return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // numbers or dates
        if (direction === 'asc') return valA > valB ? 1 : valA < valB ? -1 : 0;
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      });
    }

    // LIMIT
    const limitMatch = /limit\s+(\d+)/i.exec(clean);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      data = data.slice(0, limit);
    }

    return [data];
  }

  // --- INSERT QUERY ---
  if (clean.toLowerCase().startsWith('insert')) {
    // INSERT INTO table (col1, col2) VALUES (?, ?)
    const insertRegex = /insert\s+into\s+(\w+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i;
    const match = insertRegex.exec(clean);
    if (!match) throw new Error(`Could not parse insert: ${sql}`);

    const tableName = match[1];
    const columns = match[2].split(',').map(c => c.trim());
    
    const data = readTable(tableName);
    const newId = data.length > 0 ? Math.max(...data.map(r => r.id)) + 1 : 1;
    
    const newRow = { id: newId };
    columns.forEach((col, idx) => {
      newRow[col] = params[idx];
    });

    // Default timestamps or logic if missing
    if (tableName === 'documents' && !newRow.created_at) newRow.created_at = new Date().toISOString();
    if (tableName === 'sop_master' && !newRow.created_at) newRow.created_at = new Date().toISOString();
    if (tableName === 'sop_versions' && !newRow.created_at) newRow.created_at = new Date().toISOString();
    if (tableName === 'activity_logs' && !newRow.timestamp) newRow.timestamp = new Date().toISOString();
    if (tableName === 'users' && !newRow.created_at) newRow.created_at = new Date().toISOString();

    data.push(newRow);
    writeTable(tableName, data);

    return [{ insertId: newId, affectedRows: 1 }];
  }

  // --- UPDATE QUERY ---
  if (clean.toLowerCase().startsWith('update')) {
    // UPDATE table SET col1 = ?, col2 = ? WHERE id = ?
    const updateRegex = /update\s+(\w+)\s+set\s+(.+?)\s+where\s+(.+)/i;
    const match = updateRegex.exec(clean);
    if (!match) throw new Error(`Could not parse update: ${sql}`);

    const tableName = match[1];
    const setClause = match[2];
    const whereClause = match[3];

    // Find the SET assignments
    const setAssignments = setClause.split(',').map(s => s.trim());
    const data = readTable(tableName);

    // Resolve parameter splits
    // Set assignments are first, then WHERE conditions
    const setParamCount = setAssignments.length;
    
    // Find matching rows
    // Standard WHERE is e.g. id = ? or sop_id = ?
    const whereParts = whereClause.split(/\s*=\s*/);
    const whereCol = whereParts[0].trim();
    const whereVal = params[setParamCount]; // value after the set parameters

    let affectedRows = 0;
    const updatedData = data.map(row => {
      if (row[whereCol] == whereVal) {
        affectedRows++;
        const updatedRow = { ...row };
        setAssignments.forEach((assign, idx) => {
          const col = assign.split(/\s*=\s*/)[0].trim();
          updatedRow[col] = params[idx];
        });
        return updatedRow;
      }
      return row;
    });

    writeTable(tableName, updatedData);
    return [{ affectedRows }];
  }

  // --- DELETE QUERY ---
  if (clean.toLowerCase().startsWith('delete')) {
    // DELETE FROM table WHERE id = ?
    const deleteRegex = /delete\s+from\s+(\w+)\s+where\s+(.+)/i;
    const match = deleteRegex.exec(clean);
    if (!match) throw new Error(`Could not parse delete: ${sql}`);

    const tableName = match[1];
    const whereClause = match[2];

    const whereParts = whereClause.split(/\s*=\s*/);
    const whereCol = whereParts[0].trim();
    const whereVal = params[0];

    const data = readTable(tableName);
    const filtered = data.filter(row => row[whereCol] != whereVal);
    const affectedRows = data.length - filtered.length;

    writeTable(tableName, filtered);
    return [{ affectedRows }];
  }

  throw new Error(`Unsupported SQL query emulator command: ${sql}`);
}

module.exports = {
  query
};
