import "./LoginScout.css";

function LoginScout({ onBack }) {
  return (
    <div className="scout-container">
      <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
      <h1>Log in as a Scout</h1>

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

export default LoginScout;