import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Bitcoin, ArrowRight, AlertCircle, CheckCircle, Lock, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Default minimum reserve (in BTC) required to activate the wallet if the
// API doesn't send one explicitly.
const DEFAULT_MIN_BALANCE_BTC = 0.001;

function formatCrypto(amount, decimals = 8) {
  if (amount === undefined || amount === null) return '0';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

function formatUsd(amount) {
  if (amount === undefined || amount === null) return null;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    pending_fee: 'bg-orange-50 text-orange-700 border-orange-100',
    failed: 'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {status === 'pending_fee' ? 'PENDING FEE' : status.toUpperCase()}
    </span>
  );
}

function TypeLabel({ type }) {
  if (type === 'deposit') return <span className="text-[13px] font-semibold text-gray-800">Deposit</span>;
  if (type === 'btc_transfer') return <span className="text-[13px] font-semibold text-gray-800">BTC Transfer</span>;
  if (type === 'external_transfer') return <span className="text-[13px] font-semibold text-gray-800">Withdrawal to External Wallet</span>;
  if (type === 'internal_transfer' || type === 'internal_transfer_in') return <span className="text-[13px] font-semibold text-gray-800">Internal Transfer</span>;
  if (type === 'opening_fee') return <span className="text-[13px] font-semibold text-amber-700">Network Fee</span>;
  return <span className="text-[13px] font-semibold text-gray-800 capitalize">{type.replace('_', ' ')}</span>;
}

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg shadow-gray-100">
        <p className="text-xs text-gray-400">Amount</p>
        <p className="text-sm font-bold text-gray-900">{formatCrypto(payload[0].value)} {currency || 'BTC'}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLockedToast, setShowLockedToast] = useState(false);

  useEffect(() => {
    api.get('/accounts/me')
      .then((r) => setAccount(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currency = account?.currency || 'BTC';
  const minBalance = account?.minBalance ?? DEFAULT_MIN_BALANCE_BTC;

  const chartData = account?.recentTransactions
    ? [...account.recentTransactions].reverse().map((t, i) => ({
        name: `T${i + 1}`,
        amount: t.amount,
      }))
    : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName?.split(' ')[0];

  const isOperational = account?.isOperational ?? false;

  const hasPendingFee = account?.recentTransactions?.some(
    (t) => t.type === 'opening_fee' && t.status === 'pending'
  );

  const mustChangePassword = user?.mustChangePassword ?? false;

  const handleTransferClick = () => {
    if (!isOperational) {
      setShowLockedToast(true);
      setTimeout(() => setShowLockedToast(false), 3500);
      return;
    }
    navigate('/transfer');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showLockedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl">
          <Lock size={15} className="text-amber-400 shrink-0" />
          Wallet not yet activated. Please deposit the {formatCrypto(minBalance)} {currency} minimum reserve first.
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's your wallet overview</p>
      </div>

      {/* Password Change Required Banner */}
      {mustChangePassword && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
          <Lock className="text-indigo-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-indigo-800">Update your password</p>
            <p className="text-sm text-indigo-600 mt-1">
              For your security, please set a new password before continuing.
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Change password now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Wallet Activation Banner */}
      {!isOperational && !hasPendingFee && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-800">Wallet Activation Required</p>
            <p className="text-sm text-amber-700 mt-1">
              Maintain a minimum reserve of {formatCrypto(minBalance)} {currency} to activate your wallet and receive incoming transfers.
            </p>
            <Link
              to="/deposit"
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Deposit {formatCrypto(minBalance)} {currency} Minimum Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Balance hero card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-orange-500/10 pointer-events-none" />
        <div className="absolute -bottom-14 -right-6 w-52 h-52 rounded-full bg-orange-500/5 pointer-events-none" />
        <Bitcoin className="absolute top-4 right-4 text-orange-500/20" size={72} strokeWidth={1.2} />

        <p className="text-orange-200/70 text-xs font-semibold uppercase tracking-widest mb-1">Available balance</p>
        <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {formatCrypto(account?.balance)} <span className="text-orange-400">{currency}</span>
        </p>
        {account?.usdValue !== undefined && (
          <p className="text-sm text-slate-400 mt-1">≈ {formatUsd(account.usdValue)}</p>
        )}

        <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-2">
          <Wallet size={12} className="text-slate-500" /> Crypto Wallet
          {isOperational ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
              <CheckCircle size={12} /> Operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
              <AlertCircle size={12} /> Minimum Reserve Required
            </span>
          )}
        </p>

        {/* Quick actions */}
        <div className="flex gap-2.5 mt-5">
          <Link
            to="/deposit"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-orange-50 active:scale-95 transition-all flex-1 justify-center"
          >
            <ArrowDownToLine size={14} /> Deposit
          </Link>

          <button
            type="button"
            onClick={handleTransferClick}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl active:scale-95 transition-all flex-1 ${
              isOperational
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}
          >
            {isOperational ? <ArrowUpFromLine size={14} /> : <Lock size={14} />}
            Send
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Recent txns</p>
          <p className="text-2xl font-bold text-gray-900">{account?.recentTransactions?.length ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Last 5 transactions</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Total deposited</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCrypto(
              account?.recentTransactions
                ?.filter((t) => t.type === 'deposit')
                .reduce((s, t) => s + t.amount, 0) ?? 0
            )} <span className="text-base text-gray-400">{currency}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">From recent history</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bitcoin size={14} className="text-orange-500" />
            <h2 className="text-[13px] font-semibold text-gray-700">Transaction amounts</h2>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v >= 1 ? v.toFixed(2) : v.toFixed(4)}`}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#f97316"
                fill="url(#colorAmt)"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#f97316', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-50">
          <h2 className="text-[13px] font-semibold text-gray-700">Recent transactions</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-700"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {!account?.recentTransactions?.length ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No transactions yet.</p>
            <Link to="/deposit" className="text-sm text-indigo-600 font-semibold mt-1 inline-block hover:underline">
              Make your first deposit →
            </Link>
          </div>
        ) : (
          <div>
            {account.recentTransactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 transition-colors ${
                  i !== account.recentTransactions.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    t.type === 'deposit' || t.type === 'internal_transfer_in' ? 'bg-emerald-50' : 'bg-orange-50'
                  }`}>
                    {t.type === 'deposit' || t.type === 'internal_transfer_in'
                      ? <ArrowDownToLine size={14} className="text-emerald-600" />
                      : <ArrowUpFromLine size={14} className="text-orange-600" />}
                  </div>
                  <div>
                    <TypeLabel type={t.type} />
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    t.status === 'completed'
                      ? (t.type === 'deposit' || t.type === 'internal_transfer_in' ? 'text-emerald-600' : 'text-gray-800')
                      : 'text-amber-600'
                  }`}>
                    {t.status === 'completed' && (t.type === 'deposit' || t.type === 'internal_transfer_in' ? '+' : '-')}
                    {formatCrypto(t.amount)} {t.currency || currency}
                  </p>

                  <div className="mt-0.5">
                    <StatusBadge status={t.status} />

                    {t.status === 'pending_fee' && (
                      <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                        {t.type === 'external_transfer'
                          ? 'Waiting for network fee payment'
                          : 'Minimum reserve not met'}
                      </p>
                    )}

                    {/* Complete Transfer button — resume a pending external transfer */}
                    {t.status === 'pending_fee' && t.type === 'external_transfer' && (
                      <button
                        onClick={() => navigate('/transfer', {
                          state: { pendingTransaction: t }
                        })}
                        className="mt-2 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                      >
                        Complete Transfer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}