import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./ScoutOverview.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';

const ScoutOverview = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [scoutData, setScoutData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get('/api/admin/scouts-reports-summary');
                setScoutData(res.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    // Controls the color of the status of the report
    const getStatusClass = (status) => {
        if (status === 'pending') return 'scout-overview-status-pending';
        if (status === 'approved') return 'scout-overview-status-approved';
        if (status === 'rejected') return 'scout-overview-status-rejected';
        return '';
    };

    return (
        <AdminLayout title={t("ScoutOverview.PageTitle")}>
            <div className="scout-overview-page-wrapper">
                <div className="scout-overview-map-assignment-card">
                    <div>
                        <h3 className="scout-overview-map-assignment-title">{t("ScoutOverview.AssignMapsTitle")}</h3>
                        <p className="scout-overview-map-assignment-text">
                            {t("ScoutOverview.AssignMapsDescription")}
                        </p>
                    </div>
                    <button
                        className="scout-overview-map-assignment-btn"
                        onClick={() => navigate('/scout_maps_assign')}
                    >
                        {t("ScoutOverview.AssignMapsButton")}
                    </button>
                </div>

                {loading ? (
                    <p className="scout-overview-loading">{t("ScoutOverview.Loading")}</p>
                ) : (
                    <div className="scout-overview-cards-list">
                        {scoutData.map((scout) => (
                            <div key={scout.uid} className="scout-overview-card-item">
                                <h2 className="scout-overview-user-name">{scout.username}</h2>

                                <div className="scout-overview-table-container">
                                    {/* Checks for scouts reports */}
                                    {scout.recent_reports && scout.recent_reports.length > 0 ? (
                                        scout.recent_reports.map((report) => (
                                            <div key={report.rid} className="scout-overview-data-row">
                                                <span className="scout-overview-loc-text">
                                                    {report.map_name} {report.section_name}
                                                </span>
                                                <span className="scout-overview-date-text">
                                                    {report.formatted_date}
                                                </span>
                                                <span className={`scout-overview-status-text ${getStatusClass(report.status)}`}>
                                                    {report.status === 'pending'
                                                        ? t("ScoutOverview.AwaitingApproval")
                                                        : t(`ScoutOverview.Status${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="scout-overview-empty-text">{t("ScoutOverview.NoReports")}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ScoutOverview;
