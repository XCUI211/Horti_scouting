import React, { useEffect, useState } from 'react';

export default function AdminDashboard({ onLocate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const styles = {
    btnPrimary: { background: '#1976d2', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📋 Pending Scout Reports</h2>
      
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <div style={{ padding: '20px', background: '#e6f7ff', borderRadius: '8px', color: '#0277bd', fontWeight: 'bold' }}>
          No pending reports at the moment! 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reports.map((report) => (
            <div key={report.report_id} style={{ 
              border: '1px solid #ffcc80', background: '#fff8e1', padding: '15px', borderRadius: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#d84315' }}>Alert at: {report.cell_name}</h4>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Reporter:</strong> {report.reporter_name}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Severity:</strong> Level {report.severity}</p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>Date: {report.entry_date}</p>
              </div>
              
              <button style={styles.btnPrimary} onClick={() => onLocate(report)}>
                Locate & Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
