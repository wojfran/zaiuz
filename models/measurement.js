const { pool } = require('../db');
const { HttpError } = require('../errors');
const series = require('./series');

// a timestamp may be at most this far ahead of the server clock
const MAX_AHEAD_MS = 5 * 60 * 1000;

// pure rules (no database), exported for tests
const isInRange = (value, { minValue, maxValue }) => value >= minValue && value <= maxValue;
const isTooFarAhead = (time, now) => time.getTime() > now.getTime() + MAX_AHEAD_MS;

function toApi(row) {
  const m = {
    id: row.id,
    seriesId: row.series_id,
    value: row.val,
    timestamp: row.measured_at.toISOString(),
  };
  if (row.sensor_id !== null) m.sensorId = row.sensor_id;
  return m;
}

// returns null when there is no such measurement
async function get(id) {
  const [rows] = await pool.query('SELECT * FROM measurements WHERE id = ?', [id]);
  return rows[0] ? toApi(rows[0]) : null;
}

// timestamp is a Date or undefined (= now)
async function create({ seriesId, sensorId, value, timestamp }) {
  const now = new Date();
  const time = timestamp || now;
  const errors = [];

  const s = await series.get(seriesId);
  if (!isInRange(value, s)) {
    errors.push({ field: 'value', message: `Wartość musi mieścić się w przedziale ${s.minValue} – ${s.maxValue}.` });
  }
  if (isTooFarAhead(time, now)) {
    errors.push({ field: 'timestamp', message: 'Znacznik czasu jest późniejszy niż 5 minut od czasu serwera.' });
  }
  if (errors.length > 0) {
    throw new HttpError(422, 'Wynik nie spełnia ograniczeń serii.', errors);
  }

  const [result] = await pool.query(
    'INSERT INTO measurements (series_id, sensor_id, val, measured_at) VALUES (?, ?, ?, ?)',
    [seriesId, sensorId, value, time]);
  return get(result.insertId);
}

// filters: seriesIds (array or empty), from, to (Date or undefined), descending, limit
async function list({ seriesIds, from, to, descending, limit }) {
  const where = [];
  const params = [];
  if (seriesIds.length > 0) {
    where.push('series_id IN (?)');
    params.push(seriesIds);
  }
  if (from) {
    where.push('measured_at >= ?');
    params.push(from);
  }
  if (to) {
    where.push('measured_at <= ?');
    params.push(to);
  }
  const dir = descending ? 'DESC' : 'ASC';
  const sql = `SELECT * FROM measurements
    ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY measured_at ${dir}, id ${dir} LIMIT ?`;
  const [rows] = await pool.query(sql, [...params, limit]);
  return rows.map(toApi);
}

module.exports = { isInRange, isTooFarAhead, get, create, list };
