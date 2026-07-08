import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, RefreshCw, Bitcoin, Activity } from 'lucide-react';
import { fetchBtcHistory, fetchBtcPrice } from '../services/coinGecko';
import api from '../services/api';

/* ─── TradingView widget (dark, matched to the terminal theme) ─── */
function TradingViewWidget() {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;
    if (container.current.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'BINANCE:BTCUSDT',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: false,
      backgroundColor: '#0b1220',
      gridColor: 'rgba(255,255,255,0.06)',
      support_host: 'https://www.tradingview.com',
    });

    container.current.appendChild(script);
    return () => { if (container.current) container.current.innerHTML = ''; };
  }, []);

  return (
    <div ref={container} style={{ height: '400px', width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, up, loading }) {
  return (
    <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 font-mono">{label}</p>
      {loading ? (
        <div className="h-7 w-24 rounded-lg bg-white/[0.06] animate-pulse" />
      ) : (
        <p className="text-xl font-bold text-slate-100 tracking-tight font-mono">{value}</p>
      )}
      {sub !== undefined && !loading && (
        <p className={`text-xs mt-1 flex items-center gap-0.5 font-medium ${
          up === true ? 'text-[#00ffa3]' : up === false ? 'text-[#ff5470]' : 'text-slate-500'
        }`}>
          {up === true && <TrendingUp size={11} />}
          {up === false && <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0b1220] border border-[#00ffa3]/20 rounded-xl px-3 py-2 shadow-lg shadow-black/40">
      <p className="text-[11px] text-slate-500 mb-0.5 font-mono">{label}</p>
      <p className="text-sm font-bold text-slate-100 font-mono">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const RANGES = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function ChartsPage() {
  const [history, setHistory]     = useState([]);
  const [btcData, setBtcData]     = useState(null);
  const [balance, setBalance]     = useState(null);
  const [range, setRange]         = useState(30);
  const [loading, setLoading]     = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setChartLoading(true);
    try {
      const [price, account] = await Promise.allSettled([
        fetchBtcPrice(),
        api.get('/accounts/me'),
      ]);
      if (price.status === 'fulfilled')   setBtcData(price.value);
      if (account.status === 'fulfilled') setBalance(account.value.data.balance);
    } finally {
      setLoading(false);
    }

    try {
      const hist = await fetchBtcHistory(range);
      setHistory(hist);
    } finally {
      setChartLoading(false);
    }
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  const btcPrice   = btcData?.price ?? null;
  const change24h  = btcData?.change24h ?? null;
  const balanceUsd = balance ?? 0;
  const btcHeld    = btcPrice ? balanceUsd / btcPrice : null;

  const priceChange = history.length >= 2
    ? ((history.at(-1).price - history[0].price) / history[0].price) * 100
    : null;
  const rangeUp = priceChange !== null ? priceChange >= 0 : undefined;
  const dayUp   = change24h !== null ? change24h >= 0 : undefined;

  return (
    <div className="space-y-5 font-sans" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        .vlt-heading { font-family: 'Space Grotesk', sans-serif; }
        .vlt-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="vlt-heading text-[22px] font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-[#00ffa3]" />
            Charts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Live BTC market data</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-[#0b1220] text-sm font-medium text-slate-300 hover:border-[#00ffa3]/30 hover:text-[#00ffa3] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* BTC price hero */}
      <div className="relative rounded-2xl p-5 overflow-hidden border border-[#00ffa3]/15" style={{ background: 'linear-gradient(135deg, #0b1220 0%, #10182b 60%, #0b1220 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(0,255,163,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-10 -right-4 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)' }} />
        <div className="relative flex items-center gap-2 mb-1">
          <Bitcoin size={16} className="text-[#ffb84d]" />
          <p className="text-[#4ee6ab] text-xs font-semibold uppercase tracking-widest vlt-mono">Bitcoin · USD</p>
        </div>
        {loading ? (
          <div className="relative h-9 w-40 rounded-xl bg-white/10 animate-pulse mt-1" />
        ) : (
          <p className="relative text-3xl sm:text-4xl font-bold text-white tracking-tight vlt-mono">
            ${btcPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}
          </p>
        )}
        {!loading && change24h !== null && (
          <p className={`relative flex items-center gap-1 text-sm font-semibold mt-1.5 vlt-mono ${dayUp ? 'text-[#00ffa3]' : 'text-[#ff5470]'}`}>
            {dayUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {dayUp ? '+' : ''}{change24h.toFixed(2)}% today
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label={`${RANGES.find(r => r.days === range)?.label} Change`}
          value={priceChange !== null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` : '—'}
          sub={priceChange !== null ? (rangeUp ? 'Trending up' : 'Trending down') : undefined}
          up={rangeUp}
          loading={chartLoading}
        />
        <StatCard
          label="Your Balance"
          value={`$${balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub="Available funds"
          loading={loading}
        />
        <StatCard
          label="Equiv. BTC"
          value={btcHeld !== null ? `₿ ${btcHeld.toFixed(6)}` : '—'}
          sub="At current rate"
          loading={loading}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Price history chart */}
      <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-[#00ffa3]" />
            <h2 className="text-[13px] font-semibold text-slate-300 vlt-heading">BTC Price History</h2>
          </div>
          <div className="flex gap-1">
            {RANGES.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setRange(days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors vlt-mono ${
                  range === days
                    ? 'bg-[#00ffa3] text-[#04140d]'
                    : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <RefreshCw size={14} className="animate-spin" /> Loading chart…
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#00ffa3" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#00ffa3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#00ffa3"
                strokeWidth={2}
                fill="url(#btcGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#00ffa3', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* TradingView candlestick */}
      <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-[#00ffa3]" />
            <h2 className="text-[13px] font-semibold text-slate-300 vlt-heading">BTC/USDT Candlestick</h2>
          </div>
          <span className="text-[11px] text-slate-600 vlt-mono">Powered by TradingView</span>
        </div>
        <TradingViewWidget />
      </div>
    </div>
  );
}