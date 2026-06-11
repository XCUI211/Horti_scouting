import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="login-container">
      <img src="/logo.png" alt="Vireo logo" />
      <h2>{t("Login.Title")}</h2>

      {/* Links the buttons to the route to webpages */}
      <button className="admin" onClick={() => navigate("/login_admin")}>{t("Login.Admin")}</button>
      <button className="scout" onClick={() => navigate("/login_scout")}>{t("Login.Scout")} </button>

    </div>
  );
}

export default Login;