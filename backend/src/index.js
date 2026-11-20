require('dotenv').config();

process.on('uncaughtException', (err) => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', (err) => console.error('UNHANDLED:', err));

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const crmRoutes = require('./routes/crm');

const app = express();

// Render sits behind a proxy — this tells Express to trust the proxy so it knows the connection is HTTPS.
// Without this, secure cookies won't be set even on HTTPS.
app.set('trust proxy', 1);

// Allow requests from the frontend domain. credentials:true is required so the browser sends cookies cross-origin.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Session middleware — stores the Salesforce access token server-side.
// secure:true + sameSite:'none' is required for cross-origin cookies (frontend on Vercel, backend on Render).
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,       // only send cookie over HTTPS
    httpOnly: true,     // JS in the browser cannot read this cookie (XSS protection)
    sameSite: 'none',   // allow cookie to be sent cross-origin
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// /auth routes — login, callback, logout, me
app.use('/auth', authRoutes);

// /api routes — accounts, contacts, opportunities, stats, create contact
app.use('/api', crmRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
