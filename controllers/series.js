const { HttpError } = require('../errors');
const series = require('../models/series');

const COLOR = /^#[0-9A-Fa-f]{6}$/;

// checks the shape of the request body (400), the rules are checked in the model
function readInput(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = [];
  const bad = (field, message) => errors.push({ field, message });

  if (typeof b.name !== 'string' || b.name.length < 1 || b.name.length > 100) {
    bad('name', 'Nazwa: tekst od 1 do 100 znaków.');
  }
  if (typeof b.minValue !== 'number') bad('minValue', 'Wymagana liczba.');
  if (typeof b.maxValue !== 'number') bad('maxValue', 'Wymagana liczba.');
  if (typeof b.color !== 'string' || !COLOR.test(b.color)) {
    bad('color', 'Kolor w formacie #rrggbb.');
  }
  // icon and unit are optional and may be null
  for (const [field, max] of [['icon', 50], ['unit', 20]]) {
    const v = b[field];
    if (v != null && (typeof v !== 'string' || v.length > max)) {
      bad(field, `Tekst do ${max} znaków lub null.`);
    }
  }

  if (errors.length > 0) {
    throw new HttpError(400, 'Niepoprawne dane serii.', errors);
  }
  return {
    name: b.name, minValue: b.minValue, maxValue: b.maxValue,
    color: b.color, icon: b.icon ?? null, unit: b.unit ?? null,
  };
}

async function list(req, res) {
  res.json(await series.list());
}

async function get(req, res) {
  const found = await series.get(Number(req.params.seriesId));
  if (!found) throw new HttpError(404, 'Nie znaleziono serii.');
  res.json(found);
}

async function create(req, res) {
  const created = await series.create(readInput(req.body));
  res.status(201).location(`/api/series/${created.id}`).json(created);
}

async function update(req, res) {
  const input = readInput(req.body);
  const updated = await series.update(Number(req.params.seriesId), input);
  if (!updated) throw new HttpError(404, 'Nie znaleziono serii.');
  res.json(updated);
}

async function remove(req, res) {
  if (!(await series.remove(Number(req.params.seriesId)))) {
    throw new HttpError(404, 'Nie znaleziono serii.');
  }
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
