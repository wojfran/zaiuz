const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z', // dates are read and written as UTC
};

const pool = mysql.createPool({ ...config, connectionLimit: 10 });

module.exports = { pool, config };
