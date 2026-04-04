import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Bell, Users, BarChart3, UserCircle } from 'lucide-react';
import "./AdminLayout.css";

const AdminLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
            <span>Home</span>
          </button>
          <button className={`nav-item ${isActive('/map_admin') ? 'active' : ''}`} onClick={() => navigate('/map_admin')}>
            <MapPin size={22} />
            <span>Map</span>
          </button>
          <button className={`nav-item ${isActive('/notifications_admin') ? 'active' : ''}`} onClick={() => navigate('/notifications_admin')}>
            <Bell size={22} />
            <span>Notifications</span>
          </button>
          <button className={`nav-item ${isActive('/scouts_overview') ? 'active' : ''}`} onClick={() => navigate('/scouts_overview')}>
            <Users size={22} />
            <span>Scouts</span>
          </button>
          <button className={`nav-item ${isActive('/history') ? 'active' : ''}`} onClick={() => navigate('/history')}>
            <BarChart3 size={22} />
            <span>History</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;