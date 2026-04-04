import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./ForcePasswordChange.css";

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleForceChange = async (e) => {
    e.preventDefault();  // stops browser from refreshing
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    try {
      const user = JSON.parse(localStorage.getItem('user'));  // gets user info

      await axios.post('http://localhost:5000/api/users/complete-force-change', {  // sends the new password to backend
        uid: user.uid,
        newPassword
      });

      // Updating local storage so the 'mustChangePassword' flag is now false
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      navigate("/scout_home");
    } catch (err) {
      setError("Failed to update password. Try again.");
    }
  };

  return (
    <div className="force-change-wrapper">
      <div className="force-change-card">
        <h2 className="force-title">Update Password</h2>
        <p className="force-description">
          Your password was reset by the Administrator. You must choose a new one to continue.
        </p>

        <form onSubmit={handleForceChange}>
          <div className="force-input-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="force-input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="force-error-text">{error}</p>}

          <button type="submit" className="force-submit-btn">
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;