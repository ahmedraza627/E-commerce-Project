import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/** Gates a route on authentication; remembers where the user was heading. */
export default function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return null; // AuthInitializer normally covers this
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
