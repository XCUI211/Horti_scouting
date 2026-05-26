import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./HomeAdmin.css";
import { useTranslation } from "react-i18next";

const HomeAdmin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AdminLayout title={t("HomeAdmin.Title")}>
      <div className="admin-home-content">

        {/* Navigation panel layout */}
        <div className="admin-home-grid">

          {/* Link to Map Assignment */}
          <div className="admin-shortcut-card" onClick={() => navigate("/scout_maps_assign")}>
            <span className="shortcut-title">{t("HomeAdmin.AssignMapsTitle", "Assign maps to scouts")}</span>
          </div>

          {/* Link to Pending Reports */}
          <div className="admin-shortcut-card" onClick={() => navigate("/maps/admin_dashboard")}>
            <span className="shortcut-title">{t("HomeAdmin.ViewReportsTitle", "View pending reports")}</span>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default HomeAdmin;