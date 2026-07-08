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

  // NOTE: this is a plain JSX value, not a nested component definition.
  // Defining it as `const SidebarContent = () => (...)` inside the component
  // body creates a brand-new component type on every render, which forces
  // React to unmount/remount the whole sidebar subtree each time Layout
  // re-renders (route changes, mobile toggle, etc.). Using a JSX variable
  // instead lets React diff and update it in place.
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap size={15} className="text-white fill-white" />
        </div>
        <span className="font-bold text-[15px] tracking-tight text-gray-900">Valmont</span>
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
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  isActive ? 'bg-indigo-600 shadow-md shadow-indigo-500/25' : 'bg-transparent group-hover:bg-gray-100'
                }`}>
                  <Icon size={14} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                </span>
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
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
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
                  isActive ? 'bg-indigo-600 shadow-md shadow-indigo-500/25' : 'bg-transparent group-hover:bg-gray-100'
                }`}>
                  <ShieldCheck size={14} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                </span>
                Admin Panel
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 pb-5 pt-3 border-t border-gray-100 mt-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{user?.fullName}</p>
            <p className="text-[11px] text-gray-400 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut size={14} className="text-red-500" />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50/60 overflow-hidden">
      {/* Desktop sidebar — fixed so it never moves with page content */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-gray-100"
        >
          <X size={16} className="text-gray-500" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main column, offset by sidebar width on desktop */}
      <div className="h-full flex flex-col md:pl-56">
        {/* Mobile topbar — sticky so it stays visible while scrolling */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">Valmont</span>
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