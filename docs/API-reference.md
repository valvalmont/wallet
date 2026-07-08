# CredBridge API Reference

Base URL: `https://<your-backend>/api`

All protected routes require the header:
```
Authorization: Bearer <accessToken>
```

---

## Authentication

### `POST /auth/register`
Create a new user account. Also creates an Account with $0 balance.

**Body**
```json
{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "min8chars" }
```

**Response 201**
```json
{
  "accessToken": "<jwt>",
  "user": { "id": "uuid", "fullName": "Jane Doe", "email": "jane@example.com" }
}
```
Also sets an `httpOnly` `refreshToken` cookie (7-day expiry).

---

### `POST /auth/login`
**Body**
```json
{ "email": "jane@example.com", "password": "min8chars" }
```

**Response 200** — same shape as `/register`.

---

### `POST /auth/refresh`
Uses the `refreshToken` cookie (no body required).

**Response 200**
```json
{ "accessToken": "<new-jwt>" }
```

---

### `POST /auth/logout`
Clears the `refreshToken` cookie.

**Response 200**
```json
{ "message": "Logged out" }
```

---

## Account

### `GET /accounts/me` 🔒
Returns the authenticated user's balance and last 5 transactions.

**Response 200**
```json
{
  "balance": 1250.00,
  "currency": "USD",
  "recentTransactions": [ /* up to 5 Transaction objects */ ]
}
```

---

## Deposits

### `POST /deposits` 🔒
**Body**
```json
{ "amount": 500 }
```

Constraints: amount > 0, amount ≤ 1,000,000.

**Response 201**
```json
{
  "newBalance": 1750.00,
  "transaction": {
    "id": "uuid",
    "type": "deposit",
    "amount": 500,
    "status": "completed",
    "reference": "uuid",
    "createdAt": "2025-06-13T10:00:00.000Z"
  }
}
```

---

## BTC Transfers

### `GET /transfers/btc/rate` 🔒
Returns the current BTC/USD price from CoinGecko.

**Response 200**
```json
{ "btcUsdPrice": 67450.12, "timestamp": "2025-06-13T10:00:00.000Z" }
```

---

### `POST /transfers/btc` 🔒
Deducts USD, converts to BTC, and records the transfer.

**Body**
```json
{ "btcAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "usdAmount": 200 }
```

Constraints:
- Valid Bitcoin address (Legacy `1…`, P2SH `3…`, or SegWit `bc1…`)
- usdAmount > 0
- usdAmount ≤ account balance

**Response 201**
```json
{
  "transaction": { "id": "uuid", "type": "btc_transfer", "amount": 200, "status": "pending", ... },
  "btcAmount": 0.00296513,
  "btcRate": 67450.12,
  "reference": "uuid"
}
```

---

## Transactions

### `GET /transactions` 🔒
Paginated transaction history with optional filters.

**Query params**
| Param | Type   | Description |
|-------|--------|-------------|
| type  | string | `deposit` \| `btc_transfer` \| omit for all |
| from  | string | ISO date string (inclusive) |
| to    | string | ISO date string (inclusive) |
| page  | number | Default 1, page size 20 |

**Response 200**
```json
{
  "transactions": [ /* Transaction objects */ ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

---

### `GET /transactions/export` 🔒
Downloads a CSV of all matching transactions (same filter params as above).

**Response** — `Content-Type: text/csv`, triggers file download.

---

## Transaction Object
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "type": "deposit | btc_transfer",
  "amount": 200.00,
  "btcAddress": "bc1q…",
  "btcAmount": 0.00296513,
  "btcRate": 67450.12,
  "status": "pending | completed | failed",
  "reference": "uuid",
  "createdAt": "2025-06-13T10:00:00.000Z"
}
```

---

## Error Responses
All errors follow the shape:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation failed |
| 401 | Missing or expired token |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 500 | Internal server error |
