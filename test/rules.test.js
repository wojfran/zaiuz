// Unit tests of the rules that do not need a database (npm test)
const test = require('node:test');
const assert = require('node:assert/strict');

const series = require('../models/series');
const measurement = require('../models/measurement');
const { sha256 } = require('../hash');
const { parseDateTime, parseId } = require('../controllers/parse');
const { warsawToUtc } = require('../generator/sources/gios');
const { valueAt } = require('../generator/sources/synthetic');

test('series: the range must have min < max', () => {
  assert.equal(series.isValidRange(0, 100), true);
  assert.equal(series.isValidRange(10, 10), false);
  assert.equal(series.isValidRange(10, 5), false);
});

test('series: a new range cannot exclude stored values', () => {
  assert.equal(series.excludesStored(20, 80, 0, 100), false);
  assert.equal(series.excludesStored(20, 80, 20, 80), false); // the edges are allowed
  assert.equal(series.excludesStored(20, 80, 50, 100), true);
  assert.equal(series.excludesStored(20, 80, 0, 60), true);
});

test('measurement: the value must be inside the range of the series', () => {
  const s = { minValue: -5, maxValue: 5 };
  assert.equal(measurement.isInRange(-5, s), true);
  assert.equal(measurement.isInRange(5, s), true);
  assert.equal(measurement.isInRange(5.1, s), false);
  assert.equal(measurement.isInRange(-5.1, s), false);
});

test('measurement: a timestamp may be at most 5 minutes ahead', () => {
  const now = new Date('2026-01-10T10:00:00Z');
  assert.equal(measurement.isTooFarAhead(new Date('2026-01-10T10:05:00Z'), now), false);
  assert.equal(measurement.isTooFarAhead(new Date('2026-01-10T10:05:01Z'), now), true);
  assert.equal(measurement.isTooFarAhead(new Date('2025-01-01T00:00:00Z'), now), false);
});

test('sha256: known value', () => {
  assert.equal(sha256('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('parseDateTime: accepts RFC 3339 only', () => {
  assert.equal(parseDateTime('2026-01-10T10:00:00Z').toISOString(), '2026-01-10T10:00:00.000Z');
  assert.equal(parseDateTime('2026-01-10T11:00:00+01:00').toISOString(), '2026-01-10T10:00:00.000Z');
  assert.equal(parseDateTime('wczoraj'), null);
  assert.equal(parseDateTime('2026-01-10'), null);
  assert.equal(parseDateTime('2026-01-10T10:00:00'), null); // no time zone
  assert.equal(parseDateTime('2026-13-45T10:00:00Z'), null);
  assert.equal(parseDateTime(12345), null);
});

test('parseId: positive integers only', () => {
  assert.equal(parseId(5), 5);
  assert.equal(parseId('12'), 12);
  assert.equal(parseId('0'), null);
  assert.equal(parseId('-1'), null);
  assert.equal(parseId('1.5'), null);
  assert.equal(parseId('abc'), null);
  assert.equal(parseId(null), null);
});

test('gios: Warsaw time to UTC (winter, summer, change of time)', () => {
  assert.equal(warsawToUtc('2026-11-05 14:00:00').toISOString(), '2026-11-05T13:00:00.000Z'); // CET, +1
  assert.equal(warsawToUtc('2026-07-15 14:00:00').toISOString(), '2026-07-15T12:00:00.000Z'); // CEST, +2
  assert.equal(warsawToUtc('2026-03-29 01:00:00').toISOString(), '2026-03-29T00:00:00.000Z'); // just before the change
  assert.equal(warsawToUtc('2026-03-29 04:00:00').toISOString(), '2026-03-29T02:00:00.000Z'); // after the change
  assert.equal(warsawToUtc('nie data'), null);
});

test('synthetic: values stay inside the range', () => {
  const def = { minValue: 0, maxValue: 10, mid: 5, amplitude: 50, noise: 50 };
  for (let i = 0; i < 200; i++) {
    const v = valueAt(def, Date.now() + i * 600000);
    assert.ok(v >= 0 && v <= 10, `wartość ${v} poza przedziałem`);
  }
});
