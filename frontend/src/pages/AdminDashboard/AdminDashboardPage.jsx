import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import AdminDashboard from './AdminDashboard';
import ScoutReportModal from '../../components/AllMaps/Forms/ScoutReportModal';
import '../MapView/MapView.css';

// This page is so that the Admin Dashboard can be its own page instead of being a tab on the MapView page, since there
// were some bugs with navigating between the pages when it was a tab. The Admin Dashboard is still accessible from the
// MapView page, but it also has its own URL and page now.
// NOTE: The AdminDashboard.jsx is still used, this page just wraps it and adds everything to make it a separate page.
// NOTE: setRefreshTrigger is used to automatically update the AdminDashboard page when a report has been approved/declined.
export default function AdminDashboardPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleLocate = (report) => {setSelectedReport(report)};
  const handleReportApproved = () => {setSelectedReport(null);setRefreshTrigger(prev => prev + 1)};

  return (
    <AdminLayout title={t("Mapview.AdminDashboard")}>
      <div className="mapview-toolbar">
        <div className="mapview-tabs">
          <button className="mapview-tab" onClick={() => navigate('/maps')}>
            {t("Mapview.Maps")}
          </button>
          <button className="mapview-tab active" onClick={() => navigate('/maps/admin_dashboard')}>
            {t("Mapview.AdminDashboard")}
          </button>
        </div>
      </div>

      <div className="mapview-content">
        <AdminDashboard onLocate={handleLocate} refreshKey={refreshTrigger} />
      </div>

      <ScoutReportModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onReportApproved={handleReportApproved}
        cellInfo={selectedReport ? { label: selectedReport.cell_name, block_key: selectedReport.block_key } : null}
        reportData={selectedReport}
        mapName={selectedReport?.map_id || ''}/>
    </AdminLayout>
  );
}

