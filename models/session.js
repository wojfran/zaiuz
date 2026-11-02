const { pool } = require('../db');
const { sha256, randomToken } = require('../hash');

const TTL_SECONDS = 2 * 60 * 60;

// the token itself is returned only here, the database keeps just its hash
async function create(adminId) {
  const token = randomToken();
  await pool.query(
    `INSERT INTO sessions (token_hash, admin_id, expires_at)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))`,
    [sha256(token), adminId, TTL_SECONDS]);
  // old sessions are removed here, so no separate cleanup job is needed
  await pool.query('DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()');
  return { token, expiresIn: TTL_SECONDS };
}

// returns { adminId, username } for a valid token, otherwise null
async function find(token) {
  const [rows] = await pool.query(
    `SELECT a.id AS adminId, a.username
     FROM sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()`,
    [sha256(token)]);
  return rows[0] || null;
}

async function remove(token) {
  await pool.query('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
}

// all sessions of the admin except the one with the given token
async function removeOthers(adminId, token) {
  await pool.query('DELETE FROM sessions WHERE admin_id = ? AND token_hash <> ?',
    [adminId, sha256(token)]);
}

module.exports = { create, find, remove, removeOthers };
