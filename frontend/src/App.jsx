import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import LoginAdmin from "./pages/LoginAdmin/LoginAdmin";
import LoginScout from "./pages/LoginScout/LoginScout";
import CreateAccount from "./pages/CreateAccount/CreateAccount";
import FloorReport from "./pages/FloorReport/FloorReport.jsx";
import HomeAdmin from "./pages/HomeAdmin/HomeAdmin";
import HomeScout from "./pages/HomeScout/HomeScout";
import AccountAdmin from "./pages/AccountAdmin/AccountAdmin";
import AccountScout from "./pages/AccountScout/AccountScout";
import PasswordChange from "./pages/PasswordChange/PasswordChange";
import EmailChange from "./pages/EmailChange/EmailChange";
import ForcePasswordChange from "./pages/ForcePasswordChange/ForcePasswordChange";
import ScoutPasswordReset from "./pages/ScoutPasswordReset/ScoutPasswordReset";
import ScoutMapAssignment from "./pages/ScoutMapAssignment/ScoutMapAssignment";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login_admin" element={<LoginAdmin />} />
      <Route path="/admin_home" element={<HomeAdmin />} />
      <Route path="/scout_home" element={<HomeScout />} />
      <Route path="/login_scout" element={<LoginScout />} />
      <Route path="/create" element={<CreateAccount />} />
      <Route path="/report" element={<FloorReport />} />
      <Route path="/account_management_admin" element={<AccountAdmin />} />
      <Route path="/account_management_scout" element={<AccountScout />} />
      <Route path="/change_password" element={<PasswordChange />} />
      <Route path="/change_email" element={<EmailChange />} />
      <Route path="/reset_scout_password" element={<ScoutPasswordReset />} />
      <Route path="/force_password_change" element={<ForcePasswordChange />} />
      <Route path="/scout_maps_assign" element={<ScoutMapAssignment />} />
    </Routes>
  );
}

export default App;