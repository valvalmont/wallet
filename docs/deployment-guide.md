# CredBridge Deployment Guide

## Overview
| Layer    | Recommended host   | Free tier? |
|----------|--------------------|------------|
| Database | Supabase / Neon    | ✅         |
| Backend  | Railway / Render   | ✅         |
| Frontend | Vercel / Netlify   | ✅         |

---

## 1. Database — Supabase (recommended)

1. Go to [supabase.com](https://supabase.com) → New project.
2. Copy the **Connection string** (URI format) from Settings → Database.
3. It looks like: `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`
4. Save this — you'll paste it as `DATABASE_URL` in the backend.

---

## 2. Backend — Railway

1. Push the repo to GitHub.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
3. Select the **`backend/`** directory as the root (or set **Root Directory** to `backend`).
4. Add these environment variables in the Railway dashboard:

```
DATABASE_URL=postgresql://...
JWT_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<another random 64-char string>
FRONTEND_URL=https://<your-vercel-url>.vercel.app
NODE_ENV=production
PORT=3000
```

5. Add a **Start Command**: `node server.js`
6. After deploy, run the Prisma migration once via Railway's shell:
   ```bash
   npx prisma migrate deploy
   ```
   Or use `db push` for a quicker first deploy:
   ```bash
   npx prisma db push
   ```
7. Copy your Railway public URL (e.g. `https://credbridge-api.up.railway.app`).

> **Generate secrets** — use `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` locally.

---

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Add environment variable:
   ```
   VITE_API_URL=https://<your-railway-url>/api
   ```
5. Deploy. Vercel auto-builds with `npm run build` and serves `dist/`.

---

## 4. Update CORS

Once you have the Vercel URL, go back to Railway and update:
```
FRONTEND_URL=https://<your-app>.vercel.app
```
Redeploy the backend for the change to take effect.

---

## 5. Smoke-test checklist

- [ ] `GET https://<api>/health` → `{ "status": "ok" }`
- [ ] Register a new user → receive `accessToken`
- [ ] Dashboard loads with $0.00 balance
- [ ] Deposit $100 → balance updates to $100.00
- [ ] BTC rate card shows a live price
- [ ] BTC transfer deducts balance and shows in history
- [ ] CSV export downloads a valid file
- [ ] Refresh page → still logged in (refresh token cookie works)
- [ ] Charts page loads TradingView widget and price history line

---

## Local development (quick reference)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env       # fill in values
npm install
npx prisma db push
npm run dev                # :3000

# Terminal 2 — frontend
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev                # :5173
```
