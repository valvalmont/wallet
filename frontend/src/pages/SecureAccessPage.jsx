import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, History, TimerOff, UserX } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const REASON_CONTENT = {
  used: {
    icon: History,
    title: 'Link Already Used',
    fallback: 'This access link has already been used. Each link only works once — ask your admin for a new one.',
  },
  expired: {
    icon: TimerOff,
    title: 'Link Expired',
    fallback: 'This access link has expired. Ask your admin to generate a new one.',
  },
  invalid: {
    icon: AlertCircle,
    title: 'Invalid Link',
    fallback: 'This access link is not valid. It may have been mistyped or already removed.',
  },
  user_not_found: {
    icon: UserX,
    title: 'Account Not Found',
    fallback: 'The account for this link no longer exists.',
  },
  missing_token: {
    icon: AlertCircle,
    title: 'Invalid Link',
    fallback: 'This link is missing required information.',
  },
};

export default function SecureAccessPage() {
  const [searchParams] = useSearchParams();
  const [failure, setFailure] = useState(null); // { reason, message }
  const navigate = useNavigate();
  const { saveUser } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setFailure({ reason: 'missing_token', message: null });
      return;
    }

    (async () => {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/consume-access-link`,
          { token },
          { withCredentials: true }
        );
        saveUser(data.user, data.accessToken);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        const reason = err.response?.data?.reason || 'invalid';
        const message = err.response?.data?.error || null;
        setFailure({ reason, message });
      }
    })();
  }, [searchParams, navigate, saveUser]);

  const Shell = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#05070c', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
      `}</style>
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,255,163,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,163,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
        }}
      />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.08) 0%, transparent 70%)' }} />
      {children}
    </div>
  );

  if (failure) {
    const content = REASON_CONTENT[failure.reason] || REASON_CONTENT.invalid;
    const Icon = content.icon;
    return (
      <Shell>
        <div className="relative text-center max-w-sm px-6 py-8 rounded-2xl border border-[#ff5470]/20 bg-[#0b1220]/80 backdrop-blur">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,84,112,0.1)', border: '1px solid rgba(255,84,112,0.25)' }}>
            <Icon size={26} className="text-[#ff5470]" />
          </div>
          <p className="text-lg font-bold text-slate-100 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{content.title}</p>
          <p className="text-slate-400 text-sm leading-relaxed">{failure.message || content.fallback}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="relative text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,163,0.08)', border: '1px solid rgba(0,255,163,0.25)' }}>
          <Loader2 className="animate-spin text-[#00ffa3]" size={26} />
        </div>
        <p className="text-slate-300 font-mono text-sm tracking-wide">VERIFYING ACCESS LINK…</p>
      </div>
    </Shell>
  );
}