const { pool } = require('../db');
const { HttpError } = require('../errors');
const { sha256, randomToken } = require('../hash');

// the API key hash is never returned
function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    seriesId: row.series_id,
    createdAt: row.created_at.toISOString(),
    lastMeasurementAt: row.last_measurement_at ? row.last_measurement_at.toISOString() : null,
  };
}

const SELECT = `SELECT s.id, s.name, s.series_id, s.created_at,
  (SELECT MAX(m.measured_at) FROM measurements m WHERE m.sensor_id = s.id) AS last_measurement_at
  FROM sensors s`;

async function list() {
  const [rows] = await pool.query(`${SELECT} ORDER BY s.id`);
  return rows.map(toApi);
}

// returns null when there is no such sensor
async function get(id) {
  const [rows] = await pool.query(`${SELECT} WHERE s.id = ?`, [id]);
  return rows[0] ? toApi(rows[0]) : null;
}

// the key is returned only here, the database keeps its hash
async function create({ name, seriesId }) {
  const [found] = await pool.query('SELECT id FROM series WHERE id = ?', [seriesId]);
  if (found.length === 0) {
    throw new HttpError(422, 'Seria o podanym seriesId nie istnieje.',
      [{ field: 'seriesId', message: 'Nie ma takiej serii.' }]);
  }
  const apiKey = randomToken();
  const [result] = await pool.query(
    'INSERT INTO sensors (series_id, name, api_key_hash) VALUES (?, ?, ?)',
    [seriesId, name, sha256(apiKey)]);
  return { ...(await get(result.insertId)), apiKey };
}

// measurements of the sensor stay (sensor_id becomes NULL), the key stops working
async function remove(id) {
  const [result] = await pool.query('DELETE FROM sensors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// returns { id, seriesId } for a registered key, otherwise null
async function findByKey(apiKey) {
  const [rows] = await pool.query(
    'SELECT id, series_id FROM sensors WHERE api_key_hash = ?', [sha256(apiKey)]);
  return rows[0] ? { id: rows[0].id, seriesId: rows[0].series_id } : null;
}

module.exports = { list, get, create, remove, findByKey };
