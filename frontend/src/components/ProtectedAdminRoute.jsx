import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();

  // Replace with your actual admin email(s)
  const ADMIN_EMAILS = ['vincent@gmail.com']; 

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return (
      <div className="max-w-sm mx-auto text-center py-20">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You are not authorized to access the admin panel.</p>
      </div>
    );
  }

  return children;
}