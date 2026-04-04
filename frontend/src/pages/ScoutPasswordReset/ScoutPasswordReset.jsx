import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./ScoutPasswordReset.css";

const ScoutPasswordReset = () => {
  const navigate = useNavigate();
  const [scouts, setScouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScout, setSelectedScout] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (!selectedScout) return setError("Please select a valid scout.");

    try {
      await axios.post('http://localhost:5000/api/admin/reset-scout-password', {
        scoutUid: selectedScout.uid,
        newPassword: newPassword
      });
      setSuccess(`Password for ${selectedScout.username} reset successfully!`);
      setTimeout(() => navigate(-1), 2000);  // waits a moment before navigating away
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <AdminLayout title="Reset Scout Password">
      <div className="scout-password-reset-container">
        <form className="reset-card" onSubmit={handleReset}>
          <div className="input-group">
            <label>Select Scout (Username)</label>
            <input
              type="text"
              placeholder="Start typing username..."
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
            <label>Temporary Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="reset-btn" disabled={!!success}>{success ? "Reset Password" : "Reset Password"}</button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ScoutPasswordReset;