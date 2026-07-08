import { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import api from '../services/api';

const TYPE_OPTIONS = [
  { value: 'all',          label: 'All types' },
  { value: 'deposit',      label: 'Deposits' },
  { value: 'btc_transfer', label: 'BTC Transfers' },
];

function Badge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    failed:    'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function TypeIcon({ type }) {
  if (type === 'deposit') {
    return (
      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
        <ArrowDownToLine size={13} className="text-emerald-600" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
      <ArrowUpFromLine size={13} className="text-violet-600" />
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', from: '', to: '' });

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const hasFilters = filters.type !== 'all' || filters.from || filters.to;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
      };
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: 'all', from: '', to: '' });
    setPage(1);
  };

  const handleExport = async () => {
    const params = new URLSearchParams({
      ...(filters.type !== 'all' && { type: filters.type }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    });
    const token = localStorage.getItem('accessToken');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${baseUrl}/transactions/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credbridge-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} transaction{total !== 1 ? 's' : ''}
            {hasFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
              hasFilters || filtersOpen
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {[filters.type !== 'all', filters.from, filters.to].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Type</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">From date</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">To date</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-semibold"
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* List — mobile-first card layout */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-50 bg-gray-50/60">
          {['Transaction', 'Date', 'Amount', 'Status', 'Reference'].map((h) => (
            <p key={h} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No transactions match your filters.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-indigo-600 font-semibold mt-1 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          transactions.map((t, i) => (
            <div
              key={t.id}
              className={`${i !== transactions.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/60 transition-colors`}
            >
              {/* Mobile layout */}
              <div className="sm:hidden flex items-center gap-3 px-4 py-3.5">
                <TypeIcon type={t.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 capitalize">
                    {t.type === 'btc_transfer' ? 'BTC Transfer' : t.type}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {t.btcAddress && (
                    <p className="text-[10px] font-mono text-gray-300 mt-0.5">
                      {t.btcAddress.slice(0, 8)}…{t.btcAddress.slice(-4)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {t.type === 'deposit' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-1"><Badge status={t.status} /></div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <TypeIcon type={t.type} />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">
                      {t.type === 'btc_transfer' ? 'BTC Transfer' : 'Deposit'}
                    </p>
                    {t.btcAddress && (
                      <p className="text-[10px] font-mono text-gray-300">
                        {t.btcAddress.slice(0, 8)}…{t.btcAddress.slice(-4)}
                        {' · '}
                        <span className="text-amber-500">₿ {t.btcAmount?.toFixed(6)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className={`text-sm font-bold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-gray-800'}`}>
                  {t.type === 'deposit' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <Badge status={t.status} />
                <p className="font-mono text-[11px] text-gray-300">{t.reference?.slice(0, 10)}…</p>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
            <span className="text-[12px] text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}