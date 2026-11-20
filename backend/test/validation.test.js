const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateContact, isSalesforceId } = require('../src/services/validation');

test('accepts a valid contact and trims the values', () => {
  const { payload, fieldErrors } = validateContact({ FirstName: ' Ada ', LastName: 'Lovelace', Email: 'ada@example.com', AccountId: '001hg00000AbCdEAAA' });
  assert.deepEqual(fieldErrors, {});
  assert.deepEqual(payload, { FirstName: 'Ada', LastName: 'Lovelace', Email: 'ada@example.com', AccountId: '001hg00000AbCdEAAA' });
});

test('reports every problem at once', () => {
  const { fieldErrors } = validateContact({ LastName: '   ', Email: 'nope', Phone: '1'.repeat(41), AccountId: "x' OR" });
  assert.deepEqual(Object.keys(fieldErrors).sort(), ['AccountId', 'Email', 'LastName', 'Phone']);
});

test('drops fields it does not know about', () => {
  const { payload } = validateContact({ LastName: 'Hopper', OwnerId: '005000000000001', IsDeleted: true });
  assert.deepEqual(payload, { LastName: 'Hopper' });
});

test('rejects non-text values', () => {
  const { fieldErrors } = validateContact({ LastName: { $ne: '' } });
  assert.equal(fieldErrors.LastName, 'LastName must be text');
});

test('recognises 15- and 18-character Salesforce ids', () => {
  assert.ok(isSalesforceId('001hg00000AbCdE'));
  assert.ok(isSalesforceId('001hg00000AbCdEAAA'));
  assert.equal(isSalesforceId('001hg00000AbCd'), false);
  assert.equal(isSalesforceId(42), false);
});
