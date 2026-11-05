// helpers for reading text from the request (path, query, body)

// date-time as in RFC 3339, e.g. 2026-01-10T10:00:00Z or 2026-01-10T11:00:00.5+01:00
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/i;

// returns a Date or null when the text is not a valid date-time
function parseDateTime(text) {
  if (typeof text !== 'string' || !DATE_TIME.test(text)) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

// positive integer given as a number or as text of digits, otherwise null
function parseId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value)) return Number(value);
  return null;
}

module.exports = { parseDateTime, parseId };
