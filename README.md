# CashTrail 🍃

CashTrail — A full-stack personal finance tracker built with React and Express. Users can log income and expenses, organize them by category, and follow their spending trail through an interactive dashboard.

**Stack:** React (Vite) + Tailwind CSS + Zustand + Recharts · Express + Prisma + PostgreSQL · JWT auth · Zod validation

## Features

- Register / login with JWT-based auth (bcrypt-hashed passwords), plus Google sign-in
- All amounts in Indonesian Rupiah (IDR)
- Income & expense transactions with full CRUD
- Per-user categories (13 sensible defaults seeded on signup, plus custom ones with icon & color)
- Dashboard: monthly summary tiles, 6-month income-vs-expense trend, spending by category
- Transaction filters: date range, category, type, description search, pagination

Planned: recurring transactions, budgets with alerts, CSV/PDF export, multi-currency.

## Getting started

Requires Node 20+ and a local PostgreSQL server.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # adjust DATABASE_URL if your Postgres credentials differ
npx prisma migrate dev
npm run dev            # API on http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev            # app on http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173, create an account, and start tracking.

### 3. Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (type: Web application).
2. Add `http://localhost:5173` to **Authorized JavaScript origins**.
3. Put the client ID in both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`), then restart both dev servers.

The "Continue with Google" button only renders when `VITE_GOOGLE_CLIENT_ID` is set. Signing in with Google links to an existing account with the same email, or creates a new one.

### API smoke test

With the server running: `cd server && node smoke-test.mjs` (expects a `test@example.com` / `password123` account; register it first via the app or the register endpoint).

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (seeds default categories) |
| POST | `/api/auth/login` | Log in, returns JWT |
| POST | `/api/auth/google` | Sign in with a Google ID token (creates or links account) |
| GET | `/api/auth/me` | Current user |
| GET/POST/PUT/DELETE | `/api/categories[/:id]` | Category CRUD |
| GET/POST/PUT/DELETE | `/api/transactions[/:id]` | Transaction CRUD + filters (`from`, `to`, `category`, `type`, `search`, `page`, `pageSize`) |
| GET | `/api/analytics/summary?month=YYYY-MM` | Income / expense / balance for a month |
| GET | `/api/analytics/balance` | All-time income, expense, and total balance |
| GET | `/api/analytics/by-category?month=YYYY-MM` | Spend grouped by category |
| GET | `/api/analytics/trend?months=N` | Monthly income/expense series |

All routes except register/login require `Authorization: Bearer <token>`.
