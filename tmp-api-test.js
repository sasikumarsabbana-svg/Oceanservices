const http = require('node:http');
const url = require('node:url');
function fetch(uri, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(uri);
    const lib = parsed.protocol === 'https:' ? require('node:https') : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: opts.method || 'GET',
      headers: opts.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, json: async () => JSON.parse(body) });
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
(async () => {
  try {
    const login = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ocean.gov', password: 'admin@123' })
    });
    console.log('LOGIN STATUS', login.status);
    const auth = await login.json();
    console.log('AUTH', auth);
    const docs = await fetch('http://localhost:3000/api/documents', {
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    console.log('DOCS STATUS', docs.status);
    const docsBody = await docs.json();
    console.log('DOCS LENGTH', Array.isArray(docsBody) ? docsBody.length : 'not array');
    console.log('DOCS SAMPLE', JSON.stringify(docsBody.slice(0,2), null, 2));

    const logs = await fetch('http://localhost:3000/api/logs', {
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    console.log('LOGS STATUS', logs.status);
    const logsBody = await logs.json();
    console.log('LOGS LENGTH', Array.isArray(logsBody) ? logsBody.length : 'not array');
    console.log('LOGS SAMPLE', JSON.stringify(logsBody.slice(0,2), null, 2));

    const dashboard = await fetch('http://localhost:3000/api/dashboard', {
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    console.log('DASHBOARD STATUS', dashboard.status);
    const dashBody = await dashboard.json();
    console.log('DASHBOARD', JSON.stringify(dashBody, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  }
})();
