import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Bitcoin } from 'lucide-react';
import { fetchBtcPrice } from '../services/coinGecko';

export default function BTCPriceCard({ compact = false, interval = 60_000 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [flash, setFlash] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(false);
      const result = await fetchBtcPrice();
      setData(result);
      setLastUpdated(new Date());
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  const up = data?.change24h >= 0;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm">
        <Bitcoin size={13} className="text-amber-500" />
        {loading ? (
          <span className="text-gray-400 text-xs">Loading…</span>
        ) : error ? (
          <span className="text-red-400 text-xs">Unavailable</span>
        ) : (
          <>
            <span className="font-semibold text-gray-900 text-xs">
              ${data.price.toLocaleString()}
            </span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
              {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(data.change24h).toFixed(2)}%
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Bitcoin size={17} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">Bitcoin</p>
            <p className="text-[11px] text-gray-400">BTC / USD</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
          title="Refresh"
        >
          <RefreshCw size={13} className={`text-gray-300 hover:text-gray-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-3.5 w-20 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-400">
          Could not load price.{' '}
          <button onClick={refresh} className="underline hover:text-red-500">Retry</button>
        </div>
      ) : (
        <>
          <p className={`text-2xl font-bold tracking-tight text-gray-900 transition-colors duration-300 ${flash ? 'text-indigo-600' : ''}`}>
            ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? '+' : ''}{data.change24h?.toFixed(2)}% today
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-gray-300 mt-3">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </>
      )}
    </div>
  );
}