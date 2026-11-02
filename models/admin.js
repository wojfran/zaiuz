const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

// compared against when the user does not exist, so the response time is similar
const DUMMY_HASH = bcrypt.hashSync('dummy-password', ROUNDS);

async function findByUsername(username) {
  const [rows] = await pool.query(
    'SELECT id, username, password_hash FROM admins WHERE username = ?', [username]);
  return rows[0] || null;
}

// returns { id, username } or null when the data is wrong
async function authenticate(username, password) {
  const admin = await findByUsername(username);
  const ok = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);
  return admin && ok ? { id: admin.id, username: admin.username } : null;
}

async function checkPassword(id, password) {
  const [rows] = await pool.query('SELECT password_hash FROM admins WHERE id = ?', [id]);
  return rows.length > 0 && bcrypt.compare(password, rows[0].password_hash);
}

async function setPassword(id, password) {
  const hash = await bcrypt.hash(password, ROUNDS);
  await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, id]);
}

// creates the admin or resets the password of the existing one (used by the seed script)
async function upsert(username, password) {
  const hash = await bcrypt.hash(password, ROUNDS);
  await pool.query(
    `INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [username, hash]);
}

module.exports = { MIN_PASSWORD_LENGTH, authenticate, checkPassword, setPassword, upsert };
