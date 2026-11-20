const jsforce = require('jsforce');
const oauth2 = require('../config/salesforce');

// Step 1 of OAuth — redirects browser to Salesforce's login page.
// Salesforce shows its own login UI; user enters credentials there, not on our app.
const login = (req, res) => {
  res.redirect(oauth2.getAuthorizationUrl({ scope: 'api refresh_token openid' }));
};

// Step 2 of OAuth — Salesforce redirects here with a one-time auth code in the URL query string.
// We exchange that code for a real access token by calling conn.authorize(code).
// The access token is stored in the server-side session — never sent to the browser.
const callback = async (req, res) => {
  const { code } = req.query;
  try {
    const conn = new jsforce.Connection({ oauth2 });
    const userInfo = await conn.authorize(code); // exchanges code → access token

    // Store token server-side — browser never sees it (prevents XSS token theft)
    req.session.accessToken = conn.accessToken;
    req.session.refreshToken = conn.refreshToken;
    req.session.instanceUrl = conn.instanceUrl; // e.g. https://yourorg.salesforce.com
    req.session.userId = userInfo.id;

    const frontendUrl = process.env.FRONTEND_URL || 'https://sf-crm-dashboard.vercel.app';
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'https://sf-crm-dashboard.vercel.app';
    res.redirect(`${frontendUrl}/?error=auth_failed`);
  }
};

// Destroys the session so the access token is gone — user must re-authenticate
const logout = (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
};

// Returns basic user info from session — called by frontend AuthContext on every page load
// to check if the user is still logged in
const me = (req, res) => {
  res.json({
    userId: req.session.userId,
    instanceUrl: req.session.instanceUrl,
  });
};

module.exports = { login, callback, logout, me };
