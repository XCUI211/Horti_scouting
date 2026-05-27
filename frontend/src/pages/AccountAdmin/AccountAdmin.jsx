import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./Account.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const AccountAdmin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { user, setUser, logout } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || "nl");
  const [password, setPassword] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (user && user.uid) {
      axios.get(`http://localhost:5000/api/users/${user.uid}`)
        .then(res => {
          const lang = res.data.language || "nl";
          setUserData(res.data);
          setSelectedLanguage(lang);
          if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
          }
        })
        .catch(err => console.error("Error fetching user:", err));
    } else {
      navigate("/login_admin");
    }
  }, [user, navigate, i18n]);

  const handleLogout = () => {
    logout();
    navigate('/');
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

      const updatedUser = { ...user, language: newLanguage };
      setUser(updatedUser);

    } catch (err) {
      console.error("Error updating language:", err);
    }
  };

  return (
    <AdminLayout title={t("AccountAdmin.YourAccount")}>
      <div className="account-container">

        {/* This wrapper groups the sections together to form a side-by-side layout on tablets and laptops */}
        <div className="account-sections-grid">

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
              </div>

              <select
                className="grey-pill-btn align-right"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
              </select>
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

        </div> {/* <-- This correctly closes account-sections-grid */}

        {/* Log out */}
        <button className="temp-logout" onClick={handleLogout}>
          {t("AccountAdmin.LogOut")}
        </button>

      </div>
    </AdminLayout>
  );
};

export default AccountAdmin;