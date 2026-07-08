/**
 * coinGecko.js
 * Lightweight wrapper around the CoinGecko public API.
 * Caches the last response for 60 s so multiple components
 * can call fetchBtcPrice() without hammering the endpoint.
 */

const CACHE_TTL_MS = 60_000;

let cache = {
  price: null,
  change24h: null,
  high24h: null,
  low24h: null,
  fetchedAt: 0,
};

/**
 * Returns { price, change24h, high24h, low24h, fetchedAt }
 * Uses the free CoinGecko /simple/price endpoint.
 */
export async function fetchBtcPrice() {
  const now = Date.now();
  if (cache.price !== null && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache };
  }

  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price' +
      '?ids=bitcoin&vs_currencies=usd' +
      '&include_24hr_change=true' +
      '&include_24hr_vol=true' +
      '&include_last_updated_at=true',
    { signal: AbortSignal.timeout(6000) }
  );

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();

  cache = {
    price: data.bitcoin.usd,
    change24h: data.bitcoin.usd_24h_change ?? null,
    high24h: null,   // not available on /simple/price
    low24h: null,
    fetchedAt: now,
  };

  return { ...cache };
}

/**
 * Fetches OHLC candle data for the last `days` days.
 * Returns an array of { time, open, high, low, close }.
 */
export async function fetchBtcOhlc(days = 30) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`CoinGecko OHLC error: ${res.status}`);
  const raw = await res.json();
  // raw: [[timestamp, open, high, low, close], ...]
  return raw.map(([timestamp, open, high, low, close]) => ({
    time: Math.floor(timestamp / 1000), // seconds for TradingView
    open, high, low, close,
  }));
}

/**
 * Fetches daily close prices for the portfolio performance line.
 * Returns [{ date: 'YYYY-MM-DD', price: number }, ...]
 */
export async function fetchBtcHistory(days = 30) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart` +
      `?vs_currency=usd&days=${days}&interval=daily`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`CoinGecko history error: ${res.status}`);
  const data = await res.json();
  return data.prices.map(([ts, price]) => ({
    date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: Math.round(price),
  }));
}
