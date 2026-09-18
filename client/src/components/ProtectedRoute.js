import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// requiredRole is UI-level gating only; the API enforces the same rule.
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
