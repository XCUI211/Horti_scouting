import React from 'react';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "./HomeScout.css";
import { useTranslation } from "react-i18next";

const HomeScout = () => {
  const { t } = useTranslation();

  return (
    <ScoutLayout title={t("HomeScout.Title")}>
      <div className="scout-home-content">
        <div className="empty-state">
          <p>{t("HomeScout.Dashboard")}</p>
          <span>{t("HomeScout.Description")}</span>
        </div>
      </div>
    </ScoutLayout>
  );
};

export default HomeScout;