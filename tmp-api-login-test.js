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
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body, json: async () => JSON.parse(body) }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}
(async () => {
  const tests = [
    { email: 'admin@ocean.gov', password: 'admin@123', name: 'Admin' },
    { email: 'user@ocean.gov', password: 'sasi@123', name: 'User' }
  ];
  for (const test of tests) {
    try {
      const login = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: test.email, password: test.password })
      });
      const body = await login.json();
      console.log(`--- ${test.name} Login Test ---`);
      console.log('EMAIL:', test.email);
      console.log('PASSWORD:', test.password);
      console.log('STATUS:', login.status);
      console.log('BODY:', JSON.stringify(body, null, 2));
      console.log('');
    } catch (err) {
      console.error(`ERROR ${test.name}`, err);
    }
  }
})();
