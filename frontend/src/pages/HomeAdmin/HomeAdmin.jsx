import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPin, Bell, Users, BarChart3, UserCircle } from 'lucide-react';
import "./HomeAdmin.css";

const HomeAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Allows checking which page is currently active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="mobile-wrapper">
      <div className="pwa-shell">

        {/* Top Header */}
        <header className="pwa-header">
          <div className="header-brand">
            <img src="/logo.png" alt="Vireo" className="header-logo" />
            <h1 className="header-title">Home</h1>
          </div>
          {/* User Profile Button */}
          <button
            className="profile-btn"
            onClick={() => navigate('/account_management_admin')}
          >
            <UserCircle size={28} color="#333" />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="pwa-main">
          <div className="empty-state">
            <p>Admin Dashboard</p>
            <span>Content for plant quality control will appear here.</span>
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="pwa-nav">
          <button
            className={`nav-item ${isActive('/admin_home') ? 'active' : ''}`}
            onClick={() => navigate('/admin_home')}
          >
            <Home size={22} strokeWidth={2} />
            <span>Home</span>
          </button>

          <button className="nav-item" onClick={() => navigate('/map_admin')}>
            <MapPin size={22} />
            <span>Map</span>
          </button>

          <button className="nav-item" onClick={() => navigate('/notifications_admin')}>
            <Bell size={22} />
            <span>Notifications</span>
          </button>

          <button className="nav-item" onClick={() => navigate('/scouts_overview')}>
            <Users size={22} />
            <span>Scouts</span>
          </button>

          <button className="nav-item" onClick={() => navigate('/history')}>
            <BarChart3 size={22} />
            <span>History</span>
          </button>
        </nav>

      </div>
    </div>
  );
};

export default HomeAdmin;