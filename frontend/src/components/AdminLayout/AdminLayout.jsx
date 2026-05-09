import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, BookText, Users, BarChart3, UserCircle } from 'lucide-react';
import "./AdminLayout.css";
import { useTranslation } from "react-i18next";

// Defines the general in-app layout for the Admin view
// that includes top header and bottom navigation bar

const AdminLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => path === '/maps' ? location.pathname.startsWith('/maps') : location.pathname === path;
  const { t } = useTranslation();

  return (
    <div className="admin-mobile-wrapper">
      <div className="pwa-shell">

        {/* Top Header for the Admin's app view */}
        <header className="pwa-header">
          <div className="header-brand">
            <img src="/logo.png" alt="Vireo" className="header-logo" />
            <h1 className="header-title">{title}</h1>
          </div>
          {/* Profile Button - highlighted green only if on Account page */}
          <button
            className={`profile-btn ${isActive('/account_management_admin') ? 'active-profile' : ''}`}
            onClick={() => navigate('/account_management_admin')}
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
          <button className={`nav-item ${isActive('/admin_home') ? 'active' : ''}`} onClick={() => navigate('/admin_home')}>
            <Home size={22} />
            <span>{t("AdminLayout.Home")}</span>
          </button>
          <button className={`nav-item ${isActive('/maps') ? 'active' : ''}`} onClick={() => navigate('/maps')}>
            <MapPin size={22} />
            <span>{t("AdminLayout.Maps")}</span>
          </button>
          <button className={`nav-item ${isActive('/notifications_admin') ? 'active' : ''}`} onClick={() => navigate('/notifications_admin')}>
            <BookText size={22} />
            <span>{t("AdminLayout.Reports")}</span>
          </button>
          <button className={`nav-item ${isActive('/scouts_overview') ? 'active' : ''}`} onClick={() => navigate('/scouts_overview')}>
            <Users size={22} />
            <span>{t("AdminLayout.Scouts")}</span>
          </button>
          <button className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => navigate('/history')}>
            <BarChart3 size={22} />
            <span>{t("AdminLayout.History")}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;