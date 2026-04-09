import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./Account.css";
import { useTranslation } from "react-i18next";

const AccountAdmin = () => {
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
      navigate("/login_admin");  // prevents unauthorized access if no user logged in
    }
  }, [navigate]);

  // Log out function
  const handleLogout = () => {
    localStorage.removeItem('user');  // removes the user info from the browser
    navigate('/');  // navigates back to the first app page
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
              <span className="label">{t("AccountAdmin.Email")}:</span>
              <span className="value">{userData?.email || "not set"}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_email")}>{t("AccountAdmin.ChangeEmail")}</button>
          </div>

          <div className="info-row email-row">
            <div className="email-top">
              <span className="label">{t("AccountAdmin.Language")}</span>
              <span className="value">{userData?.language}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_language")}>{t("AccountAdmin.ChangeLanguage")}</button> {/* Change to dropdown, dont know how to change into db without adding page like email */}
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
            <button className="grey-pill-btn">{t("AccountAdmin.EditScout")}</button>
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