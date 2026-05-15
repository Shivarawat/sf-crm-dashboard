const express = require('express');
const router = express.Router();
const { login, callback, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/login', login);
router.get('/callback', callback);
router.get('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;
