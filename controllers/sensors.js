const { HttpError } = require('../errors');
const sensor = require('../models/sensor');
const { parseId } = require('./parse');

async function list(req, res) {
  res.json(await sensor.list());
}

async function get(req, res) {
  const found = await sensor.get(Number(req.params.sensorId));
  if (!found) throw new HttpError(404, 'Nie znaleziono czujnika.');
  res.json(found);
}

async function create(req, res) {
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const errors = [];
  if (typeof b.name !== 'string' || b.name.length < 1 || b.name.length > 100) {
    errors.push({ field: 'name', message: 'Nazwa: tekst od 1 do 100 znaków.' });
  }
  const seriesId = parseId(b.seriesId);
  if (seriesId === null) {
    errors.push({ field: 'seriesId', message: 'Wymagany identyfikator serii.' });
  }
  if (errors.length > 0) {
    throw new HttpError(400, 'Niepoprawne dane czujnika.', errors);
  }

  const created = await sensor.create({ name: b.name, seriesId });
  // the response contains the key, so it must not be stored by caches
  res.status(201).set('Cache-Control', 'no-store')
    .location(`/api/sensors/${created.id}`).json(created);
}

async function remove(req, res) {
  if (!(await sensor.remove(Number(req.params.sensorId)))) {
    throw new HttpError(404, 'Nie znaleziono czujnika.');
  }
  res.status(204).end();
}

module.exports = { list, get, create, remove };
