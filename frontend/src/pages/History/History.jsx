import React from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import PestHistory from '../../components/PestHistory/PestHistory';
import "./History.css";
import { useTranslation } from "react-i18next";

const History = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout title={t("History.Title")}>
      <div className="admin-plant-history-content">
        <PestHistory />
      </div>
    </AdminLayout>
  );
};

export default History;