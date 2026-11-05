const { HttpError } = require('../errors');

// 405 with the Allow header for methods a resource does not support
function methodNotAllowed(allowed) {
  return (req, res, next) => {
    res.set('Allow', allowed);
    next(new HttpError(405, `Metoda ${req.method} nie jest dozwolona dla tego zasobu.`));
  };
}

module.exports = { methodNotAllowed };
