import { useEffect, useState } from 'react';
import { CheckCircle, Clock, RefreshCw, Key, Plus, Copy, Check } from 'lucide-react';
import api from '../services/api';

export default function AdminPage() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [tokenLabel, setTokenLabel] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // User access links state
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchPending = async () => {
    setLoadingPayments(true);
    try {
      const { data } = await api.get('/admin/pending-payments');
      setPendingPayments(data.pendingPayments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const { data } = await api.get('/admin/tokens');
      setTokens(data.tokens || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchTokens();
    fetchUsers();
  }, []);

  const confirmPayment = async (transactionId) => {
    if (!window.confirm('Confirm this payment? This action cannot be undone.')) return;
    setConfirmingId(transactionId);
    try {
      await api.post('/admin/confirm-payment', { transactionId });
      alert('✅ Payment confirmed successfully!');
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm');
    } finally {
      setConfirmingId(null);
    }
  };

  const createToken = async () => {
    setCreatingToken(true);
    try {
      await api.post('/admin/create-token', { label: tokenLabel.trim() || undefined });
      setTokenLabel('');
      fetchTokens();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create token');
    } finally {
      setCreatingToken(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateLink = async () => {
    if (!selectedUserId) return;
    setGeneratingLink(true);
    setGeneratedLink(null);
    setLinkCopied(false);
    try {
      const { data } = await api.post('/admin/generate-access-link', {
        userId: selectedUserId,
        expiresInMinutes: 720,
      });
      setGeneratedLink(data.url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage payments and guarantor tokens</p>
        </div>
        <button
          onClick={() => { fetchPending(); fetchTokens(); fetchUsers(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* ── PENDING PAYMENTS ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Payments</h2>
        {loadingPayments ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : pendingPayments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700">No pending payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPayments.map((tx) => (
              <div
                key={tx.id}
                className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                      <Clock size={22} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {tx.type === 'opening_fee' ? 'Opening Fee' : 'Deposit'} — ${tx.amount}
                      </p>
                      <p className="text-gray-600">
                        {tx.account?.user?.fullName} • {tx.account?.user?.email}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Reference: {tx.reference} • {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => confirmPayment(tx.id)}
                  disabled={confirmingId === tx.id}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition-all whitespace-nowrap"
                >
                  {confirmingId === tx.id ? 'Confirming…' : 'Confirm Payment'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── USER ACCESS LINKS ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Secure Access Links</h2>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Generate a one-time login link for a user (expires in 12 hours)
          </p>
          <div className="flex gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">Select a user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
              ))}
            </select>
            <button
              onClick={generateLink}
              disabled={!selectedUserId || generatingLink}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl whitespace-nowrap"
            >
              {generatingLink ? 'Generating…' : 'Generate Link'}
            </button>
          </div>

          {generatedLink && (
            <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <input readOnly value={generatedLink} className="flex-1 bg-transparent text-xs text-gray-600 outline-none" />
              <button
                onClick={copyGeneratedLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium hover:bg-gray-100"
              >
                {linkCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {linkCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── GUARANTOR TOKENS ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Guarantor Tokens</h2>

        {/* Create token */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Generate a new token for a Private client applicant</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Label (optional — e.g. client name)"
              value={tokenLabel}
              onChange={(e) => setTokenLabel(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={createToken}
              disabled={creatingToken}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              <Plus size={15} />
              {creatingToken ? 'Creating…' : 'Create Token'}
            </button>
          </div>
        </div>

        {/* Token list */}
        {loadingTokens ? (
          <div className="text-center py-8 text-gray-400">Loading tokens…</div>
        ) : tokens.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border">
            <Key size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No tokens generated yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Code</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Label</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Used by</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Created</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {tokens.map((t, i) => (
                  <tr key={t.id} className={i < tokens.length - 1 ? 'border-b border-gray-50' : ''}>
                    <td className="px-6 py-4 font-mono font-semibold text-gray-800 tracking-widest">{t.code}</td>
                    <td className="px-6 py-4 text-gray-500">{t.label || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-4">
                      {t.isUsed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{t.usedByEmail || <span className="text-gray-200">—</span>}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {!t.isUsed && (
                        <button
                          onClick={() => copyCode(t.code)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-medium transition-colors"
                        >
                          {copiedCode === t.code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedCode === t.code ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}