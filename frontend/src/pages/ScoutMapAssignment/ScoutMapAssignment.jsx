import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import "./ScoutMapAssignment.css";
import { useTranslation } from "react-i18next";

const ScoutMapAssignment = () => {
    const { t } = useTranslation();
    const [scoutOverview, setScoutOverview] = useState([]);  // Stores a list of all scouts
    const [allMaps, setAllMaps] = useState([]);  // Stores a list of all maps
    const [editingScout, setEditingScout] = useState(null); // The scout currently being edited, if it's null then the list of scouts is visible
    const [tempMapIds, setTempMapIds] = useState([]); // Temporary selection state, tracks map choice before hitting save
    const [loading, setLoading] = useState(false);  // Boolean to disable save button while database is loading

    useEffect(() => {
        fetchOverview();
        fetchAllMaps();
    }, []);

    // Getting the scouts overview from the database
    const fetchOverview = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/scouts-maps-overview');
            setScoutOverview(res.data);
        } catch (err) { console.error(err); }
    };

    // Getting the maps overview from the database
    const fetchAllMaps = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/maps');
            setAllMaps(res.data);
        } catch (err) { console.error(err); }
    };

    // Assigning maps to one scout (triggered on "Assign Maps")
    const startEditing = (scout) => {
        setEditingScout(scout);  // Sets the editing scout
        setTempMapIds(scout.assigned_maps.map(m => m.mid));  // Pre-fills already assigned maps so these checkboxes are on
    };

    // Allowing multiple maps selection
    const toggleMapSelection = (mid) => {
        // If a map is already selected, it gets removed from the list
        // If a new map gets selected, it adds it to the list
        setTempMapIds(prev =>
            prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]
        );
    };

    // Managing saving maps assignment in the database
    const handleSave = async () => {
        setLoading(true);  // Disables the save button while loading
        // Sending scout + assigned maps data to the backend
        try {
            await axios.post('http://localhost:5000/api/admin/assign-maps', {
                scoutUid: editingScout.uid,
                mapIds: tempMapIds
            });
            setEditingScout(null);  // Goes back to the scout list overview
            fetchOverview(); // Refreshes the list with new data
        } catch (err) {
            alert("Error saving maps");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title={t("Map Assignment")}>
            <div className="map-assign-container">

                {/* Scout overview list, when NOT editing a scout */}
                {!editingScout ? (
                    <section className="overview-section">
                        <div className="scouts-maps-assignment-list">
                            {scoutOverview.map(scout => (
                                <div key={scout.uid} className="overview-card">
                                    <div className="scout-info">
                                        <h3>{scout.username}</h3>
                                        <div className="tags-container">
                                            {/* Displays maps assigned to the scout */}
                                            {scout.assigned_maps.length > 0 ? (
                                                scout.assigned_maps.map(m => (
                                                    <span key={m.mid} className="map-tag">{m.name}</span>
                                                ))
                                            ) : (
                                                <span className="no-maps">{t("No maps assigned")}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="assign-pill-btn" onClick={() => startEditing(scout)}>
                                        {t("Assign Maps")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    /* Maps assignment for one scout editing view */
                    <section className="map-assign-to-one-scout-section">
                        <div className="edit-header">
                            <button className="back-link" onClick={() => setEditingScout(null)}>← {t("Back to Overview")}</button>
                            <h2>{t("Editing Maps for")}: {editingScout.username}</h2>
                        </div>

                        <div className="maps-grid">
                            {allMaps.map(map => (
                                <div
                                    key={map.mid}
                                    className={`map-card-v2 ${tempMapIds.includes(map.mid) ? 'is-active' : ''}`}
                                    onClick={() => toggleMapSelection(map.mid)}
                                >
                                    <div className="map-card-content">
                                        <div className="map-icon-circle">
                                            <span className="map-number">{map.name}</span>
                                        </div>
                                        <div className="map-details">
                                            <span className="map-title">{t("Map")} {map.name}</span>
                                            <span className="map-subtitle">{map.location}</span>
                                        </div>
                                    </div>
                                    <div className="map-selection-indicator">
                                        {tempMapIds.includes(map.mid) && <span className="check-icon">✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="map-assign-actions">
                            <button className="green-pill-btn big" onClick={handleSave} disabled={loading}>
                                {loading ? t("Saving...") : t("Save Changes")}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
};

export default ScoutMapAssignment;