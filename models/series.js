const { pool } = require('../db');
const { HttpError } = require('../errors');

// database row -> object from the API contract
function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    minValue: row.min_value,
    maxValue: row.max_value,
    color: row.color,
    icon: row.icon,
    unit: row.unit,
  };
}

// pure rules (no database), exported for tests
const isValidRange = (min, max) => min < max;
// true when stored values (lowest, highest) do not fit in the new range
const excludesStored = (lowest, highest, min, max) => lowest < min || highest > max;

async function list() {
  const [rows] = await pool.query('SELECT * FROM series ORDER BY id');
  return rows.map(toApi);
}

// returns null when there is no such series
async function get(id) {
  const [rows] = await pool.query('SELECT * FROM series WHERE id = ?', [id]);
  return rows[0] ? toApi(rows[0]) : null;
}

function checkRange({ minValue, maxValue }) {
  if (!isValidRange(minValue, maxValue)) {
    throw new HttpError(422, 'Wartość minValue musi być mniejsza od maxValue.',
      [{ field: 'minValue', message: 'Przedział jest pusty.' }]);
  }
}

async function create(input) {
  checkRange(input);
  const [result] = await pool.query(
    'INSERT INTO series (name, min_value, max_value, color, icon, unit) VALUES (?, ?, ?, ?, ?, ?)',
    [input.name, input.minValue, input.maxValue, input.color, input.icon, input.unit]);
  return get(result.insertId);
}

// the range cannot be changed so that it excludes results already stored (409)
async function update(id, input) {
  if (!(await get(id))) return null;
  checkRange(input);
  const [[stored]] = await pool.query(
    'SELECT MIN(val) AS lowest, MAX(val) AS highest FROM measurements WHERE series_id = ?', [id]);
  // without results both are NULL
  if (stored.lowest !== null &&
      excludesStored(stored.lowest, stored.highest, input.minValue, input.maxValue)) {
    throw new HttpError(409,
      `W serii są wyniki z przedziału ${stored.lowest} – ${stored.highest}, który nie mieści się w nowym przedziale.`);
  }
  await pool.query(
    'UPDATE series SET name = ?, min_value = ?, max_value = ?, color = ?, icon = ?, unit = ? WHERE id = ?',
    [input.name, input.minValue, input.maxValue, input.color, input.icon, input.unit, id]);
  return get(id);
}

// sensors and measurements of the series are removed by the foreign keys
async function remove(id) {
  const [result] = await pool.query('DELETE FROM series WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { isValidRange, excludesStored, list, get, create, update, remove };
