// Salesforce record ids are 15 or 18 alphanumeric characters
const isSalesforceId = (value) => typeof value === 'string' && /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(value);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field limits match the standard Contact fields, so Salesforce never rejects what we accept
const CONTACT_LIMITS = { FirstName: 40, LastName: 80, Email: 80, Phone: 40 };

// Returns { payload, fieldErrors }: payload holds only known, trimmed fields
function validateContact(body = {}) {
  const fieldErrors = {};
  const payload = {};

  for (const [field, max] of Object.entries(CONTACT_LIMITS)) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') continue;
    if (typeof raw !== 'string') { fieldErrors[field] = `${field} must be text`; continue; }
    const value = raw.trim();
    if (value.length > max) fieldErrors[field] = `${field} must be at most ${max} characters`;
    else if (value) payload[field] = value;
  }

  if (!payload.LastName && !fieldErrors.LastName) fieldErrors.LastName = 'Last name is required';
  if (payload.Email && !EMAIL_PATTERN.test(payload.Email)) fieldErrors.Email = 'Email is not valid';

  if (body.AccountId) {
    if (isSalesforceId(body.AccountId)) payload.AccountId = body.AccountId;
    else fieldErrors.AccountId = 'AccountId is not a valid Salesforce id';
  }

  return { payload, fieldErrors };
}

module.exports = { isSalesforceId, validateContact, CONTACT_LIMITS };
