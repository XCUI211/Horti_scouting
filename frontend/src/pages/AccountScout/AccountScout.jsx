import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "../AccountAdmin/Account.css";  // only one css file defined for user account page layout to keep it consistent
import { useTranslation } from "react-i18next";

const AccountScout = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // gets user info

    if (storedUser && storedUser.uid) {
      axios.get(`http://localhost:5000/api/users/${storedUser.uid}`)  // sends a request for specific user info
        .then(res => setUserData(res.data))  // saves user data
        .catch(err => console.error("Error fetching user:", err));
    } else {
      navigate("/login_scout");  // prevents unauthorized access if no user logged in
    }
  }, [navigate]);

  // Log out function
  const handleLogout = () => {
    localStorage.removeItem('user');  // removes the user info from the browser
    navigate('/');
  };

  return (
    <ScoutLayout title={t("AccountScout.YourAccount")}>
      <div className="account-container">

        {/* Manage your account */}
        <section className="account-section">
          <h2 className="section-title">{t("AccountScout.manYour")}</h2>

          <div className="info-row">
            <span className="label">{t("AccountScout.Username")}:</span>
            <span className="value">{userData?.username || t("AccountScout.Loading")}</span>
          </div>

          <div className="info-row">
            <span className="label">{t("AccountScout.Role")}:</span>
            <span className="value">{userData?.role || t("AccountScout.Loading")}</span>
          </div>

          <div className="info-row stackable">
            <span className="label">{t("AccountScout.Password")}:</span>
            <button className="grey-pill-btn" onClick={() => navigate("/change_password")}>
              {t("AccountScout.ChangePassword")}
            </button>
          </div>

          <div className="info-row email-row">
            <div className="email-top">
              <span className="label">{t("AccountScout.Email")}</span>
              <span className="value">{userData?.email || t("AccountScout.NotSet")}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_email")}>
              {t("AccountScout.ChangeEmail")}
            </button>
          </div>

          <div className="info-row language-row">
            <div className="language-top">
              <span className="label">{t("AccountScout.Language")}</span>
              <span className="value">{userData?.language}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_language")}>{t("AccountScout.ChangeLanguage")}</button> {/* Change to dropdown, dont know how to change into db without adding page like email */}
          </div>

        </section>

        {/* Log out */}
        <button className="temp-logout" onClick={handleLogout}>
          {t("AccountScout.LogOut")}
        </button>
      </div>
    </ScoutLayout>
  );
};

export default AccountScout;