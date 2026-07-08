import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine,
  List, BarChart2, LogOut, Menu, X, Zap, ShieldCheck, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/deposit',      label: 'Deposit',       icon: ArrowDownToLine },
  { to: '/transfer',     label: 'BTC Transfer',  icon: ArrowUpFromLine },
  { to: '/transactions', label: 'Transactions',  icon: List },
  { to: '/charts',       label: 'Charts',        icon: BarChart2 },
  { to: '/settings',     label: 'Settings',      icon: Settings },
];

const ADMIN_EMAILS = [
  'vincent@gmail.com',
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);

  // Reset scroll position to top whenever the route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CB';

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // NOTE: plain JSX value, not a nested component definition — keeps this
  // subtree from being remounted every time Layout re-renders.
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Zap size={15} className="text-white fill-white" />
        </div>
        <span className="font-bold text-[15px] tracking-tight text-white">Valmont</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-orange-950/50 text-orange-400 border border-orange-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/25' : 'bg-transparent group-hover:bg-slate-700'
                }`}>
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                </span>
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
              </>
            )}
          </NavLink>
        ))}

        {/* ADMIN LINK - Only visible to admins */}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-orange-950/50 text-orange-400 border border-orange-800/60'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/25' : 'bg-transparent group-hover:bg-slate-700'
                }`}>
                  <ShieldCheck size={14} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                </span>
                Admin Panel
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-800 mt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate leading-tight">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-400 hover:bg-red-950 transition-colors"
        >
          <span className="w-7 h-7 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center">
            <LogOut size={14} className="text-red-400" />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar — fixed so it never moves with page content */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-56 bg-slate-900 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X size={16} className="text-slate-400" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main column, offset by sidebar width on desktop */}
      <div className="h-full flex flex-col md:pl-56">
        {/* Mobile topbar — sticky so it stays visible while scrolling */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <Menu size={18} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="font-bold text-sm text-white">Valmont</span>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}