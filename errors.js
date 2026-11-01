const { STATUS_CODES } = require('http');

// Error with an HTTP status, sent as Problem Details (RFC 9457)
class HttpError extends Error {
  constructor(status, detail, errors) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.errors = errors; // optional list of { field, message }
  }
}

// unknown route
function notFound(req, res, next) {
  next(new HttpError(404, 'Nie znaleziono zasobu.'));
}

// has to take 4 arguments, otherwise Express does not treat it as an error handler
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { type: 'about:blank', title: STATUS_CODES[status], status };

  // details only for client errors, never for internal ones
  if (status < 500) {
    if (err instanceof HttpError) {
      body.detail = err.detail;
      if (err.errors) body.errors = err.errors;
    } else if (err.type === 'entity.parse.failed') {
      body.detail = 'Niepoprawny JSON.';
    }
    body.instance = req.originalUrl;
    console.warn(`${req.method} ${req.originalUrl} -> ${status}: ${body.detail || body.title}`);
  } else {
    console.error(err);
  }

  res.status(status).type('application/problem+json').json(body);
}

module.exports = { HttpError, notFound, errorHandler };
