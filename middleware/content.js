const { HttpError } = require('../errors');

// 406 when the client accepts nothing we can send
function requireJsonResponse(req, res, next) {
  if (!req.accepts(['json', 'application/problem+json'])) {
    return next(new HttpError(406, 'Dostępne są tylko odpowiedzi w formacie JSON.'));
  }
  next();
}

// 415 when the request has a body that is not JSON
// (an empty body, e.g. logout, is fine even without Content-Type)
function requireJsonBody(req, res, next) {
  const hasContent = Number(req.get('Content-Length')) > 0 || req.get('Transfer-Encoding');
  if (hasContent && !req.is('json')) {
    return next(new HttpError(415, 'Treść żądania musi mieć typ application/json.'));
  }
  next();
}

module.exports = { requireJsonResponse, requireJsonBody };
