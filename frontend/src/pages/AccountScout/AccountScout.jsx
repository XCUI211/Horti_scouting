import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "../AccountAdmin/Account.css";  // only one css file defined for user account page layout to keep it consistent
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const AccountScout = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || "nl");

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
      navigate("/login_scout");
    }
  }, [user, navigate, i18n]);

  // Log out function
  const handleLogout = () => {
    logout();  // removes the user info from the browser
    navigate('/');  // navigates back to the first app page
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);

    try {
      await axios.post('http://localhost:5000/api/users/change-language', {
        uid: userData.uid,
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

        {/* Log out */}
        <button className="temp-logout" onClick={handleLogout}>
          {t("AccountScout.LogOut")}
        </button>
      </div>
    </ScoutLayout>
  );
};

export default AccountScout;