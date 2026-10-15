import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div role="status" className="p-8 text-center">Đang tải...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;

  return children ?? <Outlet />;
};

export default ProtectedRoute;
