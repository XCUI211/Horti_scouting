import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./ScoutPasswordReset.css";
import { useTranslation } from "react-i18next";

const ScoutPasswordReset = () => {
  const navigate = useNavigate();
  const [scouts, setScouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScout, setSelectedScout] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { t } = useTranslation();

  // Loading all scouts for the dropdown list
  useEffect(() => {
    axios.get('http://localhost:5000/api/users/scouts')
      .then(res => setScouts(res.data))  // saves the list of scouts
      .catch(err => console.error("Error fetching scouts:", err));
  }, []);  // ensures that the request runs only once

  // Filtering the list based on typing
  const filteredScouts = scouts.filter(s =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Choosing the scout from the dropdown list
  const handleSelectScout = (scout) => {
    setSearchTerm(scout.username);
    setSelectedScout(scout);  // stores entire scout object info
    setShowDropdown(false);  // closes the list
  };

  // Handling the password reset
  const handleReset = async (e) => {
    e.preventDefault();
    if (!selectedScout) return setError(t("ScoutPasswordReset.SelectValidScout"));

    try {
      await axios.post('http://localhost:5000/api/admin/reset-scout-password', {
        scoutUid: selectedScout.uid,
        newPassword: newPassword
      });
      setSuccess(t("ScoutPasswordReset.ResetSuccess", { username: selectedScout.username }));
      setTimeout(() => navigate(-1), 2000);  // waits a moment before navigating away
    } catch (err) {
      setError(err.response?.data?.message || t("ScoutPasswordReset.ResetFailed"));
    }
  };

  return (
    <AdminLayout title={t("ScoutPasswordReset.PageTitle")}>
      <div className="scout-password-reset-container">
        <form className="reset-card" onSubmit={handleReset}>
          <div className="input-group">
            <label>{t("ScoutPasswordReset.SelectScout")}</label>
            <input
              type="text"
              placeholder={t("ScoutPasswordReset.StartTyping")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && searchTerm && (
              <ul className="scout-dropdown">
                {filteredScouts.map(scout => (
                  <li key={scout.uid} onClick={() => handleSelectScout(scout)}>
                    {scout.username}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-group">
            <label>{t("ScoutPasswordReset.TemporaryPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="reset-btn" disabled={!!success}>
            {t("ScoutPasswordReset.ResetPassword")}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ScoutPasswordReset;