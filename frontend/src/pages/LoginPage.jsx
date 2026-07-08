import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pendingActivation, setPendingActivation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingActivation(false);
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;

      if (data?.pendingActivation) {
        setPendingActivation(true);
      } else if (status === 401) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        @keyframes vlt-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes vlt-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
      <div style={styles.gridOverlay} />
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.wrapper}>
        <div style={styles.brand}>
          <div style={styles.brandLogo}><NodeIcon /></div>
          <span style={styles.brandName}>Valmont</span>
          <span style={styles.brandTag}>EXCHANGE</span>
        </div>

        <div style={styles.card}>
          <div style={styles.cardCornerTL} />
          <div style={styles.cardCornerBR} />

          <div style={styles.secureBadge}>
            <span style={styles.pulseDot} />
            <ShieldIcon />
            <span style={styles.secureBadgeText}>MULTI-SIG SESSION SECURED</span>
          </div>

          <h1 style={styles.cardTitle}>Welcome back</h1>
          <p style={styles.cardSub}>Sign in to access your Valmont wallet</p>

          {/* Standard error */}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Pending activation banner */}
          {pendingActivation && (
            <div style={styles.pendingBox}>
              <div style={styles.pendingIconRow}>
                <ClockIcon />
                <span style={styles.pendingTitle}>Account Pending Activation</span>
              </div>
              <p style={styles.pendingText}>
                Your account has been registered but identity verification (KYC) is
                still incomplete. Finish verification to unlock trading and withdrawals.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrap}>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
                <span style={styles.inputIcon}><MailIcon /></span>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, styles.input)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div style={styles.forgotRow}>
              <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <><Spinner /> Signing in…</> : <>Sign in <ArrowRightIcon /></>}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>SECURED BY</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.securityBar}>
            <LockIcon />
            <span style={styles.securityText}>Protected by 2FA &amp; biometric authentication</span>
          </div>
        </div>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.footerLink}>Open a wallet</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Crypto theme tokens ──
   bg-void   #05070c
   surface   #0b1220
   mint      #00ffa3  (primary / gains / CTA)
   violet    #8b5cf6  (secondary / brand accent)
   amber     #ffb84d  (pending / warning)
   danger    #ff5470
   text-hi   #eef2f7
   text-lo   #6b7688
*/
const styles = {
  page: { minHeight: '100vh', background: '#05070c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  gridOverlay: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)', backgroundSize: '42px 42px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 80%)', pointerEvents: 'none' },
  orb1: { position: 'absolute', top: '-80px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,163,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  orb2: { position: 'absolute', bottom: '-100px', left: '-100px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' },
  wrapper: { width: '100%', maxWidth: '360px', position: 'relative', zIndex: 1 },
  brand: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' },
  brandLogo: { width: '38px', height: '38px', background: 'linear-gradient(135deg, #00ffa3, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(0,255,163,0.25)' },
  brandName: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' },
  brandTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: '500', color: '#8b5cf6', letterSpacing: '0.18em', border: '0.5px solid rgba(139,92,246,0.35)', borderRadius: '4px', padding: '3px 6px', marginTop: '1px' },
  card: { position: 'relative', background: 'rgba(255,255,255,0.035)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px 28px', backdropFilter: 'blur(14px)', boxShadow: '0 0 0 1px rgba(0,255,163,0.03), 0 20px 60px rgba(0,0,0,0.4)' },
  cardCornerTL: { position: 'absolute', top: '14px', left: '14px', width: '14px', height: '14px', borderTop: '1.5px solid rgba(0,255,163,0.4)', borderLeft: '1.5px solid rgba(0,255,163,0.4)', borderRadius: '4px 0 0 0' },
  cardCornerBR: { position: 'absolute', bottom: '14px', right: '14px', width: '14px', height: '14px', borderBottom: '1.5px solid rgba(139,92,246,0.4)', borderRight: '1.5px solid rgba(139,92,246,0.4)', borderRadius: '0 0 4px 0' },
  secureBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,255,163,0.08)', border: '0.5px solid rgba(0,255,163,0.25)', borderRadius: '20px', padding: '4px 10px', marginBottom: '16px' },
  pulseDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#00ffa3', animation: 'vlt-pulse 1.8s ease-in-out infinite' },
  secureBadgeText: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4ee6ab', fontWeight: '500', letterSpacing: '0.04em' },
  cardTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '23px', fontWeight: '700', color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em' },
  cardSub: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: '1.5' },
  errorBox: { background: 'rgba(255,84,112,0.1)', border: '0.5px solid rgba(255,84,112,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff8fa3', marginBottom: '16px' },
  // Pending activation banner
  pendingBox: { background: 'rgba(255,184,77,0.07)', border: '0.5px solid rgba(255,184,77,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '16px' },
  pendingIconRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  pendingTitle: { fontSize: '13px', fontWeight: '600', color: '#ffb84d' },
  pendingText: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '10px' },
  pendingActions: { display: 'flex', gap: '12px' },
  pendingLink: { fontSize: '12px', fontWeight: '600', color: '#ffb84d', textDecoration: 'none' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' },
  inputWrap: { position: 'relative' },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '11px 40px 11px 14px', fontSize: '14px', color: '#ffffff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  inputFocus: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(0,255,163,0.5)', borderRadius: '10px', padding: '11px 40px 11px 14px', fontSize: '14px', color: '#ffffff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(0,255,163,0.08)', transition: 'border-color 0.15s, box-shadow 0.15s' },
  inputIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', pointerEvents: 'none' },
  eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  forgotRow: { textAlign: 'right', marginTop: '-4px', marginBottom: '18px' },
  forgotLink: { fontSize: '12px', color: '#8b5cf6', textDecoration: 'none', fontWeight: '500' },
  btnPrimary: { width: '100%', background: 'linear-gradient(135deg, #00ffa3, #00c97f)', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', color: '#04140d', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.01em', transition: 'opacity 0.15s', boxShadow: '0 0 24px rgba(0,255,163,0.25)' },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' },
  dividerLine: { flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.1)' },
  dividerText: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', letterSpacing: '0.1em' },
  oauthRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  oauthBtn: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit' },
  securityBar: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' },
  securityText: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.4' },
  footer: { textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' },
  footerLink: { color: '#00ffa3', textDecoration: 'none', fontWeight: '600' },
};

/* Blockchain-node brand mark: linked hex nodes instead of a bank facade */
const NodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04140d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l7 4v6l-7 4-7-4V6l7-4z" />
    <path d="M12 12v10M12 12 5 8M12 12l7-4" />
  </svg>
);
const ShieldIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ee6ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffb84d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const MailIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const EyeIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const ArrowRightIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const LockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,255,163,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const GoogleIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" opacity=".7"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" opacity=".7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" opacity=".7"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" opacity=".7"/></svg>);
const AppleIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>);
const Spinner = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg>);