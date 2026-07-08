import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ACCOUNT_TYPES = ['Personal', 'Private client', 'Corporate'];

// ─── BRANCH DETAILS SCREEN (Personal & Corporate) ─────────────────────────────
function BranchDetailsScreen({ application }) {
  return (
    <div style={styles.branchScreen}>
      <div style={styles.branchIconWrap}>
        <BuildingIcon />
      </div>
      <h2 style={styles.branchTitle}>Application Received</h2>
      <p style={styles.branchSub}>
        Please <strong style={{ color: '#c4a464' }}>take a screenshot</strong> of this page and
        bring it to any Valmont branch to complete your registration.
      </p>

      {/* Application details card */}
      <div style={styles.detailsCard}>
        <p style={styles.detailsCardTitle}>Your Application Details</p>

        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Full Name</span>
          <span style={styles.detailValue}>{application.fullName}</span>
        </div>
        <div style={styles.detailDivider} />
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Email</span>
          <span style={styles.detailValue}>{application.email}</span>
        </div>
        <div style={styles.detailDivider} />
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Account Type</span>
          <span style={styles.detailValue}>{application.accountType}</span>
        </div>
        <div style={styles.detailDivider} />
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Reference No.</span>
          <span style={{ ...styles.detailValue, color: '#c4a464', fontWeight: '700', letterSpacing: '0.08em' }}>
            {application.referenceNumber}
          </span>
        </div>
        <div style={styles.detailDivider} />
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Submitted</span>
          <span style={styles.detailValue}>
            {new Date(application.submittedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Screenshot notice */}
      <div style={styles.screenshotNotice}>
        <CameraIcon />
        <p style={styles.screenshotText}>
          Take a screenshot of this page now. You will need your reference number and these
          details when you visit the branch. Your account will be activated after your visit.
        </p>
      </div>

      {/* Branch info */}
      <div style={styles.branchCard}>
        <div style={styles.branchCardRow}>
          <ClockIcon />
          <div>
            <p style={styles.branchCardLabel}>Branch hours</p>
            <p style={styles.branchCardValue}>Monday – Friday, 9:00 AM – 5:00 PM</p>
          </div>
        </div>
      </div>

      <Link to="/login" style={styles.branchBtn}>
        Back to sign in <ArrowRightIcon />
      </Link>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState('Private client');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null); // for Personal/Corporate branch screen

  // ── Private client fields
  const [pc, setPc] = useState({
    firstName: '', lastName: '', email: '', password: '', confirm: '',
    guarantorToken: '', referredBy: '',
  });

  // ── Personal fields
  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', email: '', password: '', confirm: '',
    phone: '', dob: '', nationality: '', address: '',
  });

  // ── Corporate fields
  const [corp, setCorp] = useState({
    repName: '', email: '', password: '', confirm: '',
    companyName: '', regNumber: '', industry: '', country: '',
  });

  const activePassword =
    accountType === 'Private client' ? pc.password :
    accountType === 'Personal' ? personal.password : corp.password;

  const strength = useMemo(() => {
    const p = activePassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [activePassword]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#e24b4a', '#ef9f27', '#1d9e75', '#5dcaa5'][strength];

  const upd = (setter) => (key) => (e) => setter((prev) => ({ ...prev, [key]: e.target.value }));
  const updPc = upd(setPc);
  const updP = upd(setPersonal);
  const updC = upd(setCorp);

  const getActiveConfirm = () =>
    accountType === 'Private client' ? pc.confirm :
    accountType === 'Personal' ? personal.confirm : corp.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwd = activePassword;
    const confirm = getActiveConfirm();
    if (pwd !== confirm) return setError('Passwords do not match.');
    if (pwd.length < 8) return setError('Password must be at least 8 characters.');

    if (accountType === 'Private client' && !pc.guarantorToken.trim()) {
      return setError('Please enter your Guarantor Token ID.');
    }

    setLoading(true);
    try {
      if (accountType === 'Personal') {
        const result = await register({
          fullName: `${personal.firstName} ${personal.lastName}`.trim(),
          email: personal.email,
          password: personal.password,
          accountType,
        });
        if (result?.requiresBranchVisit) {
          setApplication(result.application);
        }
        return;
      }

      if (accountType === 'Corporate') {
        const result = await register({
          fullName: corp.repName,
          email: corp.email,
          password: corp.password,
          accountType,
        });
        if (result?.requiresBranchVisit) {
          setApplication(result.application);
        }
        return;
      }

      // Private client
      await register({
        fullName: `${pc.firstName} ${pc.lastName}`.trim(),
        email: pc.email,
        password: pc.password,
        accountType,
        guarantorToken: pc.guarantorToken.trim().toUpperCase(),
        referredBy: pc.referredBy.trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show branch details screen for Personal/Corporate after submit
  if (application) {
    return (
      <div style={styles.page}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={{ ...styles.wrapper, maxWidth: '460px', position: 'relative', zIndex: 1 }}>
          <div style={styles.brand}>
            <div style={styles.brandLogo}><BankIcon /></div>
            <span style={styles.brandName}>Val<span style={styles.brandAccent}>mont</span></span>
          </div>
          <div style={styles.card}>
            <BranchDetailsScreen application={application} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.wrapper}>
        <div style={styles.brand}>
          <div style={styles.brandLogo}><BankIcon /></div>
          <span style={styles.brandName}>Val<span style={styles.brandAccent}>mont</span></span>
        </div>

        <div style={styles.card}>
          <div style={styles.tabRow} role="group" aria-label="Account type">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setAccountType(t); setError(''); }}
                style={t === accountType ? styles.tabActive : styles.tab}
              >
                {t}
              </button>
            ))}
          </div>

          <h1 style={styles.cardTitle}>Open your account</h1>
          <p style={styles.cardSub}>
            {accountType === 'Personal' && 'Personal banking for everyday needs'}
            {accountType === 'Private client' && 'Private banking for the discerning investor'}
            {accountType === 'Corporate' && 'Business banking built for growth'}
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* ══ PERSONAL FIELDS ══ */}
            {accountType === 'Personal' && (
              <>
                <div style={styles.fieldRow}>
                  <Field label="First name" placeholder="John" value={personal.firstName} onChange={updP('firstName')} />
                  <Field label="Last name" placeholder="Doe" value={personal.lastName} onChange={updP('lastName')} />
                </div>
                <Field label="Email address" type="email" placeholder="you@example.com" value={personal.email} onChange={updP('email')} icon={<MailIcon />} />
                <Field label="Phone number" type="tel" placeholder="+1 (555) 000-0000" value={personal.phone} onChange={updP('phone')} icon={<PhoneIcon />} />
                <div style={styles.fieldRow}>
                  <Field label="Date of birth" type="date" value={personal.dob} onChange={updP('dob')} />
                  <Field label="Nationality" placeholder="American" value={personal.nationality} onChange={updP('nationality')} />
                </div>
                <Field label="Residential address" placeholder="123 Main St, City, State" value={personal.address} onChange={updP('address')} icon={<LocationIcon />} />
                <PasswordField label="Password" value={personal.password} onChange={updP('password')} show={showPassword} toggle={() => setShowPassword(!showPassword)} strength={strength} strengthLabel={strengthLabel} strengthColor={strengthColor} />
                <PasswordField label="Confirm password" value={personal.confirm} onChange={updP('confirm')} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} mismatch={personal.confirm && personal.confirm !== personal.password} />
              </>
            )}

            {/* ══ PRIVATE CLIENT FIELDS ══ */}
            {accountType === 'Private client' && (
              <>
                <div style={styles.fieldRow}>
                  <Field label="First name" placeholder="John" value={pc.firstName} onChange={updPc('firstName')} />
                  <Field label="Last name" placeholder="Doe" value={pc.lastName} onChange={updPc('lastName')} />
                </div>
                <Field label="Email address" type="email" placeholder="you@example.com" value={pc.email} onChange={updPc('email')} icon={<MailIcon />} />
                <PasswordField label="Password" value={pc.password} onChange={updPc('password')} show={showPassword} toggle={() => setShowPassword(!showPassword)} strength={strength} strengthLabel={strengthLabel} strengthColor={strengthColor} />
                <PasswordField label="Confirm password" value={pc.confirm} onChange={updPc('confirm')} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} mismatch={pc.confirm && pc.confirm !== pc.password} />

                {/* ── Guarantor Token ── */}
                <div style={styles.tokenSection}>
                  <div style={styles.tokenHeader}>
                    <KeyIcon />
                    <span style={styles.tokenHeaderText}>Guarantor Token</span>
                  </div>
                  <p style={styles.tokenHint}>
                    Private client accounts require a token issued by Valmont. Enter the code
                    provided to you by your relationship manager.
                  </p>
                  <Field
                    label="Token ID"
                    placeholder="e.g. A3F92C1D"
                    value={pc.guarantorToken}
                    onChange={updPc('guarantorToken')}
                    icon={<KeyIcon />}
                  />
                  <Field
                    label="Referred by (client first name)"
                    placeholder="e.g. John"
                    value={pc.referredBy}
                    onChange={updPc('referredBy')}
                    icon={<UserIcon />}
                  />
                </div>
              </>
            )}

            {/* ══ CORPORATE FIELDS ══ */}
            {accountType === 'Corporate' && (
              <>
                <Field label="Authorized representative name" placeholder="Jane Smith" value={corp.repName} onChange={updC('repName')} icon={<UserIcon />} />
                <Field label="Email address" type="email" placeholder="finance@company.com" value={corp.email} onChange={updC('email')} icon={<MailIcon />} />
                <Field label="Company name" placeholder="Acme Holdings Ltd." value={corp.companyName} onChange={updC('companyName')} icon={<BuildingSmIcon />} />
                <div style={styles.fieldRow}>
                  <Field label="Registration number" placeholder="RC-123456" value={corp.regNumber} onChange={updC('regNumber')} />
                  <Field label="Country of incorporation" placeholder="United States" value={corp.country} onChange={updC('country')} />
                </div>
                <Field label="Industry" placeholder="Financial Services" value={corp.industry} onChange={updC('industry')} />
                <PasswordField label="Password" value={corp.password} onChange={updC('password')} show={showPassword} toggle={() => setShowPassword(!showPassword)} strength={strength} strengthLabel={strengthLabel} strengthColor={strengthColor} />
                <PasswordField label="Confirm password" value={corp.confirm} onChange={updC('confirm')} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} mismatch={corp.confirm && corp.confirm !== corp.password} />
              </>
            )}

            <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <><Spinner /> Processing…</>
                : accountType === 'Private client'
                  ? <>Create account <ArrowRightIcon /></>
                  : <>Submit application <ArrowRightIcon /></>}
            </button>
          </form>

          <div style={styles.securityBar}>
            <ShieldIcon />
            <span style={styles.securityText}>Bank-grade security. Your data is never sold or shared.</span>
          </div>
        </div>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ─── REUSABLE FIELD COMPONENTS ────────────────────────────────────────────────

