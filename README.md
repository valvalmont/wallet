# CredBridge — Private Banking Platform

> A full-stack banking web app with USD account management, live BTC/USD market data, and Bitcoin wallet transfers.

---

## 🔗 Live Demo

| | URL |
|---|---|
| **Frontend** | `https://<your-app>.vercel.app` *(replace after deploy)* |
| **Backend API** | `https://<your-api>.up.railway.app` |

### Test Credentials
After running locally or deploying, register a new account via the UI.
For a pre-seeded demo account you can create one with:
```
Email:    demo@credbridge.io
Password: Demo1234!
```
*(Register it yourself on first run — no seed script needed.)*

---

## ✨ Features

| Feature | Details |
|---|---|
| Auth | Register / Login · bcrypt · JWT access (15 min) + httpOnly refresh cookie (7 days) |
| Auto token refresh | Axios interceptor silently refreshes; queues concurrent requests |
| Dashboard | Live balance · recent transactions · mini area chart |
| Deposit | USD deposit with quick-select amounts · simulated processing |
| BTC Transfer | Live CoinGecko rate · balance deduction · Legacy / P2SH / SegWit address validation |
| Charts | TradingView candlestick widget · 7 / 30 / 90-day price history · portfolio stats |
| Transactions | Paginated history · type + date filters · CSV export |
| BTCPriceCard | Reusable live ticker component (compact pill or full card) |

---

## 🗂 Project Structure

```
credbridge/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # User, Account, Transaction models
│   ├── routes/
│   │   ├── auth.js                # register · login · refresh · logout
│   │   ├── accounts.js            # GET /accounts/me
│   │   ├── deposits.js            # POST /deposits
│   │   ├── transfers.js           # GET /btc/rate · POST /btc
│   │   └── transactions.js        # GET / + /export (CSV)
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT Bearer verification
│   │   └── errorHandler.js        # Global error formatter
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state
│       ├── services/
│       │   ├── api.js             # Axios + auto-refresh interceptor
│       │   └── coinGecko.js       # BTC price · OHLC · history
│       ├── components/
│       │   ├── Layout.jsx         # Sidebar nav
│       │   └── BTCPriceCard.jsx   # Reusable live ticker
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── DashboardPage.jsx
│           ├── DepositPage.jsx
│           ├── TransferPage.jsx
│           ├── TransactionsPage.jsx
│           └── ChartsPage.jsx     # TradingView + Recharts history
│
├── docs/
│   ├── API-reference.md
│   ├── deployment-guide.md
│   └── architecture.md            # System diagram · Auth flow · ERD
│
├── .gitignore
└── README.md
```

---

## 🛠 Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React 18 + Vite | SPA framework + dev server |
| React Router v6 | Client-side routing, protected routes |
| Tailwind CSS | Utility-first styling |
| Recharts | Portfolio performance area chart |
| TradingView Widget | Candlestick chart (embedded script) |
| Axios | HTTP client with interceptors |
| Lucide React | Icons |

### Backend
| Library | Purpose |
|---|---|
| Express | HTTP server, routing, middleware |
| Prisma ORM | Type-safe DB queries + migrations |
| PostgreSQL | Relational database |
| bcrypt | Password hashing (12 rounds) |
| jsonwebtoken | JWT access + refresh tokens |
| axios | CoinGecko BTC rate fetch |
| cookie-parser | Read httpOnly refresh cookie |

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- A PostgreSQL database (local or Supabase/Neon free tier)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma db push        # creates tables (use migrate dev for tracked migrations)
npm run dev               # starts on http://localhost:3000
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev               # starts on http://localhost:5173
```

---

## 📦 Deployment

See [`docs/deployment-guide.md`](./docs/deployment-guide.md) for the full step-by-step walkthrough (Railway + Vercel + Supabase).

Quick summary:
1. Provision a PostgreSQL DB (Supabase)
2. Deploy backend to Railway — set env vars — run `npx prisma db push`
3. Deploy frontend to Vercel — set `VITE_API_URL`
4. Update `FRONTEND_URL` on backend with the Vercel URL

---

## 📖 API Docs

See [`docs/API-reference.md`](./docs/API-reference.md) for all endpoints, request/response shapes, and error codes.

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- Access tokens expire in 15 minutes
- Refresh tokens are httpOnly cookies (not accessible from JS)
- CORS restricted to `FRONTEND_URL` only
- All unhandled errors go through `errorHandler.js` — no raw stack traces in production
- `.env` files excluded from git via `.gitignore`
