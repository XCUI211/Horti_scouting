import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Route guard wrapper.
//   <ProtectedRoute>...</ProtectedRoute>                  → must be logged in
//   <ProtectedRoute role="admin">...</ProtectedRoute>     → must be logged in AND role === 'admin'
//   <ProtectedRoute role="scout">...</ProtectedRoute>     → must be logged in AND role === 'scout'
//
// Not-logged-in users are redirected to the login landing page ('/').
// Logged-in users with the wrong role are bounced to their own home page.
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    const home = user.role === "admin" ? "/admin_home" : "/scout_home";
    return <Navigate to={home} replace />;
  }

  return children;
}
