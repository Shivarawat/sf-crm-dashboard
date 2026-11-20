const jsforce = require('jsforce');

// OAuth2 config for Salesforce — used to build the authorization URL and exchange the auth code for a token.
// clientId and clientSecret come from the Connected App created in Salesforce Setup.
// redirectUri must match exactly what's registered in the Connected App callback URLs.
const oauth2 = new jsforce.OAuth2({
  loginUrl: process.env.SF_LOGIN_URL,       // https://login.salesforce.com
  clientId: process.env.SF_CLIENT_ID,       // Connected App Consumer Key
  clientSecret: process.env.SF_CLIENT_SECRET, // Connected App Consumer Secret
  redirectUri: process.env.SF_CALLBACK_URL, // where Salesforce sends the auth code after login
});

module.exports = oauth2;
