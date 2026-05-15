const express = require('express');
const router = express.Router();
const { getAccounts, getContacts, getOpportunities, getStats, createContact } = require('../controllers/crmController');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth, getStats);
router.get('/accounts', requireAuth, getAccounts);
router.get('/contacts', requireAuth, getContacts);
router.get('/opportunities', requireAuth, getOpportunities);
router.post('/contacts', requireAuth, createContact);

module.exports = router;
