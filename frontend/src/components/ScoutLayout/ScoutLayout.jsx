import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Bell, ClipboardList, UserCircle } from 'lucide-react';
import "./ScoutLayout.css";
import { useTranslation } from "react-i18next";

// Defines the general in-app layout for the Scout view
// that includes top header and bottom navigation bar

const ScoutLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const { t } = useTranslation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.mustChangePassword) {
        navigate("/force_password_change");
    }
  }, [navigate]);

  return (
    <div className="scout-mobile-wrapper">
      <div className="pwa-shell">

        {/* Top Header for the Scout's app view */}
        <header className="pwa-header">
          <div className="header-brand">
            <img src="/logo.png" alt="Vireo" className="header-logo" />
            <h1 className="header-title">{title}</h1>
          </div>
          {/* Profile Button - highlighted green only if on Account page */}
          <button
            className={`profile-btn ${isActive('/account_management_scout') ? 'active-profile' : ''}`}
            onClick={() => navigate('/account_management_scout')}
          >
            <UserCircle size={28} />
          </button>
        </header>

        {/* Here space for the content of each page */}
        <main className="pwa-main">
          {children}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="pwa-nav">
          <button className={`nav-item ${isActive('/scout_home') ? 'active' : ''}`} onClick={() => navigate('/scout_home')}>
            <Home size={22} />
            <span>{t("ScoutLayout.Home")}</span>
          </button>
          <button className={`nav-item ${isActive('/map_scout') ? 'active' : ''}`} onClick={() => navigate('/map_scout')}>
            <MapPin size={22} />
            <span>{t("ScoutLayout.Maps")}</span>
          </button>
          <button className={`nav-item ${isActive('/notifications_scout') ? 'active' : ''}`} onClick={() => navigate('/notifications_scout')}>
            <Bell size={22} />
            <span>{t("ScoutLayout.Notifications")}</span>
          </button>
          <button className={`nav-item ${isActive('/tasks') ? 'active' : ''}`} onClick={() => navigate('/tasks')}>
            <ClipboardList size={22} />
            <span>{t("ScoutLayout.Tasks")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default ScoutLayout;