import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { MAP_ORDER } from '../../constants/mapOrder';

export default function AdminDashboard({ onLocate, refreshKey = 0 }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMaps, setExpandedMaps] = useState({});

  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const pending = data.data.filter(r => r.status === 'pending');
          setReports(pending);
        }
      })
      .catch(err => console.error("Failed to fetch reports:", err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Allows for bundling of multiple floor reports within the same entry/pop-up if they share the same report_batch_id,
  // which only happens when a user uses the multi-select tool.
  const reportBundles = reports.reduce((bundles, report) => {
    const bundleKey = report.report_batch_id || `single-${report.report_id}`;
    if (!bundles[bundleKey]) {
      bundles[bundleKey] = {
        ...report,
        bundle_key: bundleKey,
        is_batch: Boolean(report.report_batch_id && Number(report.batch_count) > 1),
        batch_count: Number(report.batch_count || 1),
        batch_cell_names: Array.isArray(report.batch_cell_names) ? report.batch_cell_names : [report.cell_name],
      };
      return bundles;
    }

    const currentCells = bundles[bundleKey].batch_cell_names || [];
    bundles[bundleKey].batch_cell_names = Array.from(new Set([...currentCells, report.cell_name]));
    bundles[bundleKey].batch_count = Math.max(bundles[bundleKey].batch_count, bundles[bundleKey].batch_cell_names.length);
    return bundles;
  }, {});
  const bundledReports = Object.values(reportBundles);

  // Group report bundles by map_id to make reports under each map togglable.
  const groupedReports = bundledReports.reduce((acc, report) => {
    const mapId = report.map_id || 'Unknown';
    if (!acc[mapId]) {
      acc[mapId] = [];
    }
    acc[mapId].push(report);
    return acc;
  }, {});

  const toggleMap = (mapId) => {
    setExpandedMaps(prev => ({
      ...prev,
      [mapId]: !prev[mapId]
    }));
  };

  const styles = {
    btnPrimary: { background: '#1976d2', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>{t("AdminDashboard.Pending")}</h2>
      
      {loading ? (
        <p>{t("AdminDashboard.Load")}</p>
      ) : bundledReports.length === 0 ? (
        <div style={{ padding: '20px', background: '#e6f7ff', borderRadius: '8px', color: '#0277bd', fontWeight: 'bold' }}>
          {t("AdminDashboard.NoPending")}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MAP_ORDER.filter(mapId => groupedReports[mapId]).map((mapId) => (
            <div key={mapId} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => toggleMap(mapId)}
                style={{
                  width: '100%',
                  padding: '14px 15px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderBottom: expandedMaps[mapId] ? '1px solid #ddd' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  color: '#333'
                }}
              >
                <span>{mapId} ({groupedReports[mapId].length})</span>
                <span style={{ fontSize: '12px', transition: 'transform 0.2s' }}>
                  {expandedMaps[mapId] ? '▼' : '▶'}
                </span>
              </button>
              {expandedMaps[mapId] && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {groupedReports[mapId].map((report) => (
                    <div key={report.bundle_key} style={{
                      border: '1px solid #ffcc80', background: '#fff8e1', padding: '12px', borderRadius: '6px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', color: '#d84315', fontSize: '14px' }}>
                          {report.is_batch
                            ? `${t("AdminDashboard.BatchReport")}: ${report.batch_count} ${t("AdminDashboard.Sections")}`
                            : `${t("AdminDashboard.Alert")}: ${report.cell_name}`}
                        </h4>
                        {report.is_batch && (
                          <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                            <strong>{t("AdminDashboard.Sections")}:</strong> {report.batch_cell_names.slice(0, 5).join(', ')}
                            {report.batch_cell_names.length > 5 ? ` +${report.batch_cell_names.length - 5}` : ''}
                          </p>
                        )}
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>{t("AdminDashboard.Reporter")}:</strong> {report.reporter_name}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>{t("AdminDashboard.Severity")}:</strong> {t("AdminDashboard.Level")} {report.severity}</p>
                        <p style={{ margin: '2px 0', fontSize: '11px', color: '#666' }}>{t("AdminDashboard.Date")}: {report.entry_date}</p>
                      </div>

                      <button style={styles.btnPrimary} onClick={() => onLocate(report)}>
                        {report.is_batch ? t("AdminDashboard.ReviewBatch") : t("AdminDashboard.LocateReview")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
