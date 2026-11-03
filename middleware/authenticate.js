const { HttpError } = require('../errors');
const session = require('../models/session');

// "Authorization: Bearer <token>" -> req.admin and req.token
async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '');
  const admin = match && await session.find(match[1]);
  if (!admin) {
    res.set('WWW-Authenticate', 'Bearer');
    return next(new HttpError(401, 'Brak ważnego tokenu uwierzytelniającego.'));
  }
  req.admin = admin;
  req.token = match[1];
  next();
}

module.exports = { authenticate };
