import React from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./HomeAdmin.css";

const HomeAdmin = () => {
  return (
    <AdminLayout title="Home">
      {/* Everything inside here becomes the 'children' prop in AdminLayout */}
      <div className="admin-home-content">
        <div className="empty-state">
          <p>Admin Dashboard</p>
          <span>Content for plant quality control will appear here.</span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomeAdmin;