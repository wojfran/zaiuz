// Creates the tables from db/schema.sql (npm run db:init)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { config } = require('../db');

async function main() {
  const connection = await mysql.createConnection({ ...config, multipleStatements: true });
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await connection.query(sql);
  await connection.end();
  console.log('Utworzono tabele.');
}

main().catch((err) => {
  console.error(`Błąd przy tworzeniu tabel:\n\t${err.message}`);
  process.exit(1);
});
