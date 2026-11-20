const jsforce = require('jsforce');

// Builds a Salesforce connection using the access token stored in the session.
// Called at the start of every CRM handler — token never comes from the request body or frontend.
const getConnection = (req) => {
  return new jsforce.Connection({
    accessToken: req.session.accessToken,
    instanceUrl: req.session.instanceUrl, // e.g. https://yourorg.salesforce.com
  });
};

// Returns the 50 most recently created Accounts.
// Account.Name in SOQL is a direct field — no JOIN needed unlike SQL.
const getAccounts = async (req, res) => {
  try {
    const conn = getConnection(req);
    const result = await conn.query(
      'SELECT Id, Name, Industry, AnnualRevenue, Phone, Website, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT 50'
    );
    res.json(result.records);
  } catch (err) {
    console.error('getAccounts error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Returns the 50 most recently created Contacts.
// Account.Name uses SOQL relationship traversal — pulls parent Account name without a JOIN.
const getContacts = async (req, res) => {
  try {
    const conn = getConnection(req);
    const result = await conn.query(
      'SELECT Id, FirstName, LastName, Email, Phone, Account.Name, CreatedDate FROM Contact ORDER BY CreatedDate DESC LIMIT 50'
    );
    res.json(result.records);
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Returns the 50 most recently created Opportunities with their parent Account name.
const getOpportunities = async (req, res) => {
  try {
    const conn = getConnection(req);
    const result = await conn.query(
      'SELECT Id, Name, StageName, Amount, CloseDate, Account.Name, CreatedDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT 50'
    );
    res.json(result.records);
  } catch (err) {
    console.error('getOpportunities error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Returns aggregate stats for the overview dashboard.
// Fires 5 SOQL queries in parallel using Promise.all — faster than sequential awaits.
const getStats = async (req, res) => {
  try {
    const conn = getConnection(req);
    const [accounts, contacts, opportunities, closedWon, closedWonRevenue] = await Promise.all([
      conn.query('SELECT COUNT() FROM Account'),
      conn.query('SELECT COUNT() FROM Contact'),
      conn.query('SELECT COUNT() FROM Opportunity'),
      conn.query("SELECT COUNT() FROM Opportunity WHERE StageName = 'Closed Won'"),
      conn.query("SELECT SUM(Amount) totalRevenue FROM Opportunity WHERE StageName = 'Closed Won'"),
    ]);

    res.json({
      totalAccounts: accounts.totalSize,
      totalContacts: contacts.totalSize,
      totalOpportunities: opportunities.totalSize,
      closedWonCount: closedWon.totalSize,
      closedWonRevenue: closedWonRevenue.records[0]?.totalRevenue || 0,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Creates a new Contact record in Salesforce.
// AccountId is optional — contact can exist without a parent account.
// Uses jsforce sobject API instead of raw SOQL — simpler for DML operations.
const createContact = async (req, res) => {
  const { FirstName, LastName, Email, Phone, AccountId } = req.body;
  if (!LastName) return res.status(400).json({ error: 'Last name is required' });
  try {
    const conn = getConnection(req);
    const payload = { FirstName, LastName, Email, Phone };
    if (AccountId) payload.AccountId = AccountId; // link to account only if provided
    const result = await conn.sobject('Contact').create(payload);
    res.status(201).json({ id: result.id }); // returns the new Salesforce record Id
  } catch (err) {
    console.error('createContact error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAccounts, getContacts, getOpportunities, getStats, createContact };
