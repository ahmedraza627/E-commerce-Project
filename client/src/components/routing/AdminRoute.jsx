import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/** Role gate for admin-only routes. */
export default function AdminRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
