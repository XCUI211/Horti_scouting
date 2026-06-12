import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./PasswordChange.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const PasswordChange = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { t } = useTranslation();
  const { user } = useAuth();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Checking if the new password match in both fields
    if (newPassword !== confirmPassword) {
      return setError(t("PasswordChange.NewPasswordsDoNotMatch"));
    }

    try {
      if (!user || !user.uid) {
        return navigate("/login_admin");
      }

      // Sending uid, current password for verification and the new password to the backend
      await axios.post('http://localhost:5000/api/users/change-password', {
        uid: user.uid,
        currentPassword,
        newPassword
      });

      setSuccess(t("PasswordChange.UpdateSuccess"));
      // Redirecting after 2 seconds so the user can see the success message
      setTimeout(() => navigate(-1), 2000);

    } catch (err) {
      setError(err.response?.data?.message || t("PasswordChange.UpdateError"));
    }
  };

  return (
    <div className="password-change-container">
      <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
      <h1>{t("PasswordChange.Title")}</h1>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <form onSubmit={handleChangePassword}>
        <div className="input-group">
          <label>{t("PasswordChange.CurrentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>{t("PasswordChange.NewPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>{t("PasswordChange.ConfirmNewPassword")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="password-change-btn" disabled={!!success}>
          {success ? t("PasswordChange.ChangePassword") : t("PasswordChange.ChangePassword")}
        </button>
      </form>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>{t("PasswordChange.Back")}</button>

    </div>
  );
};

export default PasswordChange;