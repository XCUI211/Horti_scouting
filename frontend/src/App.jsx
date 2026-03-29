import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import LoginAdmin from "./pages/LoginAdmin/LoginAdmin";
import LoginScout from "./pages/LoginScout/LoginScout";
import CreateAccount from "./pages/CreateAccount/CreateAccount";
import SectionReport from "./pages/SectionReport/SectionReport";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/scout" element={<LoginScout />} />
      <Route path="/create" element={<CreateAccount />} />
      <Route path="/report" element={<SectionReport />} />
    </Routes>
  );
}

export default App;