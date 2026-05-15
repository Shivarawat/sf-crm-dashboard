# Salesforce CRM Dashboard

A full-stack web application that connects to your Salesforce org via OAuth and provides a clean dashboard to view and manage CRM data.

## Features

- **Salesforce OAuth 2.0** — secure login via Connected App
- **Overview Dashboard** — stat cards and bar chart of opportunities by stage
- **Accounts** — view all accounts with industry, revenue, and phone
- **Contacts** — view, search, and create contacts linked to accounts
- **Opportunities** — view pipeline with stage badges and close dates
- **CSV Export** — export any table to CSV with one click
- **Search** — filter records instantly on any tab

## Tech Stack

**Frontend:** React, TypeScript, Recharts, Axios  
**Backend:** Node.js, Express.js, jsforce, express-session  
**Auth:** Salesforce OAuth 2.0 (Connected App)  
**API:** Salesforce REST API via jsforce

## Getting Started

### Prerequisites

- Node.js 18+
- A [Salesforce Developer Edition](https://developer.salesforce.com/signup) account

### 1. Create a Salesforce Connected App

1. Setup → App Manager → New Connected App
2. Enable OAuth, set callback URL to `http://localhost:5001/auth/callback`
3. Add scopes: `api`, `refresh_token`, `openid`
4. Disable PKCE requirement
5. Save and copy Consumer Key and Secret

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
SF_CALLBACK_URL=http://localhost:5001/auth/callback
SF_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=any_random_string
PORT=5001
```

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) and click **Login with Salesforce**.

## Project Structure

```
sf-crm-dashboard/
├── backend/
│   └── src/
│       ├── config/        # jsforce OAuth setup
│       ├── controllers/   # auth + CRM logic
│       ├── middleware/    # session auth guard
│       └── routes/        # auth + api routes
└── frontend/
    └── src/
        ├── components/    # StatCard, CreateContactModal
        ├── context/       # AuthContext
        ├── pages/         # Login, Dashboard
        └── utils/         # axios instance, CSV export
```

## Screenshots

> Coming soon

## License

MIT
