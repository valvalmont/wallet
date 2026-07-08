import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const upd = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const strength = useMemo(() => {
    const p = form.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.newPassword]);

  const strengthMeta = [
    { label: '', color: '', text: '' },  
    { label: 'Weak',   color: 'bg-red-400',    text: 'text-red-500' },
    { label: 'Fair',   color: 'bg-amber-400',   text: 'text-amber-500' },
    { label: 'Good',   color: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
  ][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match.');
    if (form.currentPassword === form.newPassword) return setError('New password must differ from current.');
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.fullName
    ?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CB';

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
        <div className="max-w-sm mx-auto mt-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">Password changed</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Your password has been updated successfully.
            </p>

            {/* Prominent logout notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-[13px] font-semibold text-amber-800 mb-0.5">You've been signed out</p>
            <p className="text-[12px] text-amber-700 leading-relaxed">
                All active sessions have been ended. Please log in again using your new password.
            </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Redirecting to login in 3s…</span>
            </div>
        </div>
        </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-sm mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account security</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[15px] font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-gray-900 truncate">{user?.fullName}</p>
          <p className="text-[12px] text-gray-400 truncate">{user?.email}</p>
        </div>
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
          Private client
        </span>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">

        {/* Card header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Change password</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">
              After saving you'll be signed out of all sessions and must log in again.
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Current password */}
          <PasswordField
            label="Current password"
            value={form.currentPassword}
            onChange={upd('currentPassword')}
            show={showCurrent}
            toggle={() => setShowCurrent((v) => !v)}
          />

          {/* New password */}
          <PasswordField
            label="New password"
            value={form.newPassword}
            onChange={upd('newPassword')}
            show={showNew}
            toggle={() => setShowNew((v) => !v)}
            placeholder="Min. 8 characters"
          />

          {/* Strength meter */}
          {form.newPassword.length > 0 && (
            <div className="-mt-1">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      n <= strength ? strengthMeta.color : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-semibold ${strengthMeta.text}`}>
                {strengthMeta.label}
              </p>
            </div>
          )}

          {/* Confirm password */}
          <PasswordField
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={upd('confirmPassword')}
            show={showConfirm}
            toggle={() => setShowConfirm((v) => !v)}
            mismatch={form.confirmPassword && form.confirmPassword !== form.newPassword}
          />

          {/* Requirements */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Password requirements
            </p>
            <div className="space-y-2">
              <Req met={form.newPassword.length >= 8}        text="At least 8 characters" />
              <Req met={/[A-Z]/.test(form.newPassword)}      text="One uppercase letter" />
              <Req met={/[0-9]/.test(form.newPassword)}      text="One number" />
              <Req met={/[^A-Za-z0-9]/.test(form.newPassword)} text="One special character" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Spinner /> Updating password…
              </>
            ) : (
              <>
                Update password <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security notice */}
      <div className="flex gap-3 items-start bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-700 leading-relaxed">
          Changing your password signs you out of all devices and active sessions. You'll need to
          log in again with your new password.
        </p>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordField({ label, value, onChange, show, toggle, placeholder = '••••••••', mismatch }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-gray-50 text-gray-900 text-[14px] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all ${
            mismatch ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {mismatch && (
        <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
      )}
    </div>
  );
}

function Req({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${met ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      <span className={`text-[12px] transition-colors duration-200 ${met ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}