import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./EmailChange.css";

const EmailChange = () => {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(''); // required to authorize the change
  const [error, setError] = useState('');  // holds error messages
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(null);  // holds user basic info

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/login_admin');  // log out if no user
    setCurrentUser(user);  // saves user info
  }, [navigate]);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();  // prevents page from refreshing when "submit" is clicked
    // Clearing any messages
    setError('');
    setSuccess('');

    // Prevents Admins from clearing the email (they always need a valid email!)
    const isAdmin = currentUser?.role === 'admin' || window.location.pathname.includes('admin');
    if (isAdmin && !newEmail.trim()) {
      setError("Admins must have a valid email address.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/change-email', {
        uid: currentUser.uid,
        password: password,
        newEmail: newEmail || null // allows clearing the email if left blank (if user is a scout)
      });

      // Updating local storage so the UI shows the new email immediately
      const updatedUser = { ...currentUser, email: newEmail };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess("Email updated successfully!");
      setTimeout(() => navigate(-1), 800);  // goes back to previous page after a moment

    } catch (err) {
      setError(err.response?.data?.message || "Error updating email");
    }
  };

  return (
    <div className="email-change-container">
      <img src="/logo.png" alt="Vireo logo" className="scout-logo" />
      <h1>Update Email</h1>

      <p className="current-email-hint">
        Current: {currentUser?.email || "No email set"}
      </p>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <form onSubmit={handleUpdateEmail}>
        <div className="input-group">
          <label>New Email Address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="example@vireo.nl"
          />
        </div>

        <div className="input-group">
          <label>Confirm with Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="email-submit">Update Email</button>
      </form>

      <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default EmailChange;