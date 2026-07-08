import { useEffect, useState } from 'react';
import { DollarSign, Sparkles, Bitcoin, MessageCircle, Copy, Check, Clock, CheckCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const BTC_ADDRESS = '178X1pxp8T84apdvTHvU2x3o8cMMJ168DZ';
const BTC_QR_IMAGE = '/images/btc-qr.jpeg';
const ADMIN_TELEGRAM = 'https://t.me/valmont_admin';

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
      // Open Telegram (works on both mobile and desktop, with iOS fallback)
      const telegramUrl = ADMIN_TELEGRAM;
      
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        window.open(`tg://resolve?domain=valmont_admin`, '_blank');
      } else {
        window.open(telegramUrl, '_blank');
      }
      return; // Do not go to step 3
    }

    // For BTC, proceed normally
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

  // Step 1 - Only shown if no pending fee
  if (step === 1) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            {isOperational ? 'Deposit Funds' : 'Activate Account'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isOperational 
              ? 'Add money to your Valmont account' 
              : 'Deposit the minimum balance of $100 to activate your account'}
          </p>
        </div>

        {!isOperational && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Account Activation Required</h3>
              </div>
            </div>

            <p className="text-3xl font-bold text-gray-900 mb-1">$100.00</p>
            <p className="text-sm text-gray-600 mb-5">
              This is the minimum balance required to activate your account and start receiving transfers.
            </p>

            <button
              onClick={handlePayOpeningFee}
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-70 transition-colors"
            >
              {loading ? 'Processing...' : 'Deposit $100 Minimum Balance'}
            </button>
          </div>
        )}

        {/* Normal Deposit Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
          {/* Amount input + Quick select (your existing code) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="number"
                min="1"
                step="0.01"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-[15px] font-semibold placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={11} className="text-gray-300" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Quick select</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((v) => {
                const active = amount === String(v);
                return (
                  <button
                    key={v}
                    onClick={() => { setAmount(String(v)); setError(''); }}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                      active ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                             : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    ${v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}

          <button
            onClick={handleDeposit}
            disabled={loading || !amount || !isOperational}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 disabled:shadow-none"
          >
            {loading ? 'Processing…' : amount ? `Continue with $${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Enter an amount'}
          </button>

          {!isOperational && (
            <p className="text-[11px] text-amber-600 text-center mt-2">
              Normal deposits are only available after paying the opening fee.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Payment Method (used for both normal deposit and opening fee)
  if (step === 2) {
    const amt = isOpeningFee ? 100 : parseFloat(txn?.transaction?.amount || amount || 0);

    return (
      <div className="max-w-sm mx-auto">
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ChevronLeft size={15} /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            {isOpeningFee ? 'Pay Opening Fee' : 'How would you like to pay?'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isOpeningFee ? 'Send $100 to activate your account' : `Sending $${amt.toLocaleString()}`}
          </p>
        </div>

        <div className="space-y-3">
          {/* BTC Option */}
          <button onClick={() => handleMethodSelect('btc')} className="w-full bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 rounded-2xl p-5 text-left transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100">
                <Bitcoin size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Pay with Bitcoin</p>
                <p className="text-[11px] text-gray-400">Send exact BTC amount</p>
              </div>
            </div>
          </button>

          {/* Admin Option */}
          <button onClick={() => handleMethodSelect('admin')} className="w-full bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-2xl p-5 text-left transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100">
                <MessageCircle size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">Contact Admin</p>
                <p className="text-[11px] text-gray-400">Chat with Valmont Admin on Telegram</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

    // ── Step 3: Instructions + pending status ─────────────────────────────────
  if (step === 3) {
    const amt = isOpeningFee ? 100 : parseFloat(txn?.transaction?.amount || amount || 0);
    const ref = txn?.transaction?.reference;

    return (
      <div className="max-w-sm mx-auto">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </button>

        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            {isOpeningFee ? 'Send Bitcoin (Opening Fee)' : 'Send Bitcoin'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Transfer the BTC equivalent of{' '}
            <span className="font-semibold text-gray-700">
              ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>{' '}
            to the address below
          </p>
        </div>

        {/* BTC Payment Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <img
                src={BTC_QR_IMAGE}
                alt="BTC QR code"
                className="w-44 h-44 object-contain rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="w-44 h-44 bg-gray-100 rounded-xl items-center justify-center text-center p-4 hidden"
                style={{ display: 'none' }}
              >
                <Bitcoin size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[11px] text-gray-400">QR Code not found</p>
              </div>
            </div>
          </div>

          {/* BTC Address */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">BTC Wallet Address</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="flex-1 font-mono text-[11px] text-gray-700 break-all">{BTC_ADDRESS}</p>
              <button
                onClick={copyAddress}
                className="shrink-0 w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
              </button>
            </div>
            {copied && <p className="text-[11px] text-emerald-600 mt-1 font-medium">Copied to clipboard</p>}
          </div>

          <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-[12px] text-amber-700 font-medium">
              ⚠️ Only send Bitcoin to this address. Sending any other asset will result in permanent loss.
            </p>
          </div>
        </div>

        {/* Pending Status */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Payment Status</p>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-700">Pending Confirmation</p>
              <p className="text-[11px] text-gray-400">Waiting for admin approval</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Once we confirm your payment, your account will be activated automatically.
          </p>

          {ref && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-[11px] text-gray-400">
                Reference: <span className="font-mono font-semibold text-gray-600">{ref.slice(0, 16)}…</span>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={reset}
          className="w-full mt-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return null;
}