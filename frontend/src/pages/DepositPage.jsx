import { useEffect, useState } from 'react';
import { DollarSign, Sparkles, Bitcoin, MessageCircle, Copy, Check, Clock, CheckCircle, ChevronLeft, AlertCircle, Activity } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const BTC_ADDRESS = '178X1pxp8T84apdvTHvU2x3o8cMMJ168DZ';
const BTC_QR_IMAGE = '/images/btc-qr.jpeg';
const ADMIN_TELEGRAM = '#';

export default function DepositPage() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txn, setTxn] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [account, setAccount] = useState(null);
  const [isOperational, setIsOperational] = useState(false);
  const [isOpeningFee, setIsOpeningFee] = useState(false);
  const [hasPendingFee, setHasPendingFee] = useState(false);

  // Fetch account + check pending fee
  useEffect(() => {
    api.get('/accounts/me')
      .then((res) => {
        setAccount(res.data);
        setIsOperational(res.data.isOperational);

        const pendingFee = res.data.recentTransactions?.some(
          t => t.type === 'opening_fee' && t.status === 'pending'
        );
        setHasPendingFee(pendingFee);

        // Auto go to payment method if they have pending fee
        if (pendingFee) {
          setIsOpeningFee(true);
          setStep(2);
        }
      })
      .catch(console.error);
  }, []);

  const handlePayOpeningFee = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/deposits/pay-opening-fee');
      setTxn(data);
      setIsOpeningFee(true);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/deposits', { amount: parseFloat(amount) });
      setTxn(data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (m) => {
    setMethod(m);

    if (m === 'admin') {
      const telegramUrl = ADMIN_TELEGRAM;
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        window.open(`tg://resolve?domain=valmont_admin`, '_blank');
      } else {
        window.open(telegramUrl, '_blank');
      }
      return;
    }

    setStep(3);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep(1);
    setAmount('');
    setMethod(null);
    setTxn(null);
    setError('');
    setIsOpeningFee(false);
  };

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
            <DollarSign size={18} className="text-[#00ffa3]" />
            Deposit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Add funds to your Valmont account</p>
        </div>
      </div>

      {/* Step 1: Amount Input */}
      {step === 1 && (
        <div className="max-w-md mx-auto space-y-5">
          <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] p-6">
            <div className="mb-6">
              <h2 className="vlt-heading text-xl font-semibold text-slate-100 tracking-tight">
                {isOperational ? 'Deposit Funds' : 'Activate Your Account'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isOperational 
                  ? 'Add money to your trading account' 
                  : 'Deposit the minimum balance of $100 to activate'}
              </p>
            </div>

            {!isOperational && (
              <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-400">Account Activation Required</p>
                    <p className="text-sm text-slate-400 mt-1">Minimum balance of $100 required to start trading.</p>
                    <button
                      onClick={handlePayOpeningFee}
                      disabled={loading}
                      className="mt-4 w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>Processing...</>
                      ) : (
                        <>Pay $100 Opening Fee</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 vlt-mono">AMOUNT (USD)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="w-full pl-11 pr-4 py-4 bg-[#10182b] border border-white/[0.08] rounded-2xl text-3xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00ffa3]/50 transition-all vlt-mono"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles size={13} className="text-[#00ffa3]" />
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold vlt-mono">QUICK SELECT</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((v) => {
                    const active = amount === String(v);
                    return (
                      <button
                        key={v}
                        onClick={() => { setAmount(String(v)); setError(''); }}
                        className={`py-3 rounded-2xl text-sm font-semibold transition-all vlt-mono border ${
                          active 
                            ? 'bg-[#00ffa3] text-[#04140d] border-[#00ffa3]' 
                            : 'bg-white/[0.06] text-slate-300 border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.1]'
                        }`}
                      >
                        ${v >= 1000 ? `${v / 1000}k` : v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleDeposit}
                disabled={loading || !amount || !isOperational}
                className="w-full py-4 bg-[#00ffa3] hover:bg-[#00ff9a] disabled:bg-white/[0.08] disabled:text-slate-500 text-black font-semibold rounded-2xl text-base transition-all tracking-tight shadow-lg shadow-[#00ffa3]/30 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? 'Processing…' : amount ? `Continue • $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Enter Amount'}
              </button>

              {!isOperational && (
                <p className="text-center text-[11px] text-amber-400/80">Normal deposits are available after account activation.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Payment Method */}
      {step === 2 && (
        <div className="max-w-md mx-auto">
          <button 
            onClick={reset} 
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Activity size={18} className="text-[#00ffa3]" />
                <h2 className="vlt-heading text-xl font-semibold text-slate-100 tracking-tight">
                  {isOpeningFee ? 'Pay Opening Fee' : 'Choose Payment Method'}
                </h2>
              </div>
              <p className="text-slate-400 text-sm">
                {isOpeningFee 
                  ? 'Send $100 to activate your account' 
                  : `Amount: $${parseFloat(txn?.transaction?.amount || amount || 0).toLocaleString()}`}
              </p>
            </div>

            <div className="space-y-3">
              {/* BTC Option */}
              <button 
                onClick={() => handleMethodSelect('btc')} 
                className="w-full group bg-[#10182b] hover:bg-[#1a2338] border border-white/[0.08] hover:border-[#00ffa3]/30 rounded-2xl p-5 text-left transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/10 to-yellow-500/10 flex items-center justify-center border border-amber-400/20 group-hover:border-amber-400/40">
                  <Bitcoin size={28} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Bitcoin (BTC)</p>
                  <p className="text-sm text-slate-400">Send exact BTC equivalent</p>
                </div>
              </button>

              {/* Admin Telegram */}
              <button 
                onClick={() => handleMethodSelect('admin')} 
                className="w-full group bg-[#10182b] hover:bg-[#1a2338] border border-white/[0.08] hover:border-[#00ffa3]/30 rounded-2xl p-5 text-left transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400/10 to-purple-500/10 flex items-center justify-center border border-indigo-400/20 group-hover:border-indigo-400/40">
                  <MessageCircle size={28} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Contact Admin</p>
                  <p className="text-sm text-slate-400">Via Telegram • Fast support</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: BTC Payment Instructions */}
      {step === 3 && (
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => setStep(2)} 
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="bg-[#0b1220] rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="vlt-heading text-xl font-semibold text-slate-100 tracking-tight mb-1">
                {isOpeningFee ? 'Send Bitcoin - Opening Fee' : 'Send Bitcoin'}
              </h2>
              <p className="text-slate-400">
                Transfer the BTC equivalent of{' '}
                <span className="text-[#00ffa3] font-semibold vlt-mono">
                  ${parseFloat(txn?.transaction?.amount || amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>

            <div className="p-6 space-y-7">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-[#10182b] rounded-3xl border border-white/[0.08]">
                  <img
                    src={BTC_QR_IMAGE}
                    alt="BTC QR"
                    className="w-52 h-52 object-contain rounded-2xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-52 h-52 bg-[#0b1220] rounded-2xl items-center justify-center flex-col" style={{ display: 'none' }}>
                    <Bitcoin size={48} className="text-slate-600 mb-3" />
                    <p className="text-slate-500 text-xs">QR unavailable</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2 vlt-mono">BTC WALLET ADDRESS</p>
                <div className="flex items-center gap-3 bg-[#10182b] border border-white/[0.08] rounded-2xl p-4">
                  <p className="flex-1 font-mono text-sm text-slate-300 break-all leading-relaxed">{BTC_ADDRESS}</p>
                  <button
                    onClick={copyAddress}
                    className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center border border-white/[0.1] transition-colors"
                  >
                    {copied ? <Check size={16} className="text-[#00ffa3]" /> : <Copy size={16} className="text-slate-400" />}
                  </button>
                </div>
                {copied && <p className="text-[#00ffa3] text-xs mt-2 font-medium flex items-center gap-1">✓ Copied to clipboard</p>}
              </div>

              {/* Warning */}
              <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-5">
                <p className="text-red-400 text-sm leading-relaxed">
                  ⚠️ Only send Bitcoin (BTC) to this address. Any other asset will be lost permanently.
                </p>
              </div>

              {/* Status */}
              <div className="bg-[#10182b] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Clock size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-400">Payment Pending</p>
                    <p className="text-xs text-slate-500">Waiting for network confirmation</p>
                  </div>
                </div>
                {txn?.transaction?.reference && (
                  <p className="mt-4 text-[11px] text-slate-500 font-mono">
                    Ref: {txn.transaction.reference}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/[0.06]">
              <button
                onClick={reset}
                className="w-full py-3.5 text-slate-400 hover:text-slate-300 border border-white/[0.08] hover:border-white/[0.2] rounded-2xl text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}