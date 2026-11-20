const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toHttpError } = require('../src/services/errors');

test('expired or invalid sessions become 401 so the UI can ask the user to log in again', () => {
  assert.equal(toHttpError({ errorCode: 'INVALID_SESSION_ID' }).status, 401);
  assert.equal(toHttpError({ name: 'INVALID_AUTH_HEADER' }).status, 401);
});

test('API limit becomes 429', () => {
  assert.equal(toHttpError({ errorCode: 'REQUEST_LIMIT_EXCEEDED' }).status, 429);
});

test('errors about the submitted data are shown to the user', () => {
  const { status, body } = toHttpError({ errorCode: 'DUPLICATES_DETECTED', message: 'Use one of these records?' });
  assert.equal(status, 400);
  assert.equal(body.error, 'Use one of these records?');
});

test('anything else is a generic 502 that hides Salesforce internals', () => {
  const { status, body } = toHttpError({ errorCode: 'MALFORMED_QUERY', message: 'unexpected token at SELECT Id, Secret__c' });
  assert.equal(status, 502);
  assert.ok(!body.error.includes('Secret__c'));
});
