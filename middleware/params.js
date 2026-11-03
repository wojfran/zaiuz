const { HttpError } = require('../errors');

// router.param handler: a path id must be a positive integer, otherwise there is no such resource
function checkId(req, res, next, value) {
  if (!/^[1-9]\d{0,9}$/.test(value)) {
    return next(new HttpError(404, 'Nie znaleziono zasobu.'));
  }
  next();
}

module.exports = { checkId };
