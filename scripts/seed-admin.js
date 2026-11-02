// Creates the admin account or resets its password (npm run db:seed)
// Login and password come from ADMIN_USER and ADMIN_PASSWORD in .env
const { pool } = require('../db');
const admin = require('../models/admin');

async function main() {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    throw new Error('Ustaw ADMIN_USER i ADMIN_PASSWORD w pliku .env');
  }
  if (ADMIN_PASSWORD.length < admin.MIN_PASSWORD_LENGTH) {
    throw new Error(`Hasło musi mieć co najmniej ${admin.MIN_PASSWORD_LENGTH} znaków`);
  }
  await admin.upsert(ADMIN_USER, ADMIN_PASSWORD);
  console.log(`Administrator "${ADMIN_USER}" jest gotowy.`);
  await pool.end();
}

main().catch((err) => {
  console.error(`Błąd przy tworzeniu administratora:\n\t${err.message}`);
  process.exit(1);
});
