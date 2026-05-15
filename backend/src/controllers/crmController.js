const jsforce = require('jsforce');

const getConnection = (req) => {
  return new jsforce.Connection({
    accessToken: req.session.accessToken,
    instanceUrl: req.session.instanceUrl,
  });
};

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

const createContact = async (req, res) => {
  const { FirstName, LastName, Email, Phone, AccountId } = req.body;
  if (!LastName) return res.status(400).json({ error: 'Last name is required' });
  try {
    const conn = getConnection(req);
    const payload = { FirstName, LastName, Email, Phone };
    if (AccountId) payload.AccountId = AccountId;
    const result = await conn.sobject('Contact').create(payload);
    res.status(201).json({ id: result.id });
  } catch (err) {
    console.error('createContact error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAccounts, getContacts, getOpportunities, getStats, createContact };
