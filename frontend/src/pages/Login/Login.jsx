import "./Login.css";

function Login({ onAdminClick, onScoutClick }) {
  return (
    <div className="container">
      <img src="/logo.png" alt="Vireo logo" />
      <h2>Plant quality control app</h2>

      <button className="admin" onClick={onAdminClick}>Log in as an Administrator</button>
      <button className="scout" onClick={onScoutClick}>Log in as a Scout</button>

      <button className="help">Help</button>
    </div>
  );
}
export default Login;