import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "../AccountAdmin/Account.css";  // only one css file defined for user account page layout to keep it consistent

const AccountScout = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // gets user info

    if (storedUser && storedUser.uid) {
      axios.get(`http://localhost:5000/api/users/${storedUser.uid}`)  // sends a request for specific user info
        .then(res => setUserData(res.data))  // saves user data
        .catch(err => console.error("Error fetching user:", err));
    } else {
      navigate("/login_scout");  // prevents unauthorized access if no user logged in
    }
  }, [navigate]);

  // Log out function
  const handleLogout = () => {
    localStorage.removeItem('user');  // removes the user info from the browser
    navigate('/');
  };

  return (
    <ScoutLayout title="Your Account">
      <div className="account-container">

        {/* Manage your account */}
        <section className="account-section">
          <h2 className="section-title">Manage your account</h2>

          <div className="info-row">
            <span className="label">Username:</span>
            <span className="value">{userData?.username || "loading..."}</span>
          </div>

          <div className="info-row">
            <span className="label">Role:</span>
            <span className="value">{userData?.role || "loading..."}</span>
          </div>

          <div className="info-row stackable">
            <span className="label">Password:</span>
            <button className="grey-pill-btn" onClick={() => navigate("/change_password")}>Change password</button>
          </div>

          <div className="info-row email-row">
            <div className="email-top">
              <span className="label">Email:</span>
              <span className="value">{userData?.email || "not set"}</span>
            </div>
            <button className="grey-pill-btn align-right" onClick={() => navigate("/change_email")}>Change email</button>
          </div>
        </section>

        {/* Log out */}
        <button className="temp-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </ScoutLayout>
  );
};

export default AccountScout;