const express = require('express');
const router = express.Router();
const { getAccounts, getContacts, getOpportunities, getStats, createContact } = require('../controllers/crmController');
const { requireAuth } = require('../middleware/auth');

// All routes are protected by requireAuth — checks session has a valid access token before proceeding

router.get('/stats', requireAuth, getStats);               // aggregate counts + closed won revenue
router.get('/accounts', requireAuth, getAccounts);         // list of Account records
router.get('/contacts', requireAuth, getContacts);         // list of Contact records
router.get('/opportunities', requireAuth, getOpportunities); // list of Opportunity records
router.post('/contacts', requireAuth, createContact);      // create a new Contact in Salesforce

module.exports = router;
