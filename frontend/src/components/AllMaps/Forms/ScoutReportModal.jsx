import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { formatPestNames } from "../../../constants/pestNames";

export default function ScoutReportModal({ isOpen, onClose, onReportApproved, cellInfo, reportData, mapName }) {
  const [fid, setFid] = useState('');

  const [pestsFound, setPestsFound] = useState('');
  const [pestType, setPestType] = useState([]);
  const [pestSeverity, setPestSeverity] = useState('');
  const [plantName, setPlantName] = useState('');
  const [supplier, setSupplier] = useState('');

  const [biologyUsed, setBiologyUsed] = useState('');
  const [biologyTypes, setBiologyTypes] = useState([]);
  const [biologyOther, setBiologyOther] = useState('');
  const [chemicalsUsed, setChemicalsUsed] = useState('');
  const [chemicalsTypes, setChemicalsTypes] = useState('');
  const [behandelaar, setBehandelaar] = useState('');

  const [potmaat, setPotmaat] = useState('');
  const [oppotweek, setOppotweek] = useState('');
  const [teelduurWeeks, setTeelduurWeeks] = useState('');

  const [trapNumber, setTrapNumber] = useState('');
  const [bugCount, setBugCount] = useState('');

  const [adminComment, setAdminComment] = useState('');
  const [adminBanner, setAdminBanner] = useState(null);
  const [localReportStatus, setLocalReportStatus] = useState(reportData?.status || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmittedPopup, setShowSubmittedPopup] = useState(false);

  const [view, setView] = useState('info');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { t, i18n } = useTranslation(); //i18n for local language
  const { user } = useAuth();
  const cellLabel = cellInfo?.label || cellInfo?.cell_name || '';
  const cellBlockKey = cellInfo?.block_key || '';

  const pestOptions = [
    { value: 'red_spider_mite', label: t("ScoutReportModal.RedSpiderMite") },
    { value: 'thrips', label: t("ScoutReportModal.Thrips") },
    { value: 'green_louse', label: t("ScoutReportModal.GreenLouse") },
    { value: 'black_louse', label: t("ScoutReportModal.BlackLouse") },
    { value: 'mealybug', label: t("ScoutReportModal.Mealybug") },
    { value: 'pythium', label: t("ScoutReportModal.Pythium") },
    { value: 'mite', label: t("ScoutReportModal.Mite") },
    { value: 'cycada', label: t("ScoutReportModal.Cycada") },
    { value: 'weed', label: t("ScoutReportModal.Weed") },
    { value: 'caterpillar', label: t("ScoutReportModal.Caterpillar") },
  ];

  const biologyOptions = [
    { value: 'bio1', label: t("ScoutReportModal.Bio1") },
    { value: 'bio2', label: t("ScoutReportModal.Bio2") },
    { value: 'bio3', label: t("ScoutReportModal.Bio3") },
    { value: 'bio4', label: t("ScoutReportModal.Bio4") },
    { value: 'bio5', label: t("ScoutReportModal.Bio5") },
    { value: 'bio6', label: t("ScoutReportModal.Bio6") },
    { value: 'bio7', label: t("ScoutReportModal.Bio7") },
    { value: 'bio8', label: t("ScoutReportModal.Bio8") },
    { value: 'bio9', label: t("ScoutReportModal.Bio9") },
    { value: 'bio10', label: t("ScoutReportModal.Bio10") },
    { value: 'bio11', label: t("ScoutReportModal.Bio11") },
    { value: 'bio12', label: t("ScoutReportModal.Bio12") },
    { value: 'bio13', label: t("ScoutReportModal.Bio13") },
  ];

  useEffect(() => {
    if (reportData) {
      setAdminComment(reportData.admin_comment || '');
      setLocalReportStatus(reportData.status || '');
      setAdminBanner(null);
    }
  }, [reportData]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setAdminBanner(null);
      setShowSubmittedPopup(false);
      setView('info');
      if (!reportData) {
        setPlantName('');
        setSupplier('');
        setBiologyTypes([]);
        setBiologyOther('');
        setChemicalsTypes('');
      }
    }
  }, [isOpen, cellInfo, reportData]);

  // Try to resolve fID from cell info when modal opens, but allow manual override if it fails or if reportData
  // is provided (admin view).
  useEffect(() => {
    if (!isOpen || !cellInfo || reportData) return;

    const params = new URLSearchParams({
      map_name: mapName,
      cell_name: cellLabel,
    });
    if (cellBlockKey) params.set('block_key', cellBlockKey);

    fetch(`http://localhost:5000/api/floors/resolve?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status !== 'success' || data.fid == null) {
          throw new Error(`FloorID resolve failed for ${mapName} / ${cellLabel}`);
        }
        setFid(String(data.fid));
      })
      .catch((err) => {
        setError(err.message); // strict: show error, no fallback typing
      });
  }, [isOpen, cellInfo, cellLabel, cellBlockKey, mapName, reportData]);

  useEffect(() => {
    if (!isOpen || !cellInfo || reportData) return;
    setHistoryLoading(true);
    const params = new URLSearchParams({
      map_id: mapName,
      cell_name: cellLabel,
    });
    if (cellBlockKey) params.set('block_key', cellBlockKey);

    fetch(`http://localhost:5000/api/reports?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setHistory(data.data);
        else setHistory([]);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [isOpen, cellInfo, cellLabel, cellBlockKey, mapName, reportData]);

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
    infoHeader: {
      padding: '0px 0px 25px', borderBottom: '1px solid #eee',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      textAlign: 'center',
    },
    adminHeader: {
      padding: '20px 0px 15px', borderBottom: '1px solid #eee',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      textAlign: 'center',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Do not accept reports without FloorID
    if (!fid) {
      setError("FloorID could not be loaded");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/floorreports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: Number(fid),
          uid: Number(user?.uid),
          plant_name: plantName.trim(),
          supplier: supplier.trim(),
          pests_found: !pestType.includes('none') && pestType.length > 0,
          pest_types: pestsFound === 'true' && pestType.length > 0 ? pestType : null,
          pest_severity: pestType.includes('none') || pestSeverity === '' ? null : Number(pestSeverity),
          biology_used: biologyUsed === 'true',
          biology_types: biologyUsed === 'true' && (biologyTypes.length > 0 || biologyOther !== '')
            ? [...biologyTypes.filter(b => b !== 'other'),
               ...(biologyTypes.includes('other') && biologyOther !== '' ? [biologyOther] : []),] : null,
          chemicals_used: chemicalsUsed === 'true',
          chemicals_types: chemicalsUsed === 'true' ? chemicalsTypes : null,
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
        setSuccess('');
        setShowSubmittedPopup(true);
      } else {
        setError(data.message || t("ScoutReportModal.CouldNotSubmitFloorReport"));
      }
    } catch (err) {
      setError(t("ScoutReportModal.NetworkError") + ': ' + err.message);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setAdminBanner(null);

    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportData.report_id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_comment: adminComment }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || t("ScoutReportModal.FailedToUpdateStatus"));
      }

      setLocalReportStatus(newStatus);
      setAdminBanner({
        type: newStatus === 'approved' ? 'success' : 'danger',
        message: newStatus === 'approved'
          ? t("ScoutReportModal.ReportApprovedSuccessfully")
          : t("ScoutReportModal.ReportDeclinedSuccessfully"),
      });
      
      if (onReportApproved && (newStatus === 'approved' || newStatus === 'rejected')) {
        setTimeout(() => {
          onReportApproved();
        }, 1000);
      }
    } catch (err) {
      setAdminBanner({
        type: 'danger',
        message: err.message || t("ScoutReportModal.NetworkErrorUpdatingReport"),
      });
    }
  };

  if (showSubmittedPopup) {
    return (
      <div style={styles.overlay}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '28px 30px 24px',
          minWidth: '280px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#222', lineHeight: 1.2 }}>
            {t("ScoutReportModal.ReportSubmitted")}
          </div>
          <button
            type="button"
            style={{ ...styles.btnPrimary, width: '100%' }}
            onClick={() => {
              setShowSubmittedPopup(false);
              onClose();
            }}
          >
            {t("ScoutReportModal.Continue")}
          </button>
        </div>
      </div>
    );
  }

  const currentReportStatus = localReportStatus || reportData?.status;
  const getAdminStatusLabel = (status) => {
    if (status === 'approved') return t("ScoutReportModal.Approved");
    if (status === 'rejected') return t("ScoutReportModal.Declined");
    return status;
  };

  // ---- ADMIN APPROVAL VIEW ----
  if (reportData) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.adminHeader}>
            <h3 style={{ margin: 0, color: '#1976d2' }}>{t("ScoutReportModal.AdminApproval")}</h3>
          </div>
          <div style={styles.body}>
            {adminBanner && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontWeight: 700,
                fontSize: '14px',
                background: adminBanner.type === 'success' ? '#e8f5e9' : '#ffebee',
                color: adminBanner.type === 'success' ? '#2e7d32' : '#c62828',
                border: `1px solid ${adminBanner.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
              }}>
                {adminBanner.message}
              </div>
            )}

            <div style={{ background: '#f5f5f5', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{t("ScoutReportModal.IssueDetails")}</h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.Location")}:</strong> {reportData.cell_name}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.Plant")}:</strong> {reportData.plant_name}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.Supplier")}:</strong> {reportData.supplier}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.Severity")}:</strong> {t("ScoutReportModal.Level")} {reportData.severity}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.DateReported")}:</strong> {reportData.entry_date}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{t("ScoutReportModal.ReporterInfo")}</h4>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{t("ScoutReportModal.Name")}:</strong> {reportData.reporter_name}</p>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.AdminCommentOptional")}:</label>
              <textarea
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder={t("ScoutReportModal.LeaveAComment")}
              />
            </div>
            {currentReportStatus === 'pending' ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button style={styles.btnAccept} onClick={() => handleUpdateStatus('approved')}>{t("ScoutReportModal.Accept")}</button>
                <button style={styles.btnReject} onClick={() => handleUpdateStatus('rejected')}>{t("ScoutReportModal.Reject")}</button>
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '10px',
                background: currentReportStatus === 'approved' ? '#e8f5e9' : '#ffebee',
                color: currentReportStatus === 'approved' ? '#2e7d32' : '#c62828',
                borderRadius: '6px', marginBottom: '10px', fontWeight: 'bold',
              }}>
                {t("ScoutReportModal.ThisReportHasBeen")} {getAdminStatusLabel(currentReportStatus)}.
              </div>
            )}
          </div>
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.btnSecondary}>{t("ScoutReportModal.Close")}</button>
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
          <div style={styles.infoHeader}>
            <h3 style={{ margin: 0 }}>{t("ScoutReportModal.CellInfo")}</h3>
            <span style={{ fontSize: '18px', color: '#333', fontWeight: 700, lineHeight: 1.2, width: '100%', textAlign: 'center' }}>{mapName} · {cellLabel}</span>
          </div>
          <div style={styles.body}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>{t("ScoutReportModal.CurrentStatus")}</div>
              {latestApproved ? (
                <div style={{
                  background: statusColors.approved.bg,
                  border: `1px solid ${statusColors.approved.border}`,
                  borderRadius: '8px', padding: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={statusBadge('approved')}>{t("ScoutReportModal.Approved")}</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{latestApproved.entry_date}</span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>{t("ScoutReportModal.Severity")}:</strong> {latestApproved.severity != null ? `${t("ScoutReportModal.Level")} ${latestApproved.severity}` : t("ScoutReportModal.NotAvailable")}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>{t("ScoutReportModal.Reporter")}:</strong> {latestApproved.reporter_name}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>{t("ScoutReportModal.Plant")}:</strong> {latestApproved.plant_name}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>{t("ScoutReportModal.Supplier")}:</strong> {latestApproved.supplier}
                  </div>
                  {Array.isArray(latestApproved.pest_types) && latestApproved.pest_types.length > 0 && (
                    <div style={{ fontSize: '13px' }}>
                      <strong>{t("ScoutReportModal.Pests")}:</strong> {formatPestNames(latestApproved.pest_types).join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f5f5f5', border: '1px solid #ddd',
                  borderRadius: '8px', padding: '12px', color: '#666', fontSize: '13px',
                }}>
                  {t("ScoutReportModal.NoApprovedStatusYet")}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>
                {t("ScoutReportModal.History")} {history.length > 0 && `(${history.length})`}
              </div>
              {historyLoading ? (
                <div style={{ fontSize: '13px', color: '#999' }}>{t("ScoutReportModal.Loading")}</div>
              ) : history.length === 0 ? (
                <div style={{
                  background: '#f5f5f5', border: '1px solid #ddd',
                  borderRadius: '8px', padding: '12px', color: '#666', fontSize: '13px',
                }}>
                  {t("ScoutReportModal.NoReportsForThisCellYet")}
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
                        {r.severity != null && ` · ${t("ScoutReportModal.Sev")} ${r.severity}`}
                      </div>
                      {Array.isArray(r.pest_types) && r.pest_types.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {formatPestNames(r.pest_types).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={styles.footer}>
            <button style={styles.btnSecondary} onClick={onClose}>{t("ScoutReportModal.Close")}</button>
            <button style={styles.btnPrimary} onClick={() => setView('form')}>{t("ScoutReportModal.CreateReport")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- SCOUT REPORT FORM (FULL VERSION) ----
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.infoHeader}>
          <h3 style={{ margin: 0 }}>{t("ScoutReportModal.CreateFloorReport")}</h3>
            <span style={{ fontSize: '18px', color: '#333', fontWeight: 700, lineHeight: 1.2 }}>{mapName} · {cellLabel}</span>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div style={styles.body}>
            {error && <p style={{ color: 'red', fontWeight: 'bold', margin: '0 0 10px 0' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontWeight: 'bold', margin: '0 0 10px 0' }}>{success}</p>}

            {/*Name of scout (based on UID)*/}
            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.ScoutName")}</label>
              <input
                style={{...styles.input, backgroundColor: '#f0f0f0', cursor: 'not-allowed'}}
                type="text"
                value={user?.username || ''}
                disabled
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.Plant")}</label>
              <input
                style={styles.input}
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.Supplier")}</label>
              <input
                style={styles.input}
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.PestsFound")}</label>
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
                <option value="">{t("ScoutReportModal.SelectOption")}</option>
                <option value="true">{t("ScoutReportModal.Yes")}</option>
                <option value="false">{t("ScoutReportModal.No")}</option>
              </select>
            </div>

            {pestsFound === 'true' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t("ScoutReportModal.FoundPests")}</label>
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
                  <label style={styles.label}>{t("ScoutReportModal.PestSeverity")}</label>
                  <select
                    style={styles.input}
                    value={pestSeverity}
                    onChange={(e) => setPestSeverity(e.target.value)}
                    required={pestType.length > 0}
                  >
                    <option value="">{t("ScoutReportModal.SelectScore")}</option>
                    <option value="1">1 ({t("ScoutReportModal.Low")})</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5 ({t("ScoutReportModal.High")})</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>{t("ScoutReportModal.BiologyUsed")}</label>
                  <select
                    style={styles.input}
                    value={biologyUsed}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBiologyUsed(v);
                      if (v === 'false') {
                      setBiologyTypes([]);
                        setBiologyOther('');
                        if (chemicalsUsed !== 'true') setBehandelaar('');
                      }
                    }}
                    required
                  >
                    <option value="">{t("ScoutReportModal.SelectOption")}</option>
                    <option value="true">{t("ScoutReportModal.Yes")}</option>
                    <option value="false">{t("ScoutReportModal.No")}</option>
                  </select>
                </div>

                {biologyUsed === 'true' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>{t("ScoutReportModal.BiologyType")}</label>
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
                      <label style={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={biologyTypes.includes('other')}
                          onChange={() => {
                            if (biologyTypes.includes('other')) {
                              setBiologyTypes(biologyTypes.filter(b => b !== 'other'));
                              setBiologyOther('');
                            } else {
                              setBiologyTypes([...biologyTypes, 'other']);
                            }
                          }}
                        />
                        <span>{t("ScoutReportModal.Other")}</span>
                      </label>
                    </div>
                    {biologyTypes.includes('other') && (
                      <input
                        style={{ ...styles.input, marginTop: '8px' }}
                        type="text"
                        value={biologyOther}
                        onChange={(e) => setBiologyOther(e.target.value)}
                        placeholder={t("ScoutReportModal.Other")}
                      />
                    )}
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>{t("ScoutReportModal.ChemicalsUsed")}</label>
                  <select
                    style={styles.input}
                    value={chemicalsUsed}
                    onChange={(e) => {
                      const v = e.target.value;
                      setChemicalsUsed(v);
                      if (v === 'false') {
                        setChemicalsTypes('');
                        if (biologyUsed !== 'true') setBehandelaar('');
                      }
                    }}
                    required
                  >
                    <option value="">{t("ScoutReportModal.SelectOption")}</option>
                    <option value="true">{t("ScoutReportModal.Yes")}</option>
                    <option value="false">{t("ScoutReportModal.No")}</option>
                  </select>
                </div>

                {chemicalsUsed === 'true' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>{t("ScoutReportModal.ChemicalsType")}</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={chemicalsTypes}
                      onChange={(e) => setChemicalsTypes(e.target.value)}
                    />
                  </div>
                )}

                {(biologyUsed === 'true' || chemicalsUsed === 'true') && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>{t("ScoutReportModal.Behandelaar")}</label>
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
              <label style={styles.label}>{t("ScoutReportModal.Potmaat")}</label>
              <input style={styles.input} type="text" value={potmaat} onChange={(e) => setPotmaat(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.Oppotweek")}</label>
              <input style={styles.input} type="number" value={oppotweek} onChange={(e) => setOppotweek(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.TeelduurWeeks")}</label>
              <input style={styles.input} type="number" value={teelduurWeeks} onChange={(e) => setTeelduurWeeks(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.TrapNumber")}</label>
              <input style={styles.input} type="date" value={trapNumber} onChange={(e) => setTrapNumber(e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t("ScoutReportModal.BugCount")}</label>
              <input style={styles.input} type="number" value={bugCount} onChange={(e) => setBugCount(e.target.value)} />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.btnSecondary} onClick={() => setView('info')}>{t("ScoutReportModal.Back")}</button>
            <button type="submit" style={styles.btnPrimary} disabled={!fid}>{t("ScoutReportModal.SubmitReport")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

