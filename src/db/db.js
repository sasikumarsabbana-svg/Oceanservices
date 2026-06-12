require('dotenv').config();

let activeDb;

if (process.env.DB_HOST && process.env.DB_NAME) {
  console.log(`[Database] Mode: MySQL Server (${process.env.DB_HOST}:${process.env.DB_PORT || 3306}, DB: ${process.env.DB_NAME})`);
  activeDb = require('./mysql');
} else {
  console.log('[Database] Mode: Local JSON File-Based Database Fallback');
  activeDb = require('./json_db');
}

module.exports = {
  query: (sql, params) => activeDb.query(sql, params)
};
