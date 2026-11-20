const express = require('express');
const router = express.Router();
const { login, callback, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Redirects browser to Salesforce login page
router.get('/login', login);

// Salesforce redirects here after user logs in — exchanges auth code for access token
router.get('/callback', callback);

// Destroys the session — user is logged out
router.get('/logout', requireAuth, logout);

// Returns the current logged-in user's info from session — frontend calls this on every page load
router.get('/me', requireAuth, me);

module.exports = router;
