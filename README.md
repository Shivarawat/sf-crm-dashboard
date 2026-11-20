# Salesforce CRM Dashboard

A full-stack web application that connects to your Salesforce org via OAuth and provides a clean dashboard to view and manage CRM data.

## Features

- **Salesforce OAuth 2.0** — secure login via Connected App
- **Overview Dashboard** — stat cards and a bar chart of opportunities by stage, aggregated across *all* opportunities with SOQL `GROUP BY`
- **Server-side pagination, search and sorting** — every table pages through the full org (tested with 1,000+ contacts), searches name and picklist fields in SOQL, and sorts by clicking a column
- **Accounts, Contacts, Opportunities** — with stage badges, related account names, and contact creation
- **Validated contact creation** — field-level errors (email format, lengths, account id) shown under each input
- **CSV Export** — exports the current page, with quoting and spreadsheet-formula protection
- **Session handling** — expired access tokens are refreshed automatically; if the session is gone, the app returns to the login page

## Tech Stack

**Frontend:** React, TypeScript, Recharts, Axios  
**Backend:** Node.js, Express.js, jsforce, express-session  
**Auth:** Salesforce OAuth 2.0 (Connected App)  
**API:** Salesforce REST API via jsforce

## API

All `/api` routes need a logged-in session.

| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/stats` | Counts, closed-won revenue, `stageBreakdown` |
| `GET` | `/api/accounts` | `?limit=25&offset=0&search=&sort=Name&dir=ASC` |
| `GET` | `/api/contacts` | same params; sort by `LastName`, `Email`, `CreatedDate` |
| `GET` | `/api/opportunities` | same params; sort by `Name`, `StageName`, `Amount`, `CloseDate`, `CreatedDate` |
| `POST` | `/api/contacts` | `{ FirstName, LastName, Email, Phone, AccountId }` → `201 { id }` or `400 { error, fieldErrors }` |

List responses: `{ records, totalSize, limit, offset }`. `limit` is 1–200, and `offset` is at most 2000 (Salesforce's OFFSET limit).

**Safety:** sort fields and directions are whitelisted, and search text is escaped (quotes, backslashes, `%`, `_`) before it reaches SOQL. Salesforce errors map to `401` (session expired), `429` (API limit), `400` (bad data), or a generic `502` that doesn't leak internals.

## Tests

```bash
cd backend && npm test                       # 22 node:test tests: SOQL builder, escaping, validation, error mapping, controllers
cd frontend && CI=true npm test              # 13 Jest + React Testing Library tests: pagination, paged table, CSV, login
```

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
│       ├── routes/        # auth + api routes
│       └── services/      # SOQL builder, validation, Salesforce error mapping
│   └── test/              # node:test tests
└── frontend/
    └── src/
        ├── components/    # PagedTable, Pagination, StatCard, CreateContactModal
        ├── context/       # AuthContext (also logs out on 401)
        ├── hooks/         # usePagedList: server-side paging, debounced search, sorting
        ├── pages/         # Login, Dashboard
        └── utils/         # axios instance, CSV export
```

## Screenshots

> Coming soon

## License

MIT
