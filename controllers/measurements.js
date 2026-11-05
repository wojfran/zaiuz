const { HttpError } = require('../errors');
const measurement = require('../models/measurement');
const sensor = require('../models/sensor');
const { parseDateTime } = require('./parse');

// POST: the sensor is identified by X-API-Key, the series comes from the sensor
async function create(req, res) {
  const apiKey = req.get('X-API-Key');
  const found = apiKey ? await sensor.findByKey(apiKey) : null;
  if (!found) {
    throw new HttpError(401, 'Brak ważnego klucza API w nagłówku X-API-Key.');
  }

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const errors = [];
  if (typeof b.value !== 'number') {
    errors.push({ field: 'value', message: 'Wymagana liczba.' });
  }
  let timestamp;
  if (b.timestamp !== undefined) {
    timestamp = parseDateTime(b.timestamp);
    if (!timestamp) errors.push({ field: 'timestamp', message: 'Wymagana data i czas w formacie ISO 8601.' });
  }
  if (errors.length > 0) {
    throw new HttpError(400, 'Niepoprawne dane wyniku.', errors);
  }

  const created = await measurement.create({
    seriesId: found.seriesId, sensorId: found.id, value: b.value, timestamp,
  });
  res.status(201).location(`/api/measurements/${created.id}`).json(created);
}

async function get(req, res) {
  const found = await measurement.get(Number(req.params.measurementId));
  if (!found) throw new HttpError(404, 'Nie znaleziono wyniku.');
  res.json(found);
}

// GET: filters from the query string, every wrong value gives 400
async function list(req, res) {
  const { series, from, to, sort, limit } = req.query;
  const errors = [];

  let seriesIds = [];
  if (series !== undefined) {
    const parts = [].concat(series).join(',').split(',');
    if (parts.every((p) => /^[1-9]\d{0,9}$/.test(p))) {
      seriesIds = parts.map(Number);
    } else {
      errors.push({ field: 'series', message: 'Lista identyfikatorów rozdzielona przecinkami, np. 1,3.' });
    }
  }

  const dates = {};
  for (const [field, text] of [['from', from], ['to', to]]) {
    if (text === undefined) continue;
    dates[field] = parseDateTime(text);
    if (!dates[field]) errors.push({ field, message: 'Wymagana data i czas w formacie ISO 8601.' });
  }

  if (sort !== undefined && sort !== 'timestamp' && sort !== '-timestamp') {
    errors.push({ field: 'sort', message: 'Dozwolone wartości: timestamp, -timestamp.' });
  }

  let max = 1000;
  if (limit !== undefined) {
    max = /^\d{1,5}$/.test(limit) ? Number(limit) : 0;
    if (max < 1 || max > 10000) {
      errors.push({ field: 'limit', message: 'Liczba całkowita od 1 do 10000.' });
    }
  }

  if (errors.length > 0) {
    throw new HttpError(400, 'Niepoprawne parametry zapytania.', errors);
  }

  res.json(await measurement.list({
    seriesIds, from: dates.from, to: dates.to, descending: sort === '-timestamp', limit: max,
  }));
}

module.exports = { create, get, list };
