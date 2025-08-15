import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="card"><Spinner label="Authenticating..." /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}