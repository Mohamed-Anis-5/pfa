import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}