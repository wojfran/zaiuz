const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { loginLimit } = require('../middleware/loginLimit');
const { checkId } = require('../middleware/params');
const auth = require('../controllers/auth');
const series = require('../controllers/series');

const router = express.Router();

// every :seriesId in a path goes through the id check first
router.param('seriesId', checkId);

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

module.exports = router;
