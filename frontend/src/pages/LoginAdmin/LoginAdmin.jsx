import "./LoginAdmin.css";

function LoginAdmin({ onBack }) {
  return (
    <div className="admin-container">
      <img src="/logo.png" alt="Vireo logo" className="admin-logo" />
      <h1>Log in as an Administrator</h1>

      <div className="input-group">
        <label>Username</label>
        <input type="text" />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input type="password" />
      </div>

      <button className="login-submit">Log in</button>

      <a href="#" className="forgot-password">I forgot my password</a>

      {/* This button uses the onBack function from App.js */}
      <button className="back-btn" onClick={onBack}>Back</button>
    </div>
  );
}

export default LoginAdmin;