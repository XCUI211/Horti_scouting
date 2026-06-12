import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./EmailChange.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const EmailChange = () => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(''); // required to authorize the change
  const [error, setError] = useState('');  // holds error messages
  const [success, setSuccess] = useState('');

  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) navigate('/login_admin');  // log out if no user
  }, [user, navigate]);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();  // prevents page from refreshing when "submit" is clicked
    // Clearing any messages
    setError('');
    setSuccess('');

    // Prevents Admins from clearing the email (they always need a valid email!)
    const isAdmin = user?.role === 'admin' || window.location.pathname.includes('admin');
    if (isAdmin && !newEmail.trim()) {
      setError(t("EmailChange.AdminMustHaveValidEmail"));
      return;
    }

    try { 
      await axios.post('http://localhost:5000/api/users/change-email', {
        uid: user.uid,
        password: password,
        newEmail: newEmail || null
      });

      // Updating AuthContext so the UI shows the new email immediately
      const updatedUser = { ...user, email: newEmail };
      setUser(updatedUser);

      setSuccess(t("EmailChange.UpdateSuccess"));
      setTimeout(() => navigate(-1), 800);  // goes back to previous page after a moment

    } catch (err) {
      setError(err.response?.data?.message || t("EmailChange.UpdateError"));
    }
  };

  return (
    <div className="email-change-container">
      <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
      <h1>{t("EmailChange.Title")}</h1>

      <p className="current-email-hint">
        {t("EmailChange.Current")} {user?.email || t("EmailChange.NoEmailSet")}
      </p>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <form onSubmit={handleUpdateEmail}>
        <div className="input-group">
          <label>{t("EmailChange.NewEmailAddress")}</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("EmailChange.EmailPlaceholder")}
          />
        </div>

        <div className="input-group">
          <label>{t("EmailChange.ConfirmWithPassword")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="email-submit">{t("EmailChange.UpdateEmail")}</button>
      </form>

      <button className="back-btn" onClick={() => navigate(-1)}>{t("EmailChange.Back")}</button>
    </div>
  );
};

export default EmailChange;