function Field({ label, type = 'text', placeholder, value, onChange, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <input
          type={type}
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...styles.input,
            borderColor: focused ? 'rgba(196,164,100,0.5)' : 'rgba(255,255,255,0.12)',
            paddingRight: icon ? '40px' : '14px',
          }}
        />
        {icon && <span style={styles.inputIcon}>{icon}</span>}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle, strength, strengthLabel, strengthColor, mismatch }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <input
          type={show ? 'text' : 'password'}
          required
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...styles.input,
            borderColor: mismatch
              ? 'rgba(226,75,74,0.5)'
              : focused
              ? 'rgba(196,164,100,0.5)'
              : 'rgba(255,255,255,0.12)',
          }}
        />
        <button type="button" onClick={toggle} style={styles.eyeBtn} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {strength !== undefined && value.length > 0 && (
        <div style={styles.strengthWrap}>
          <div style={styles.strengthBars}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{ ...styles.strengthBar, background: n <= strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <span style={{ ...styles.strengthLabel, color: strengthColor }}>{strengthLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: '100vh', background: '#050d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  orb1: { position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,164,100,0.07) 0%, transparent 70%)', pointerEvents: 'none' },
  orb2: { position: 'absolute', bottom: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,60,120,0.15) 0%, transparent 70%)', pointerEvents: 'none' },
  wrapper: { width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 },
  brand: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' },
  brandLogo: { width: '38px', height: '38px', background: 'linear-gradient(135deg, #c4a464, #a8843c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: '20px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.01em' },
  brandAccent: { color: '#c4a464' },
  card: { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px 24px', backdropFilter: 'blur(12px)' },
  tabRow: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', marginBottom: '24px', gap: '2px' },
  tab: { flex: 1, background: 'none', border: 'none', borderRadius: '8px', padding: '7px 4px', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  tabActive: { flex: 1, background: 'rgba(196,164,100,0.15)', border: 'none', borderRadius: '8px', padding: '7px 4px', fontSize: '12px', fontWeight: '500', color: '#c4a464', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' },
  cardTitle: { fontSize: '22px', fontWeight: '600', color: '#ffffff', marginBottom: '4px', letterSpacing: '-0.02em' },
  cardSub: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', lineHeight: '1.5' },
  errorBox: { background: 'rgba(220,53,69,0.1)', border: '0.5px solid rgba(220,53,69,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#f08080', marginBottom: '16px' },
  fieldRow: { display: 'flex', gap: '10px' },
  field: { flex: 1, marginBottom: '14px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' },
  inputWrap: { position: 'relative' },
  input: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#ffffff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  inputIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', pointerEvents: 'none' },
  eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  strengthWrap: { marginTop: '8px' },
  strengthBars: { display: 'flex', gap: '4px', marginBottom: '4px' },
  strengthBar: { flex: 1, height: '3px', borderRadius: '2px', transition: 'background 0.3s' },
  strengthLabel: { fontSize: '11px', fontWeight: '500' },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', cursor: 'pointer' },
  checkbox: { marginTop: '2px', accentColor: '#c4a464', flexShrink: 0, width: '14px', height: '14px', cursor: 'pointer' },
  checkText: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' },
  checkLink: { color: '#c4a464', textDecoration: 'none', fontWeight: '500' },
  btnPrimary: { width: '100%', background: 'linear-gradient(135deg, #c4a464, #a8843c)', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '600', color: '#0a1628', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.01em', transition: 'opacity 0.15s', marginBottom: '16px' },
  securityBar: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' },
  securityText: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.4' },
  footer: { textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' },
  footerLink: { color: '#c4a464', textDecoration: 'none', fontWeight: '500' },
  // Token section
  tokenSection: { background: 'rgba(196,164,100,0.05)', border: '0.5px solid rgba(196,164,100,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '14px' },
  tokenHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  tokenHeaderText: { fontSize: '12px', fontWeight: '600', color: '#c4a464', letterSpacing: '0.03em' },
  tokenHint: { fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '12px' },
  // Branch / application details screen
  branchScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  branchIconWrap: { width: '64px', height: '64px', background: 'rgba(196,164,100,0.12)', border: '0.5px solid rgba(196,164,100,0.25)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  branchTitle: { fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' },
  branchSub: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '20px' },
  detailsCard: { width: '100%', background: 'rgba(196,164,100,0.06)', border: '0.5px solid rgba(196,164,100,0.2)', borderRadius: '14px', padding: '4px 0', marginBottom: '16px', textAlign: 'left' },
  detailsCardTitle: { fontSize: '11px', fontWeight: '600', color: '#c4a464', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px 8px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', gap: '12px' },
  detailLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 },
  detailValue: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500', textAlign: 'right', wordBreak: 'break-all' },
  detailDivider: { height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '0 16px' },
  screenshotNotice: { display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,200,0,0.06)', border: '0.5px solid rgba(255,200,0,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' },
  screenshotText: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' },
  branchCard: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '4px 0', marginBottom: '20px', textAlign: 'left' },
  branchCardRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px' },
  branchDivider: { height: '0.5px', background: 'rgba(255,255,255,0.07)', margin: '0' },
  branchCardLabel: { fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  branchCardValue: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' },
  branchBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #c4a464, #a8843c)', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', color: '#0a1628', cursor: 'pointer', textDecoration: 'none' },
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const BankIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>);
const MailIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const EyeIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const ArrowRightIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>);
const ShieldIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(196,164,100,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);
const LocationIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const PhoneIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.47 2 2 0 0 1 3.62 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.87a16 16 0 0 0 6.06 6.06l1.94-1.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const ClockIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,164,100,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const BuildingIcon = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4a464" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>);
const BuildingSmIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>);
const UserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const KeyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4a464" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>);
const CameraIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,0,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const Spinner = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg>);