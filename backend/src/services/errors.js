// Map Salesforce errors to HTTP responses. Internal details are logged, not sent to the browser.
const SESSION_ERRORS = ['INVALID_SESSION_ID', 'INVALID_AUTH_HEADER'];

// Errors about the data the user sent, safe and useful to show them
const USER_DATA_ERRORS = [
  'REQUIRED_FIELD_MISSING', 'INVALID_EMAIL_ADDRESS', 'STRING_TOO_LONG',
  'DUPLICATES_DETECTED', 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'INVALID_CROSS_REFERENCE_KEY',
];

function toHttpError(err) {
  const code = err && (err.errorCode || err.name);
  if (SESSION_ERRORS.includes(code)) {
    return { status: 401, body: { error: 'Your Salesforce session has expired. Please log in again.' } };
  }
  if (code === 'REQUEST_LIMIT_EXCEEDED') {
    return { status: 429, body: { error: 'Salesforce API limit reached. Please try again later.' } };
  }
  if (USER_DATA_ERRORS.includes(code)) {
    return { status: 400, body: { error: err.message } };
  }
  return { status: 502, body: { error: 'Salesforce request failed. Please try again.' } };
}

function sendSalesforceError(res, err, context) {
  console.error(`${context} error:`, err && (err.errorCode || err.name), err && err.message);
  const { status, body } = toHttpError(err);
  res.status(status).json(body);
}

module.exports = { toHttpError, sendSalesforceError };
