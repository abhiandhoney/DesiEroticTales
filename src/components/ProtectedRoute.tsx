import { Navigate, useLocation } from 'react-router-dom';
import { storeAuthReturnPath } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireWriter?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireWriter = false }: Props) {
  const { user, loading, isAdmin, isWriter } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><p>Loading...</p></div>;
  }
  if (!user) {
    storeAuthReturnPath(`${location.pathname}${location.search}`);
    return <Navigate to="/" replace />;
  }
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireWriter && !isWriter) return <Navigate to="/" replace />;
  return <>{children}</>;
}