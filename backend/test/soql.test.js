const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LIST_CONFIG, escapeLike, parseListParams, buildListQueries, QueryParamError } = require('../src/services/soql');

const accounts = LIST_CONFIG.accounts;

test('escapes quotes, backslashes and LIKE wildcards', () => {
  assert.equal(escapeLike("O'Brien"), "O\\'Brien");
  assert.equal(escapeLike('100%_off'), '100\\%\\_off');
  assert.equal(escapeLike('a\\b'), 'a\\\\b');
});

test('uses safe defaults when no params are given', () => {
  assert.deepEqual(parseListParams({}, accounts), { limit: 25, offset: 0, search: '', sort: 'CreatedDate', dir: 'DESC' });
});

test('accepts valid params from the query string', () => {
  const p = parseListParams({ limit: '10', offset: '20', search: '  acme ', sort: 'Name', dir: 'asc' }, accounts);
  assert.deepEqual(p, { limit: 10, offset: 20, search: 'acme', sort: 'Name', dir: 'ASC' });
});

test('rejects out-of-range or unknown params', () => {
  for (const bad of [{ limit: '0' }, { limit: '201' }, { limit: 'ten' }, { offset: '-1' }, { offset: '2001' },
    { sort: 'Password' }, { dir: 'SIDEWAYS' }, { search: 'x'.repeat(101) }]) {
    assert.throws(() => parseListParams(bad, accounts), QueryParamError, JSON.stringify(bad));
  }
});

test('builds the page query and the count query without a search', () => {
  const { dataSoql, countSoql } = buildListQueries(accounts, { limit: 25, offset: 50, search: '', sort: 'Name', dir: 'ASC' });
  assert.equal(dataSoql, 'SELECT Id, Name, Industry, AnnualRevenue, Phone, Website, CreatedDate FROM Account ORDER BY Name ASC NULLS FIRST, Id ASC LIMIT 25 OFFSET 50');
  assert.equal(countSoql, 'SELECT COUNT() FROM Account');
});

test('searches every search field, with the term escaped', () => {
  const { dataSoql, countSoql } = buildListQueries(accounts, { limit: 25, offset: 0, search: "O'Brien", sort: 'CreatedDate', dir: 'DESC' });
  const where = "WHERE (Name LIKE '%O\\'Brien%' OR Industry LIKE '%O\\'Brien%')";
  assert.ok(dataSoql.includes(where), dataSoql);
  assert.ok(countSoql.endsWith(where), countSoql);
});

test('an injection attempt stays inside the string literal', () => {
  const { countSoql } = buildListQueries(accounts, { limit: 1, offset: 0, search: "x' OR Name != '", sort: 'Name', dir: 'ASC' });
  // every quote from the user is escaped, so the only unescaped quotes are ours
  const unescapedQuotes = countSoql.match(/(?<!\\)'/g).length;
  assert.equal(unescapedQuotes, 4); // two LIKE literals, each opened and closed once
});
