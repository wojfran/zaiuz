const { HttpError } = require('../errors');

const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;

// failed logins per IP address: { count, since }; kept in memory, so a restart clears it
const failures = new Map();

// blocks an address after too many failed logins (429), a successful login resets the counter
function loginLimit(req, res, next) {
  const now = Date.now();
  for (const [ip, entry] of failures) {
    if (now - entry.since > WINDOW_MS) failures.delete(ip);
  }

  const entry = failures.get(req.ip);
  if (entry && entry.count >= MAX_FAILURES) {
    const wait = Math.ceil((entry.since + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(wait));
    return next(new HttpError(429, 'Zbyt wiele nieudanych prób logowania. Spróbuj później.'));
  }

  // the status is known only after the controller has answered
  res.on('finish', () => {
    if (res.statusCode === 401) {
      const e = failures.get(req.ip) || { count: 0, since: Date.now() };
      e.count += 1;
      failures.set(req.ip, e);
    } else if (res.statusCode === 200) {
      failures.delete(req.ip);
    }
  });
  next();
}

module.exports = { loginLimit };
