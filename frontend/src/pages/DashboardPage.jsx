import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Bitcoin, ArrowRight, AlertCircle, CheckCircle, Lock, Wallet, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    completed: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    pending: 'bg-amber-900/50 text-amber-400 border-amber-800',
    pending_fee: 'bg-orange-900/50 text-orange-400 border-orange-800',
    failed: 'bg-red-900/50 text-red-400 border-red-800',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-3 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {status === 'pending_fee' ? 'PENDING FEE' : status.toUpperCase()}
    </span>
  );
}

function TypeLabel({ type }) {
  if (type === 'deposit') return <span className="text-[13px] font-semibold text-emerald-400">Deposit</span>;
  if (type === 'btc_transfer') return <span className="text-[13px] font-semibold text-orange-400">BTC Transfer</span>;
  if (type === 'external_transfer') return <span className="text-[13px] font-semibold text-orange-400">External Withdrawal</span>;
  if (type === 'internal_transfer' || type === 'internal_transfer_in') return <span className="text-[13px] font-semibold text-emerald-400">Internal Transfer</span>;
  if (type === 'opening_fee') return <span className="text-[13px] font-semibold text-amber-400">Network Fee</span>;
  return <span className="text-[13px] font-semibold text-slate-300 capitalize">{type.replace('_', ' ')}</span>;
}

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0b1220] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[11px] text-slate-400">Amount</p>
        <p className="text-sm font-bold text-white">{formatCrypto(payload[0].value)} {currency || 'BTC'}</p>
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
      <div className="space-y-6">
        <div className="h-9 w-64 rounded-2xl bg-white/5 animate-pulse" />
        <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showLockedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0b1220] border border-amber-800 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl">
          <Lock size={16} className="text-amber-400" />
          Wallet not activated. Deposit minimum reserve first.
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Wallet Overview</p>
      </div>

      {/* Password Change Banner */}
      {mustChangePassword && (
        <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-5 flex gap-4">
          <Lock className="text-indigo-400 mt-0.5 flex-shrink-0" size={22} />
          <div>
            <p className="font-semibold text-white">Update your password</p>
            <p className="text-sm text-slate-400 mt-1">For security, please set a new password.</p>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Change password now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Activation Banner */}
      {!isOperational && !hasPendingFee && (
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-5 flex gap-4">
          <AlertCircle className="text-amber-400 mt-0.5 flex-shrink-0" size={22} />
          <div>
            <p className="font-semibold text-amber-300">Wallet Activation Required</p>
            <p className="text-sm text-slate-400 mt-1">
              Maintain a minimum reserve of {formatCrypto(minBalance)} {currency}
            </p>
            <Link
              to="/deposit"
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-amber-400 hover:text-amber-300"
            >
              Deposit Minimum Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Balance Hero Card */}
      <div className="relative bg-gradient-to-br from-[#0b1220] via-slate-950 to-zinc-950 rounded-3xl p-6 sm:p-8 overflow-hidden border border-white/10">
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-orange-500/10 pointer-events-none" />
        <div className="absolute -bottom-20 -right-8 w-64 h-64 rounded-full bg-emerald-500/5 pointer-events-none" />
        <Bitcoin className="absolute top-6 right-6 text-orange-500/20" size={88} strokeWidth={1} />

        <p className="text-orange-400/70 text-xs font-semibold uppercase tracking-[0.125em] mb-1">AVAILABLE BALANCE</p>
        
        <p className="text-4xl sm:text-5xl font-bold text-white tracking-tighter mt-2">
          {formatCrypto(account?.balance)} <span className="text-orange-400 text-3xl">{currency}</span>
        </p>

        {account?.usdValue !== undefined && (
          <p className="text-lg text-slate-400 mt-1">≈ {formatUsd(account.usdValue)}</p>
        )}

        <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
          <Wallet size={14} />
          <span>Crypto Wallet</span>
          {isOperational ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-900/70 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-800">
              <CheckCircle size={12} /> Operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-900/70 text-amber-400 text-[10px] px-3 py-1 rounded-full border border-amber-800">
              <AlertCircle size={12} /> Minimum Reserve Required
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          <Link
            to="/deposit"
            className="flex items-center justify-center gap-2 py-4 bg-white text-slate-950 font-semibold rounded-2xl hover:bg-white active:scale-[0.985] transition-all"
          >
            <ArrowDownToLine size={18} /> Deposit
          </Link>

          <button
            onClick={handleTransferClick}
            className={`flex items-center justify-center gap-2 py-4 font-semibold rounded-2xl transition-all active:scale-[0.985] ${
              isOperational
                ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isOperational ? <ArrowUpFromLine size={18} /> : <Lock size={18} />}
            Send
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0b1220] border border-white/10 rounded-3xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Recent Transactions</p>
          <p className="text-4xl font-bold text-white mt-2">{account?.recentTransactions?.length ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Last 5 txns</p>
        </div>

        <div className="bg-[#0b1220] border border-white/10 rounded-3xl p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Total Deposited</p>
          <p className="text-4xl font-bold text-white mt-2">
            {formatCrypto(
              account?.recentTransactions
                ?.filter((t) => t.type === 'deposit')
                .reduce((s, t) => s + t.amount, 0) ?? 0
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">{currency}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-[#0b1220] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300">Transaction Activity</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ffa3" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00ffa3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#00ffa3"
                strokeWidth={2.5}
                fill="url(#colorAmt)"
                dot={{ r: 3, fill: '#00ffa3' }}
                activeDot={{ r: 5, fill: '#00ffa3' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-[#0b1220] border border-white/10 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-300">Recent Activity</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {!account?.recentTransactions?.length ? (
          <div className="py-16 text-center">
            <p className="text-slate-400">No transactions yet</p>
            <Link to="/deposit" className="text-orange-400 text-sm mt-3 inline-block hover:underline">
              Make your first deposit →
            </Link>
          </div>
        ) : (
          <div>
            {account.recentTransactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between px-5 py-4 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    t.type === 'deposit' || t.type === 'internal_transfer_in' ? 'bg-emerald-900/60' : 'bg-orange-900/60'
                  }`}>
                    {t.type === 'deposit' || t.type === 'internal_transfer_in'
                      ? <ArrowDownToLine size={16} className="text-emerald-400" />
                      : <ArrowUpFromLine size={16} className="text-orange-400" />}
                  </div>
                  <div>
                    <TypeLabel type={t.type} />
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-base font-semibold ${
                    t.status === 'completed'
                      ? (t.type === 'deposit' || t.type === 'internal_transfer_in' ? 'text-emerald-400' : 'text-white')
                      : 'text-amber-400'
                  }`}>
                    {t.status === 'completed' && (t.type === 'deposit' || t.type === 'internal_transfer_in' ? '+' : '-')}
                    {formatCrypto(t.amount)} {t.currency || currency}
                  </p>
                  <StatusBadge status={t.status} />

                  {/* Complete pending transaction button for external transfers with pending fee */}
                  {t.status === 'pending_fee' && t.type === 'external_transfer' && (
                    <button
                      onClick={() => navigate('/transfer', { 
                        state: { pendingTransaction: t } 
                      })}
                      className="mt-2 text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-xl font-medium transition-colors w-full"
                    >
                      Complete Transfer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}