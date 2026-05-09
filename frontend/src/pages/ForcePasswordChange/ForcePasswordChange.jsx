import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./ForcePasswordChange.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const handleForceChange = async (e) => {
    e.preventDefault(); // stops browser from refreshing

    if (newPassword !== confirmPassword) {
      return setError(t("ForcePasswordChange.PasswordsDoNotMatch"));
    }

    try {

      await axios.post('http://localhost:5000/api/users/complete-force-change', {
        uid: user.uid,
        newPassword
      });

      // Updating local storage so the 'mustChangePassword' flag is now false
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);

      navigate("/scout_home");
    } catch (err) {
      setError(t("ForcePasswordChange.UpdateFailed"));
    }
  };

  return (
    <div className="force-change-wrapper">
      <div className="force-change-card">
        <h2 className="force-title">{t("ForcePasswordChange.Title")}</h2>
        <p className="force-description">
          {t("ForcePasswordChange.Description")}
        </p>

        <form onSubmit={handleForceChange}>
          <div className="force-input-group">
            <label>{t("ForcePasswordChange.NewPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="force-input-group">
            <label>{t("ForcePasswordChange.ConfirmNewPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="force-error-text">{error}</p>}

          <button type="submit" className="force-submit-btn">
            {t("ForcePasswordChange.SaveContinue")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;