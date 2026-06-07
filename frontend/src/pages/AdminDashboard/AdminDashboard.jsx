import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { MAP_ORDER } from '../../constants/mapOrder';

export default function AdminDashboard({ onLocate, refreshKey = 0 }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMaps, setExpandedMaps] = useState({});

  const { t, i18n } = useTranslation(); //i18n for local language

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
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

  // Group reports by map_id to make the reports under each map togglable
  const groupedReports = reports.reduce((acc, report) => {
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
      ) : reports.length === 0 ? (
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
                    <div key={report.report_id} style={{
                      border: '1px solid #ffcc80', background: '#fff8e1', padding: '12px', borderRadius: '6px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', color: '#d84315', fontSize: '14px' }}>{t("AdminDashboard.Alert")}: {report.cell_name}</h4>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>{t("AdminDashboard.Reporter")}:</strong> {report.reporter_name}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>{t("AdminDashboard.Severity")}:</strong> {t("AdminDashboard.Level")} {report.severity}</p>
                        <p style={{ margin: '2px 0', fontSize: '11px', color: '#666' }}>{t("AdminDashboard.Date")}: {report.entry_date}</p>
                      </div>

                      <button style={styles.btnPrimary} onClick={() => onLocate(report)}>
                        {t("AdminDashboard.LocateReview")}
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
