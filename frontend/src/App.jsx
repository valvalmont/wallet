import { Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DepositPage from './pages/DepositPage';
import TransferPage from './pages/TransferPage';
import TransactionsPage from './pages/TransactionsPage';
import ChartsPage from './pages/ChartsPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import SecureAccessPage from './pages/SecureAccessPage';

// ─── ROUTE GUARDS ─────────────────────────────────────────────────────────────

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Guest({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function ProtectedAdmin({ children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const ADMIN_EMAILS = [
    'vincent@gmail.com',
  ];

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You are not authorized to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return children;
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login"    element={<Guest><LoginPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      <Route path="/secure-access" element={<SecureAccessPage />} />

      {/* Protected routes — all share the Layout shell */}
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route path="dashboard"    element={<DashboardPage />} />
        <Route path="deposit"      element={<DepositPage />} />
        <Route path="transfer"     element={<TransferPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="charts"       element={<ChartsPage />} />
        <Route path="settings"     element={<SettingsPage />} />

        {/* Admin-only route */}
        <Route
          path="admin"
          element={
            <ProtectedAdmin>
              <AdminPage />
            </ProtectedAdmin>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}