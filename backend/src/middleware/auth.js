// Middleware that protects routes — if no access token in session, reject with 401.
// Sits between the route and the controller. If check passes, calls next() to continue.
const requireAuth = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

module.exports = { requireAuth };
