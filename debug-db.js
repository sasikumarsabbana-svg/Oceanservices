const db = require('./src/db/db');
(async () => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', ['admin@ocean.gov']);
    console.log('ROWS', rows);
    console.log('ROW0', rows[0]);
    console.log('email compare', rows[0] && rows[0].email === 'admin@ocean.gov');
  } catch (e) {
    console.error('ERR', e);
  }
})();
