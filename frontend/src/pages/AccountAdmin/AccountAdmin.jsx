import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./Account.css";
import { useTranslation } from "react-i18next";

const AccountAdmin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("nl");
  const [password, setPassword] = useState("");

  const { t, i18n } = useTranslation(); //i18n for local language

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // gets user info

    if (storedUser && storedUser.uid) {
      axios.get(`http://localhost:5000/api/users/${storedUser.uid}`)  // sends a request for specific user info
        .then(res => {
          setUserData(res.data);  // saves user data
          setSelectedLanguage(res.data.language || "nl");
          i18n.changeLanguage(res.data.language || "nl");
        })
        .catch(err => console.error("Error fetching user:", err));
    } else {
      navigate("/login_admin");  // prevents unauthorized access if no user logged in
    }
  }, [navigate, i18n]);

  // Log out function
  const handleLogout = () => {
    localStorage.removeItem('user');  // removes the user info from the browser
    navigate('/');  // navigates back to the first app page
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);

    try {
      await axios.post('http://localhost:5000/api/users/change-language', {
        uid: userData.uid,
        password: password,
        newLanguage: newLanguage
      });
      i18n.changeLanguage(newLanguage);

      const updatedUser = { ...userData, language: newLanguage };
      setUserData(updatedUser);

      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        localStorage.setItem(
          'user',
          JSON.stringify({ ...storedUser, language: newLanguage })
        );
      }
    } catch (err) {
      console.error("Error updating language:", err);
    }
  };

  return (
    <AdminLayout title={t("AccountAdmin.YourAccount")}>
      <div className="account-container">

        {/* Manage your account */}
        <section className="account-section">
          <h2 className="section-title">{t("AccountAdmin.manYour")}</h2>

          <div className="info-row">
            <span className="label">{t("AccountAdmin.Username")}:</span>
            <span className="value">{userData?.username || "loading..."}</span>
          </div>

          <div className="info-row">
            <span className="label">{t("AccountAdmin.Role")}:</span>
            <span className="value">{userData?.role || "loading..."}</span>
          </div>

          <div className="info-row stackable">
            <span className="label">{t("AccountAdmin.Password")}:</span>
            <button className="grey-pill-btn" onClick={() => navigate("/change_password")}>{t("AccountAdmin.ChangePassword")}</button>
          </div>

          <div className="info-row email-row">
            <div className="email-top">
              <span className="label">{t("AccountAdmin.Email")}</span>
              <span className="value">{userData?.email || "not set"}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_email")}>{t("AccountAdmin.ChangeEmail")}</button>
          </div>

          <div className="info-row language-row">
            <div className="language-top">
              <span className="label">{t("AccountAdmin.Language")}</span>
              <select
                className="grey-pill-btn align-right"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>
            
          </div>
        </section>

        {/* Manage scout accounts */}
        <section className="account-section">
          <h2 className="section-title">{t("AccountAdmin.manScout")}</h2>

          <div className="info-row stackable">
            <span className="label">{t("AccountAdmin.newScout")}:</span>
            <button className="green-pill-btn" onClick={() => navigate("/create")}>{t("AccountAdmin.newScoutAcc")}</button>
          </div>

          <div className="info-row stackable">
            <span className="label">{t("AccountAdmin.EditScoutInfo")}</span>
            <button className="grey-pill-btn" onClick={() => navigate("/scout_maps_assign")}>{t("AccountAdmin.EditScout")}</button>
          </div>

          <div className="info-row stackable">
            <span className="label">{t("AccountAdmin.ResPass")}</span>
            <button className="grey-pill-btn" onClick={() => navigate("/reset_scout_password")}>{t("AccountAdmin.ResScoutPass")}</button>
          </div>
        </section>

        {/* Log out */}
        <button className="temp-logout" onClick={handleLogout}>
          {t("AccountAdmin.LogOut")}
        </button>
        
      </div>
    </AdminLayout>
  );
};

export default AccountAdmin;