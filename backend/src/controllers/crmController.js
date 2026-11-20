const jsforce = require('jsforce');
const oauth2 = require('../config/salesforce');
const { LIST_CONFIG, QueryParamError, parseListParams, buildListQueries } = require('../services/soql');
const { validateContact } = require('../services/validation');
const { sendSalesforceError } = require('../services/errors');

// Builds a Salesforce connection using the tokens stored in the session.
// Token never comes from the request body or frontend.
// With oauth2 + refreshToken, jsforce renews an expired access token automatically,
// and we save the new one back into the session so the next request uses it.
// Pinned API version: jsforce 1.x defaults to 42.0 (2018), and old versions get retired.
const SALESFORCE_API_VERSION = '62.0';

const getConnection = (req) => {
  const conn = new jsforce.Connection({
    oauth2,
    version: SALESFORCE_API_VERSION,
    accessToken: req.session.accessToken,
    refreshToken: req.session.refreshToken,
    instanceUrl: req.session.instanceUrl, // e.g. https://yourorg.salesforce.com
  });
  conn.on('refresh', (newAccessToken) => {
    req.session.accessToken = newAccessToken;
  });
  return conn;
};

// The handlers take the connection factory as a parameter (dependency injection),
// so tests can pass a fake connection instead of calling Salesforce.
const createCrmController = ({ connect = getConnection } = {}) => {

  // One handler per object: GET /api/accounts?limit=25&offset=0&search=acme&sort=Name&dir=ASC
  // Runs the page query and the COUNT() query in parallel.
  const listHandler = (objectName) => async (req, res) => {
    const config = LIST_CONFIG[objectName];
    let params;
    try {
      params = parseListParams(req.query, config);
    } catch (err) {
      if (err instanceof QueryParamError) return res.status(400).json({ error: err.message });
      throw err;
    }

    try {
      const conn = connect(req);
      const { dataSoql, countSoql } = buildListQueries(config, params);
      const [page, count] = await Promise.all([conn.query(dataSoql), conn.query(countSoql)]);
      res.json({
        records: page.records,
        totalSize: count.totalSize,
        limit: params.limit,
        offset: params.offset,
      });
    } catch (err) {
      sendSalesforceError(res, err, `list ${objectName}`);
    }
  };

  // Aggregate stats for the overview dashboard. Fires all SOQL queries in parallel.
  // stageBreakdown uses GROUP BY across ALL opportunities, so the chart is accurate
  // (it used to be built from only the 50 most recent records).
  const getStats = async (req, res) => {
    try {
      const conn = connect(req);
      const [accounts, contacts, opportunities, closedWon, closedWonRevenue, byStage] = await Promise.all([
        conn.query('SELECT COUNT() FROM Account'),
        conn.query('SELECT COUNT() FROM Contact'),
        conn.query('SELECT COUNT() FROM Opportunity'),
        conn.query("SELECT COUNT() FROM Opportunity WHERE StageName = 'Closed Won'"),
        conn.query("SELECT SUM(Amount) totalRevenue FROM Opportunity WHERE StageName = 'Closed Won'"),
        conn.query('SELECT StageName, COUNT(Id) cnt, SUM(Amount) total FROM Opportunity GROUP BY StageName'),
      ]);

      res.json({
        totalAccounts: accounts.totalSize,
        totalContacts: contacts.totalSize,
        totalOpportunities: opportunities.totalSize,
        closedWonCount: closedWon.totalSize,
        closedWonRevenue: closedWonRevenue.records[0]?.totalRevenue || 0,
        stageBreakdown: byStage.records.map((r) => ({
          stage: r.StageName,
          count: r.cnt,
          value: r.total || 0,
        })),
      });
    } catch (err) {
      sendSalesforceError(res, err, 'getStats');
    }
  };

  // Creates a new Contact record in Salesforce, after validating the input.
  // AccountId is optional — contact can exist without a parent account.
  // Uses jsforce sobject API instead of raw SOQL — simpler for DML operations.
  const createContact = async (req, res) => {
    const { payload, fieldErrors } = validateContact(req.body);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({ error: 'Validation failed', fieldErrors });
    }
    try {
      const conn = connect(req);
      const result = await conn.sobject('Contact').create(payload);
      res.status(201).json({ id: result.id }); // returns the new Salesforce record Id
    } catch (err) {
      sendSalesforceError(res, err, 'createContact');
    }
  };

  return {
    getAccounts: listHandler('accounts'),
    getContacts: listHandler('contacts'),
    getOpportunities: listHandler('opportunities'),
    getStats,
    createContact,
  };
};

module.exports = { ...createCrmController(), createCrmController, getConnection };
