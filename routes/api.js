const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { loginLimit } = require('../middleware/loginLimit');
const { checkId } = require('../middleware/params');
const { methodNotAllowed } = require('../middleware/methods');
const auth = require('../controllers/auth');
const series = require('../controllers/series');
const sensors = require('../controllers/sensors');
const measurements = require('../controllers/measurements');

const router = express.Router();

// every id in a path goes through the id check first
router.param('seriesId', checkId);
router.param('sensorId', checkId);
router.param('measurementId', checkId);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/auth/login', loginLimit, auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.put('/auth/password', authenticate, auth.changePassword);

router.get('/series', series.list);
router.post('/series', authenticate, series.create);
router.get('/series/:seriesId', series.get);
router.put('/series/:seriesId', authenticate, series.update);
router.delete('/series/:seriesId', authenticate, series.remove);

router.get('/sensors', authenticate, sensors.list);
router.post('/sensors', authenticate, sensors.create);
router.get('/sensors/:sensorId', authenticate, sensors.get);
router.delete('/sensors/:sensorId', authenticate, sensors.remove);

// results are written only by sensors (X-API-Key) and are never changed or deleted
router.get('/measurements', measurements.list);
router.post('/measurements', measurements.create);
router.get('/measurements/:measurementId', measurements.get);
router.all('/measurements/:measurementId', methodNotAllowed('GET'));

module.exports = router;
