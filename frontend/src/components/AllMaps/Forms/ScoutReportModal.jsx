import React, { useState, useEffect } from 'react';

const pestOptions = [
  { value: 'red_spider_mite', label: 'Red spider mite' },
  { value: 'thrips', label: 'Thrips' },
  { value: 'green_louse', label: 'Green louse' },
  { value: 'black_louse', label: 'Black louse' },
  { value: 'mealybug', label: 'Mealybug' },
  { value: 'pythium', label: 'Pythium' },
  { value: 'mite', label: 'Mite' },
  { value: 'cycada', label: 'Cycada' },
  { value: 'weed', label: 'Weed' },
  { value: 'caterpillar', label: 'Caterpillar' },
];

const biologyOptions = [
  { value: 'bio1', label: 'Bio1' },
  { value: 'bio2', label: 'Bio2' },
  { value: 'bio3', label: 'Bio3' },
];

const chemicalsOptions = [
  { value: 'chem1', label: 'Chem1' },
  { value: 'chem2', label: 'Chem2' },
  { value: 'chem3', label: 'Chem3' },
];

export default function ScoutReportModal({ isOpen, onClose, cellInfo, reportData, mapName }) {
  const [fid, setFid] = useState('');
  const [uid, setUid] = useState('');

  const [pestsFound, setPestsFound] = useState('');
  const [pestType, setPestType] = useState([]);
  const [pestSeverity, setPestSeverity] = useState('');

  const [biologyUsed, setBiologyUsed] = useState('');
  const [biologyTypes, setBiologyTypes] = useState([]);
  const [chemicalsUsed, setChemicalsUsed] = useState('');
  const [chemicalsTypes, setChemicalsTypes] = useState([]);
  const [behandelaar, setBehandelaar] = useState('');

  const [potmaat, setPotmaat] = useState('');
  const [oppotweek, setOppotweek] = useState('');
  const [teelduurWeeks, setTeelduurWeeks] = useState('');

  const [trapNumber, setTrapNumber] = useState('');
  const [bugCount, setBugCount] = useState('');

  const [adminComment, setAdminComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [view, setView] = useState('info');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (reportData) {
      setAdminComment(reportData.admin_comment || '');
    }
  }, [reportData]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setView('info');
    }
  }, [isOpen, cellInfo]);

  useEffect(() => {
    if (!isOpen || !cellInfo || reportData) return;
    setHistoryLoading(true);
    fetch(`http://localhost:5000/api/reports?map_id=${encodeURIComponent(mapName)}&cell_name=${encodeURIComponent(cellInfo.label)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setHistory(data.data);
        else setHistory([]);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [isOpen, cellInfo, mapName, reportData]);

  const latestApproved = history.find(r => r.status === 'approved');
  const statusColors = {
    pending: { bg: '#fff8e1', border: '#ffcc80', color: '#d84315' },
    approved: { bg: '#e8f5e9', border: '#a5d6a7', color: '#2e7d32' },
    rejected: { bg: '#ffebee', border: '#ef9a9a', color: '#c62828' },
  };
  const statusBadge = (status) => {
    const c = statusColors[status] || { bg: '#eee', border: '#ccc', color: '#333' };
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    };
  };

  if (!isOpen || !cellInfo) return null;

  const styles = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '12px',
    },
    modal: {
      background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    },
    header: {
      padding: '16px 20px', borderBottom: '1px solid #eee',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    body: { padding: '16px 20px', overflowY: 'auto', flex: 1 },
    footer: {
      padding: '12px 20px', borderTop: '1px solid #eee',
      display: 'flex', gap: '8px',
    },
    formGroup: { marginBottom: '14px', display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#333' },
    input: {
      padding: '9px', border: '1px solid #ddd', borderRadius: '6px',
      fontSize: '14px', width: '100%', boxSizing: 'border-box',
    },
    checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '6px 12px' },
    checkboxItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' },
    btnPrimary: {
      flex: 1, background: '#2e7d32', color: '#fff', border: 'none',
      padding: '11px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    },
    btnSecondary: {
      flex: 1, background: '#eee', color: '#333', border: 'none',
      padding: '11px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    },
    btnAccept: {
      flex: 1, background: '#2e7d32', color: '#fff', border: 'none',
      padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    },
    btnReject: {
      flex: 1, background: '#d32f2f', color: '#fff', border: 'none',
      padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
    },
  };

  const togglePest = (value) => {
    if (pestType.includes(value)) {
      const updated = pestType.filter(p => p !== value);
      setPestType(updated);
      if (updated.length === 0) setPestSeverity('');
    } else {
      setPestType([...pestType, value]);
    }
  };

  const toggleBiology = (value) => {
    if (biologyTypes.includes(value)) {
      setBiologyTypes(biologyTypes.filter(b => b !== value));
    } else {
      setBiologyTypes([...biologyTypes, value]);
    }
  };

  const toggleChemicals = (value) => {
    if (chemicalsTypes.includes(value)) {
      setChemicalsTypes(chemicalsTypes.filter(c => c !== value));
    } else {
      setChemicalsTypes([...chemicalsTypes, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://localhost:5000/api/floorreports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: Number(fid),
          uid: Number(uid),
          pests_found: !pestType.includes('none') && pestType.length > 0,
          pest_types: pestsFound === 'true' && pestType.length > 0 ? pestType : null,
          pest_severity: pestType.includes('none') || pestSeverity === '' ? null : Number(pestSeverity),
          biology_used: biologyUsed === 'true',
          biology_types: biologyUsed === 'true' && biologyTypes.length > 0 ? biologyTypes : null,
          chemicals_used: chemicalsUsed === 'true',
          chemicals_types: chemicalsUsed === 'true' && chemicalsTypes.length > 0 ? chemicalsTypes : null,
          behandelaar: biologyUsed === 'true' || chemicalsUsed === 'true' ? behandelaar || null : null,
          potmaat: potmaat || null,
          oppotweek: oppotweek === '' ? null : Number(oppotweek),
          teelduur_weeks: teelduurWeeks === '' ? null : Number(teelduurWeeks),
          trap_number: trapNumber || null,
          bug_count: bugCount === '' ? null : Number(bugCount),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccess('Floor report submitted successfully.');
        alert('Report submitted!');
        onClose();
      } else {
        setError(data.message || 'Could not submit Floor report');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportData.report_id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_comment: adminComment }),
      });
      if (response.ok) {
        alert(`Report marked as ${newStatus.toUpperCase()}!`);
        window.location.reload();
      } else {
        alert('Failed to update status. Check backend connection.');
      }
    } catch (err) {
      alert('Network error updating report.');
    }
  };

  // ---- ADMIN APPROVAL VIEW ----
  if (reportData) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h3 style={{ margin: 0, color: '#1976d2' }}>🛡️ Admin Approval View</h3>
          </div>
          <div style={styles.body}>
            <div style={{ background: '#f5f5f5', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Issue Details</h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Location:</strong> {reportData.cell_name}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Severity:</strong> Level {reportData.severity}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Date Reported:</strong> {reportData.entry_date}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Reporter Info</h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Name:</strong> {reportData.reporter_name}</p>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Admin Comment (Optional):</label>
              <textarea
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Leave a comment..."
              />
            </div>
            {reportData.status === 'pending' ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button style={styles.btnAccept} onClick={() => handleUpdateStatus('approved')}>Accept</button>
                <button style={styles.btnReject} onClick={() => handleUpdateStatus('rejected')}>Reject</button>
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '10px',
                background: reportData.status === 'approved' ? '#e8f5e9' : '#ffebee',
                color: reportData.status === 'approved' ? '#2e7d32' : '#c62828',
                borderRadius: '6px', marginBottom: '10px', fontWeight: 'bold',
              }}>
                This report has been {reportData.status.toUpperCase()}.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.btnSecondary}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- INFO VIEW (default for non-admin entry) ----
  if (view === 'info') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h3 style={{ margin: 0 }}>Cell Info</h3>
            <span style={{ fontSize: '12px', color: '#666' }}>{mapName} · {cellInfo.label}</span>
          </div>
          <div style={styles.body}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>Current Status</div>
              {latestApproved ? (
                <div style={{
                  background: statusColors.approved.bg,
                  border: `1px solid ${statusColors.approved.border}`,
                  borderRadius: '8px', padding: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={statusBadge('approved')}>Approved</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{latestApproved.entry_date}</span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Severity:</strong> {latestApproved.severity != null ? `Level ${latestApproved.severity}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Reporter:</strong> {latestApproved.reporter_name}
                  </div>
                  {Array.isArray(latestApproved.pest_types) && latestApproved.pest_types.length > 0 && (
                    <div style={{ fontSize: '13px' }}>
                      <strong>Pests:</strong> {latestApproved.pest_types.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f5f5f5', border: '1px solid #ddd',
                  borderRadius: '8px', padding: '12px', color: '#666', fontSize: '13px',
                }}>
                  No approved status yet for this cell.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>
                History {history.length > 0 && `(${history.length})`}
              </div>
              {historyLoading ? (
                <div style={{ fontSize: '13px', color: '#999' }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{
                  background: '#f5f5f5', border: '1px solid #ddd',
                  borderRadius: '8px', padding: '12px', color: '#666', fontSize: '13px',
                }}>
                  No reports for this cell yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map(r => (
                    <div key={r.report_id} style={{
                      background: '#fff', border: '1px solid #e0e0e0',
                      borderRadius: '8px', padding: '10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={statusBadge(r.status)}>{r.status}</span>
                        <span style={{ fontSize: '11px', color: '#888' }}>{r.entry_date}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        <strong>{r.reporter_name}</strong>
                        {r.severity != null && ` · Sev ${r.severity}`}
                      </div>
                      {Array.isArray(r.pest_types) && r.pest_types.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {r.pest_types.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={styles.footer}>
            <button style={styles.btnSecondary} onClick={onClose}>Close</button>
            <button style={styles.btnPrimary} onClick={() => setView('form')}>Create Report</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- SCOUT REPORT FORM (FULL VERSION) ----
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Create Floor Report</h3>
          <span style={{ fontSize: '12px', color: '#666' }}>{mapName} · {cellInfo.label}</span>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div style={styles.body}>
            {error && <p style={{ color: 'red', fontWeight: 'bold', margin: '0 0 10px 0' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontWeight: 'bold', margin: '0 0 10px 0' }}>{success}</p>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Floor ID</label>
              <input style={styles.input} type="number" value={fid} onChange={(e) => setFid(e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>User ID</label>
              <input style={styles.input} type="number" value={uid} onChange={(e) => setUid(e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Pests Found</label>
              <select
                style={styles.input}
                value={pestsFound}
                onChange={(e) => {
                  const v = e.target.value;
                  setPestsFound(v);
                  if (v === 'false') { setPestType([]); setPestSeverity(''); }
                }}
                required
              >
                <option value="">Select option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {pestsFound === 'true' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Found Pests</label>
                  <div style={styles.checkboxGroup}>
                    {pestOptions.map(p => (
                      <label key={p.value} style={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={pestType.includes(p.value)}
                          onChange={() => togglePest(p.value)}
                        />
                        <span>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Pest Severity (1-5)</label>
                  <select
                    style={styles.input}
                    value={pestSeverity}
                    onChange={(e) => setPestSeverity(e.target.value)}
                    required={pestType.length > 0}
                  >
                    <option value="">Select score</option>
                    <option value="1">1 (low)</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5 (high)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Biology Used</label>
                  <select
                    style={styles.input}
                    value={biologyUsed}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBiologyUsed(v);
                      if (v === 'false') {
                        setBiologyTypes([]);
                        if (chemicalsUsed !== 'true') setBehandelaar('');
                      }
                    }}
                    required
                  >
                    <option value="">Select option</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {biologyUsed === 'true' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Biology Type</label>
                    <div style={styles.checkboxGroup}>
                      {biologyOptions.map(b => (
                        <label key={b.value} style={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={biologyTypes.includes(b.value)}
                            onChange={() => toggleBiology(b.value)}
                          />
                          <span>{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Chemicals Used</label>
                  <select
                    style={styles.input}
                    value={chemicalsUsed}
                    onChange={(e) => {
                      const v = e.target.value;
                      setChemicalsUsed(v);
                      if (v === 'false') {
                        setChemicalsTypes([]);
                        if (biologyUsed !== 'true') setBehandelaar('');
                      }
                    }}
                    required
                  >
                    <option value="">Select option</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {chemicalsUsed === 'true' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Chemicals Type</label>
                    <div style={styles.checkboxGroup}>
                      {chemicalsOptions.map(c => (
                        <label key={c.value} style={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={chemicalsTypes.includes(c.value)}
                            onChange={() => toggleChemicals(c.value)}
                          />
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(biologyUsed === 'true' || chemicalsUsed === 'true') && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Behandelaar</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={behandelaar}
                      onChange={(e) => setBehandelaar(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Potmaat</label>
              <input style={styles.input} type="text" value={potmaat} onChange={(e) => setPotmaat(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Oppotweek</label>
              <input style={styles.input} type="number" value={oppotweek} onChange={(e) => setOppotweek(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Teelduur (weeks)</label>
              <input style={styles.input} type="number" value={teelduurWeeks} onChange={(e) => setTeelduurWeeks(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Trap Number</label>
              <input style={styles.input} type="date" value={trapNumber} onChange={(e) => setTrapNumber(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bug Count</label>
              <input style={styles.input} type="number" value={bugCount} onChange={(e) => setBugCount(e.target.value)} />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.btnSecondary} onClick={() => setView('info')}>Back</button>
            <button type="submit" style={styles.btnPrimary}>Submit Report</button>
          </div>
        </form>
      </div>
    </div>
  );
}
