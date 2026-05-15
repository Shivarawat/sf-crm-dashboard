const jsforce = require('jsforce');
const oauth2 = require('../config/salesforce');

const login = (req, res) => {
  res.redirect(oauth2.getAuthorizationUrl({ scope: 'api refresh_token openid' }));
};

const callback = async (req, res) => {
  const { code } = req.query;
  try {
    const conn = new jsforce.Connection({ oauth2 });
    const userInfo = await conn.authorize(code);

    req.session.accessToken = conn.accessToken;
    req.session.refreshToken = conn.refreshToken;
    req.session.instanceUrl = conn.instanceUrl;
    req.session.userId = userInfo.id;

    res.redirect('http://localhost:3000/dashboard');

  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect('http://localhost:3000/?error=auth_failed');
  }
};

const logout = (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
};

const me = (req, res) => {
  res.json({
    userId: req.session.userId,
    instanceUrl: req.session.instanceUrl,
  });
};

module.exports = { login, callback, logout, me };
