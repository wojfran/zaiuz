const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const auth = require('../controllers/auth');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/auth/login', auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.put('/auth/password', authenticate, auth.changePassword);

module.exports = router;
