import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import LoginAdmin from "./pages/LoginAdmin/LoginAdmin";
import LoginScout from "./pages/LoginScout/LoginScout";
import CreateAccount from "./pages/CreateAccount/CreateAccount";
import HomeAdmin from "./pages/HomeAdmin/HomeAdmin";
import HomeScout from "./pages/HomeScout/HomeScout";
import AccountAdmin from "./pages/AccountAdmin/AccountAdmin";
import AccountScout from "./pages/AccountScout/AccountScout";
import PasswordChange from "./pages/PasswordChange/PasswordChange";
import EmailChange from "./pages/EmailChange/EmailChange";
import ForcePasswordChange from "./pages/ForcePasswordChange/ForcePasswordChange";
import ScoutPasswordReset from "./pages/ScoutPasswordReset/ScoutPasswordReset";
import ScoutMapAssignment from "./pages/ScoutMapAssignment/ScoutMapAssignment";
import MapView from "./pages/MapView/MapView";
import MapViewScouts from "./pages/MapViewScouts/MapViewScouts";
import AdminDashboardPage from "./pages/AdminDashboard/AdminDashboardPage";
import History from "./pages/History/History.jsx";
import ScoutOverview from "./pages/ScoutOverview/ScoutOverview";
import TasksScout from "./pages/TasksScout/TasksScout";
import ReportsAdmin from "./pages/ReportsAdmin/ReportsAdmin";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes: login landing + role-specific login pages */}
      <Route path="/" element={<Login />} />
      <Route path="/login_admin" element={<LoginAdmin />} />
      <Route path="/login_scout" element={<LoginScout />} />

      {/* Admin-only routes */}
      <Route path="/admin_home" element={<ProtectedRoute role="admin"><HomeAdmin /></ProtectedRoute>} />
      <Route path="/account_management_admin" element={<ProtectedRoute role="admin"><AccountAdmin /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute role="admin"><CreateAccount /></ProtectedRoute>} />
      <Route path="/reset_scout_password" element={<ProtectedRoute role="admin"><ScoutPasswordReset /></ProtectedRoute>} />
      <Route path="/scout_maps_assign" element={<ProtectedRoute role="admin"><ScoutMapAssignment /></ProtectedRoute>} />
      <Route path="/maps/admin_dashboard" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute role="admin"><History /></ProtectedRoute>} />
      <Route path="/scout_overview" element={<ProtectedRoute role="admin"><ScoutOverview /></ProtectedRoute>} />
      <Route path="/maps" element={<ProtectedRoute role="admin"><MapView /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute role="admin"><ReportsAdmin /></ProtectedRoute>} />

      {/* Scout-only routes */}
      <Route path="/scout_home" element={<ProtectedRoute role="scout"><HomeScout /></ProtectedRoute>} />
      <Route path="/account_management_scout" element={<ProtectedRoute role="scout"><AccountScout /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute role="scout"><TasksScout /></ProtectedRoute>} />
      <Route path="/scout_maps" element={<ProtectedRoute role="scout"><MapViewScouts /></ProtectedRoute>} />

      {/* Any authenticated user (either role) */}
      <Route path="/change_password" element={<ProtectedRoute><PasswordChange /></ProtectedRoute>} />
      <Route path="/change_email" element={<ProtectedRoute><EmailChange /></ProtectedRoute>} />
      <Route path="/force_password_change" element={<ProtectedRoute><ForcePasswordChange /></ProtectedRoute>} />
      
    </Routes>
  );
}

export default App;
