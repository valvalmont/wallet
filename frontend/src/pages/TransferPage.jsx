import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Bitcoin, Wallet, AlertCircle, ArrowRight, ChevronLeft, Copy, CreditCard } from 'lucide-react';
import api from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const EXTERNAL_FEE_PERCENT = 0.002;
const MINIMUM_TRANSFER = 5000;
const TRANSFER_FEE_BTC_ADDRESS = '178X1pxp8T84apdvTHvU2x3o8cMMJ168DZ';
const FEE_QR_IMAGE = '/images/btc-qr.jpeg';

export default function TransferPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('external');
  const [isOperational, setIsOperational] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);

  // External Transfer states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  const [feeMethod, setFeeMethod] = useState('btc');

  // Internal Transfer states
  const [recipientEmail, setRecipientEmail] = useState('');
  const [internalAmount, setInternalAmount] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalSuccess, setInternalSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-step External flow
  const [externalStep, setExternalStep] = useState('form'); // form | confirm | fee-payment | initiated
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [copied, setCopied] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const pending = location.state?.pendingTransaction;
    if (pending && pending.type === 'external_transfer') {
      setRecipientAddress(pending.metadata?.recipientAddress || '');
      setUsdAmount(pending.amount.toString());
      setFeeMethod('btc');
      setPendingTransfer(pending);
      setExternalStep('confirm');
    }
  }, [location.state]);

  // Fee calculations
  const parsedAmount = parseFloat(usdAmount) || 0;
  const feeAmount = parsedAmount > 0 ? (parsedAmount * EXTERNAL_FEE_PERCENT) : 0;
  const totalAmount = parsedAmount + feeAmount;

  // Check account status
  useEffect(() => {
    api.get('/accounts/me')
      .then((res) => setIsOperational(res.data.isOperational))
      .catch(console.error)
      .finally(() => setAccountLoading(false));
  }, []);

  // BTC Rate
  const fetchRate = async () => {
    setRateLoading(true);
    try {
      const { data } = await api.get('/transfers/btc/rate');
      setRate(data.btcUsdPrice);
    } catch {
      setRate(null);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 60000);
    return () => clearInterval(interval);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(TRANSFER_FEE_BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetExternalFlow = () => {
    setExternalStep('form');
    setRecipientAddress('');
    setUsdAmount('');
    setFeeMethod('btc');
    setPendingTransfer(null);
    setError('');
  };

  const handleExternalConfirm = () => {
    if (!recipientAddress.trim()) return setError('Enter a valid BTC wallet address.');
    if (!usdAmount || parsedAmount < MINIMUM_TRANSFER) {
      return setError(`Minimum transfer amount is $${MINIMUM_TRANSFER}`);
    }
    setError('');
    setExternalStep('confirm');
  };

  const handleProceedToFee = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        recipientAddress: recipientAddress.trim(),
        amount: parsedAmount,
        currency: "USD",
      };

      const { data } = await api.post('/transfers/external', payload);
      
      setPendingTransfer(data);
      setExternalStep('fee-payment');
    } catch (err) {
      console.error(err.response?.data);
      setError(err.response?.data?.error || 'Failed to initiate transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleFeePaid = () => {
    setExternalStep('initiated');
  };

  const handleCancelTransfer = () => {
    if (window.confirm('Cancel this transfer?')) {
      resetExternalFlow();
      navigate('/');
    }
  };

  // Handle Internal Transfer
  const handleInternalTransfer = async () => {
    if (!recipientEmail.trim()) return setError('Enter recipient email.');
    if (!internalAmount || parseFloat(internalAmount) <= 0) return setError('Enter a valid amount.');

    setError('');
    setInternalLoading(true);
    try {
      await api.post('/transfers/internal', {
        recipientEmail: recipientEmail.trim(),
        amount: parseFloat(internalAmount),
      });
      setInternalSuccess(true);
      setRecipientEmail('');
      setInternalAmount('');
    } catch (err) {
      setError(err.response?.data?.error || 'Internal transfer failed.');
    } finally {
      setInternalLoading(false);
    }
  };

  if (!accountLoading && !isOperational) {
    return (
      <div className="max-w-sm mx-auto text-center py-12">
        <AlertCircle size={48} className="mx-auto text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white">Account Not Operational</h2>
        <p className="text-slate-400 mt-2 mb-8">
          You must maintain the minimum reserve before sending transfers.
        </p>
        <Link
          to="/deposit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all"
        >
          Deposit Minimum Reserve <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // External transfer initiated success screen (FIXED COLORS)
  if (externalStep === 'initiated' && pendingTransfer) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-[#0b1220] rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-emerald-950/60 to-[#0b1220] border-b border-white/10 text-center">
            <div className="w-16 h-16 bg-emerald-900/70 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Transfer Initiated</h2>
            <p className="text-emerald-400">Awaiting fee confirmation</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-[#10182b] border border-white/10 rounded-2xl p-5 space-y-4 text-sm">
              <Row label="Amount Sent" value={`$${(pendingTransfer.transaction?.amount ?? parsedAmount).toLocaleString()}`} />
              <Row label={`Fee (${EXTERNAL_FEE_PERCENT}%)`} value={`$${(pendingTransfer.fee ?? feeAmount).toFixed(2)}`} red />
              <Row label="Total Deducted" value={`$${(pendingTransfer.totalDeducted ?? totalAmount).toFixed(2)}`} bold />
              
              <div className="h-px bg-white/10 my-3" />
              
              <Row label="Recipient Address" value={pendingTransfer.recipientAddress ?? recipientAddress} mono />
              <Row label="Reference" value={pendingTransfer.reference ?? 'PENDING'} mono />
              <Row label="Status" value="Awaiting Fee" pending />
            </div>

            <div className="text-center text-xs text-slate-400 px-2 leading-relaxed">
              Your transfer will be processed once the fee is confirmed on the blockchain.
            </div>

            <div className="bg-amber-950/70 border border-amber-700/70 rounded-2xl p-5 text-xs text-amber-300 space-y-2.5">
              <p>• Send exactly <span className="font-semibold text-amber-400">${feeAmount.toFixed(2)}</span> BTC to the fee address.</p>
              <p>• Once confirmed, funds will be sent automatically.</p>
            </div>
          </div>

          <div className="px-6 pb-8">
            <button
              onClick={resetExternalFlow}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl hover:brightness-110 transition-all"
            >
              Make Another Transfer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Internal success
  if (internalSuccess) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <div className="bg-[#0b1220] border border-emerald-900/50 rounded-3xl p-8">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Transfer Successful!</h2>
          <p className="text-slate-400 mt-2">Funds have been sent internally.</p>
        </div>
        <button
          onClick={() => setInternalSuccess(false)}
          className="mt-8 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl"
        >
          Make Another Transfer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 text-white">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-white">Transfer Funds</h1>
        <p className="text-sm text-slate-400 mt-0.5">Send BTC externally or internally</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => { setActiveTab('external'); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold transition-all ${activeTab === 'external' 
            ? 'border-b-2 border-orange-400 text-orange-400' 
            : 'text-slate-400'}`}
        >
          External (BTC)
        </button>
        <button
          onClick={() => { setActiveTab('internal'); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold transition-all ${activeTab === 'internal' 
            ? 'border-b-2 border-orange-400 text-orange-400' 
            : 'text-slate-400'}`}
        >
          Internal
        </button>
      </div>

      {activeTab === 'external' && (
        <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-5 text-sm text-emerald-400">
          External transfers are sent directly to Bitcoin wallets.
        </div>
      )}

      {/* EXTERNAL TRANSFER */}
      {activeTab === 'external' && (
        <>
          {externalStep === 'form' && (
            <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="bg-amber-950/50 border border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-400">
                <strong>Minimum:</strong> ${MINIMUM_TRANSFER} USD
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Recipient BTC Address</label>
                <div className="relative">
                  <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-400"
                    placeholder="bc1qxy2kdy..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min={MINIMUM_TRANSFER}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white text-lg font-semibold focus:outline-none focus:border-orange-400"
                    placeholder="5000.00"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                  />
                </div>
              </div>

              {parsedAmount > 0 && (
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Amount</span>
                    <span>${parsedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fee ({EXTERNAL_FEE_PERCENT}%)</span>
                    <span className="text-red-400">+${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-xl">{error}</div>}

              <button
                onClick={handleExternalConfirm}
                disabled={!recipientAddress || !usdAmount}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-2xl transition-all hover:brightness-110"
              >
                Review Transfer
              </button>
            </div>
          )}

          {externalStep === 'confirm' && (
            <div>
              <button onClick={() => setExternalStep('form')} className="flex items-center gap-1 text-slate-400 mb-4">
                <ChevronLeft size={16} /> Back
              </button>
              <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Confirm External Transfer</h2>
                <div className="space-y-4 text-sm">
                  <Row label="Amount" value={`$${parsedAmount.toFixed(2)}`} />
                  <Row label="Fee" value={`$${feeAmount.toFixed(2)}`} red />
                  <Row label="Total" value={`$${totalAmount.toFixed(2)}`} bold />
                  <Row label="Recipient" value={recipientAddress} mono />
                </div>

                <button
                  onClick={handleProceedToFee}
                  disabled={loading}
                  className="mt-8 w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-2xl"
                >
                  {loading ? 'Processing...' : 'Proceed to Fee Payment'}
                </button>
              </div>
            </div>
          )}

          {externalStep === 'fee-payment' && (
            <div>
              <button onClick={() => setExternalStep('confirm')} className="flex items-center gap-1 text-slate-400 mb-6">
                <ChevronLeft size={16} /> Back
              </button>

              <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1">Pay Transfer Fee</h1>
                <p className="text-slate-400">Send exactly ${feeAmount.toFixed(2)} BTC</p>

                <div className="my-8 flex justify-center">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/10">
                    <img src={FEE_QR_IMAGE} alt="QR" className="w-48 h-48 rounded-xl" />
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Fee Address</p>
                  <div className="flex gap-2 bg-slate-950 border border-white/10 rounded-2xl p-3">
                    <p className="flex-1 font-mono text-xs break-all text-slate-300">{TRANSFER_FEE_BTC_ADDRESS}</p>
                    <button onClick={copyAddress} className="shrink-0">
                      {copied ? <CheckCircle className="text-emerald-400" /> : <Copy className="text-slate-400" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleFeePaid}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl mb-3"
                >
                  I Have Paid the Fee
                </button>
                <button onClick={handleCancelTransfer} className="w-full py-3 text-slate-400 hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* INTERNAL TRANSFER */}
      {activeTab === 'internal' && (
        <div className="bg-[#0b1220] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="bg-blue-950/50 border border-blue-800 rounded-xl p-4 text-sm text-blue-400">
            Send funds instantly to another Valmont user.
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Recipient Email</label>
            <input
              type="email"
              className="w-full px-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:border-orange-400"
              placeholder="user@valmont.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                className="w-full pl-8 pr-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white text-lg font-semibold focus:border-orange-400"
                placeholder="0.00"
                value={internalAmount}
                onChange={(e) => setInternalAmount(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-400 bg-red-950/50 border border-red-900 p-3 rounded-2xl">{error}</div>}

          <button
            onClick={handleInternalTransfer}
            disabled={internalLoading || !recipientEmail || !internalAmount}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50 text-white font-semibold rounded-2xl"
          >
            {internalLoading ? 'Sending...' : 'Send Internal Transfer'}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, red, bold, pending }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/10 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span 
        className={`text-right break-all ${
          mono ? 'font-mono text-xs' : ''
        } ${
          red ? 'text-red-400' : ''
        } ${
          bold ? 'font-bold text-white' : ''
        } ${
          pending ? 'text-amber-400 font-medium' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}