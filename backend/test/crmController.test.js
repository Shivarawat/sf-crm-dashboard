const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCrmController } = require('../src/controllers/crmController');

// Records every SOQL query and returns canned results
function fakeConnection({ fail } = {}) {
  const queries = [];
  const created = [];
  return {
    queries,
    created,
    query: async (soql) => {
      queries.push(soql);
      if (fail) throw fail;
      if (soql.startsWith('SELECT COUNT()')) return { totalSize: 132, records: [] };
      if (soql.includes('GROUP BY StageName')) return { records: [{ StageName: 'Closed Won', cnt: 3, total: 900 }, { StageName: 'Prospecting', cnt: 2, total: null }] };
      if (soql.includes('SUM(Amount)')) return { records: [{ totalRevenue: 900 }] };
      return { totalSize: 2, records: [{ Id: '001A', Name: 'Acme' }, { Id: '001B', Name: 'Globex' }] };
    },
    sobject: () => ({ create: async (payload) => { created.push(payload); return { id: '003NEW' }; } }),
  };
}

function call(handler, req = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); },
    };
    handler({ query: {}, body: {}, session: {}, ...req }, res);
  });
}

test('lists a page together with the total count', async () => {
  const conn = fakeConnection();
  const ctrl = createCrmController({ connect: () => conn });

  const res = await call(ctrl.getAccounts, { query: { limit: '2', offset: '4' } });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { records: [{ Id: '001A', Name: 'Acme' }, { Id: '001B', Name: 'Globex' }], totalSize: 132, limit: 2, offset: 4 });
  assert.ok(conn.queries.some((q) => q.endsWith('LIMIT 2 OFFSET 4')));
});

test('bad query params get a 400 before Salesforce is called', async () => {
  const conn = fakeConnection();
  const res = await call(createCrmController({ connect: () => conn }).getContacts, { query: { sort: 'Password' } });
  assert.equal(res.status, 400);
  assert.equal(conn.queries.length, 0);
});

test('stats include a stage breakdown across all opportunities', async () => {
  const res = await call(createCrmController({ connect: () => fakeConnection() }).getStats);
  assert.equal(res.status, 200);
  assert.equal(res.body.totalAccounts, 132);
  assert.equal(res.body.closedWonRevenue, 900);
  assert.deepEqual(res.body.stageBreakdown, [
    { stage: 'Closed Won', count: 3, value: 900 },
    { stage: 'Prospecting', count: 2, value: 0 },
  ]);
});

test('an expired session returns 401', async () => {
  const conn = fakeConnection({ fail: Object.assign(new Error('Session expired'), { errorCode: 'INVALID_SESSION_ID' }) });
  const res = await call(createCrmController({ connect: () => conn }).getOpportunities);
  assert.equal(res.status, 401);
});

test('invalid contacts are rejected with field errors and never sent to Salesforce', async () => {
  const conn = fakeConnection();
  const res = await call(createCrmController({ connect: () => conn }).createContact, { body: { Email: 'bad' } });
  assert.equal(res.status, 400);
  assert.ok(res.body.fieldErrors.LastName);
  assert.equal(conn.created.length, 0);
});

test('valid contacts are created with only the cleaned fields', async () => {
  const conn = fakeConnection();
  const res = await call(createCrmController({ connect: () => conn }).createContact, { body: { LastName: ' Hopper ', OwnerId: 'x' } });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: '003NEW' });
  assert.deepEqual(conn.created, [{ LastName: 'Hopper' }]);
});
