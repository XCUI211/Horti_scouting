import "./Login.css";
import {useNavigate} from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <img src="/logo.png" alt="Vireo logo" />
      <h2>Plant quality control app</h2>

      {/* Links the buttons to the routed to webpages */}
      <button className="admin" onClick={() => navigate("/login_admin")}>Log in as an Administrator</button>
      <button className="scout" onClick={() => navigate("/scout")}>Log in as a Scout</button>
      <button className="create-account" onClick={() => navigate("/create")}>Create Account</button>

      <button className="help">Help</button>
    </div>
  );
}
export default Login;