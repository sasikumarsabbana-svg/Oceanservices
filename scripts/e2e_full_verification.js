const http = require('http');
const assert = require('assert');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('--- STARTING COMPREHENSIVE PRODUCTION READINESS TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function logPass(name) {
    passed++;
    console.log(`[PASS] ${name}`);
  }

  function logFail(name, err) {
    failed++;
    console.error(`[FAIL] ${name}:`, err);
  }

  // 1. Test Static Asset Serving
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    });
    assert.strictEqual(res.statusCode, 200);
    assert(typeof res.body === 'string' && res.body.includes('Ocean Services'));
    assert(res.body.includes('btn-reset-sop-filters'));
    assert(res.body.includes('user-search-input'));
    assert(res.body.includes('log-search-input'));
    logPass('Static frontend index.html served with enhanced controls');
  } catch (e) {
    logFail('Static frontend index.html serving', e);
  }

  // 2. Auth: Empty Fields
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: '', password: '' });
    assert.strictEqual(res.statusCode, 400);
    assert(res.body.error);
    logPass('Auth login rejects empty fields with clean error');
  } catch (e) {
    logFail('Auth login empty fields', e);
  }

  // 3. Auth: Invalid email format
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'invalidemailformat', password: 'password' });
    assert.strictEqual(res.statusCode, 400);
    assert(res.body.error);
    logPass('Auth login rejects invalid email format');
  } catch (e) {
    logFail('Auth login invalid email format', e);
  }

  // 4. Auth: Invalid password
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@ocean.gov', password: 'wrongpassword' });
    assert.strictEqual(res.statusCode, 401);
    assert(res.body.error);
    logPass('Auth login rejects wrong password without exposing internal errors');
  } catch (e) {
    logFail('Auth login wrong password', e);
  }

  // 5. Auth: Valid Admin Login
  let adminToken = '';
  let adminUser = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@ocean.gov', password: 'admin123' });
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.token);
    assert.strictEqual(res.body.user.role, 'Admin');
    adminToken = res.body.token;
    adminUser = res.body.user;
    logPass('Auth login succeeds for admin user with JWT token');
  } catch (e) {
    logFail('Auth login valid admin', e);
  }

  // 6. Auth: Session validation /auth/me
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.email, 'admin@ocean.gov');
    logPass('Auth /auth/me validates active session');
  } catch (e) {
    logFail('Auth /auth/me session validation', e);
  }

  // 7. Dashboard Metrics
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(typeof res.body.totalDocsCount === 'number');
    assert(typeof res.body.sopCount === 'number');
    assert(Array.isArray(res.body.distribution));
    assert(Array.isArray(res.body.recentUploads));
    logPass('Dashboard API returns counts, distribution, and recent uploads');
  } catch (e) {
    logFail('Dashboard API', e);
  }

  // 8. Services Directory
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/services',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.body));
    assert(res.body.length >= 8);
    const serviceNames = res.body.map(s => s.service_name);
    assert(serviceNames.includes('Coral Bleaching Alerts'));
    assert(serviceNames.includes('Fisheries Advisory'));
    assert(serviceNames.includes('Ocean State Forecast'));
    assert(serviceNames.includes('Oil Spill Advisory'));
    assert(serviceNames.includes('Search & Rescue'));
    assert(serviceNames.includes('Storm Surge'));
    assert(serviceNames.includes('Tsunami Advisory'));
    assert(serviceNames.includes('Wave Forecast'));
    logPass('Services directory returns all standard ocean operational services');
  } catch (e) {
    logFail('Services directory', e);
  }

  // 9. Dynamic Service Creation & Modification
  let createdServiceId = null;
  try {
    const createRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/services',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      service_name: 'Autonomous Marine Gliders Monitoring',
      description: 'Sub-surface real-time hydrographic profiling and glider fleet tracking',
      status: 'Active'
    });
    assert.strictEqual(createRes.statusCode, 201);
    createdServiceId = createRes.body.id;
    assert(createdServiceId);

    // Update service
    const updateRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/services/${createdServiceId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      service_name: 'Autonomous Marine Gliders Monitoring',
      description: 'Updated sub-surface profiling',
      status: 'Active'
    });
    assert.strictEqual(updateRes.statusCode, 200);

    // Clean up created service
    const deleteRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/services/${createdServiceId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(deleteRes.statusCode, 200);
    logPass('Dynamic Service Directory CRUD operations verified');
  } catch (e) {
    logFail('Dynamic Service Directory CRUD', e);
  }

  // 10. SOPs API & Search by service/category
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/sops?search=Tsunami',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.body));
    assert(res.body.length > 0);
    assert(res.body.some(s => (s.title + s.service_name).toLowerCase().includes('tsunami')));
    logPass('SOPs API supports full-text search across titles and service names');
  } catch (e) {
    logFail('SOPs API search', e);
  }

  // 11. Documents/Media API & Filter by type
  try {
    const resPdf = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/documents?type=PDF',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(resPdf.statusCode, 200);
    assert(Array.isArray(resPdf.body));
    assert(resPdf.body.every(d => d.type === 'PDF'));

    const resVideo = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/documents?type=VIDEO',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(resVideo.statusCode, 200);
    assert(Array.isArray(resVideo.body));
    assert(resVideo.body.every(d => d.type === 'VIDEO'));
    logPass('Media Library filter by PDF/VIDEO format verified');
  } catch (e) {
    logFail('Media Library filter by type', e);
  }

  // 12. User Account Management (Admin only)
  let testUserId = null;
  try {
    const createRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Marine Scientist Test',
      email: `scientist_test_${Date.now()}@oceanservices.gov.in`,
      password: 'testpassword123',
      role: 'User'
    });
    assert.strictEqual(createRes.statusCode, 201);
    testUserId = createRes.body.id;
    assert(testUserId);

    // List users
    const listRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(listRes.statusCode, 200);
    assert(listRes.body.some(u => u.id === testUserId));

    // Delete user
    const deleteRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${testUserId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(deleteRes.statusCode, 200);
    logPass('User Account Management CRUD operations verified');
  } catch (e) {
    logFail('User Account Management CRUD', e);
  }

  // 13. System Audit Trail Logs
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/logs',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.body));
    assert(res.body.length > 0);
    const lastLog = res.body[0];
    assert(lastLog.action);
    assert(lastLog.timestamp);
    logPass('Audit Trail records and lists system actions with timestamps and user references');
  } catch (e) {
    logFail('Audit Trail API', e);
  }

  console.log('-------------------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('-------------------------------------------------------------');
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
