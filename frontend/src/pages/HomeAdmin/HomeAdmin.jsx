import React from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./HomeAdmin.css";
import { useTranslation } from "react-i18next";

const HomeAdmin = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout title={t("HomeAdmin.Title")}>
      {/* Everything inside here becomes the 'children' prop in AdminLayout */}
      <div className="admin-home-content">
        <div className="empty-state">
          <p>{t("HomeAdmin.Dashboard")}</p>
          <span>{t("HomeAdmin.Description")}</span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomeAdmin;