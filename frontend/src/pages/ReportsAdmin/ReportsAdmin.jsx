import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next"
import { MAP_ORDER } from '../../constants/mapOrder'
import axios from 'axios'
import './ReportsAdmin.css'

const ReportsAdmin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [allUsers, setAllUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(null) // hidden by default

  const [roofReports, setRoofReports] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('All') // Filter state for roof reports list
  const [newLocation, setNewLocation] = useState(MAP_ORDER[0] || '')
  const [activity, setActivity] = useState('Painting') // Isolated activity state
  const [status, setStatus] = useState('ToBeDone') // Isolated status state
  const [newDate, setNewDate] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const [climateReports, setClimateReports] = useState([])
  const [selectedClimateFilter, setSelectedClimateFilter] = useState('All') // Filter state for climate reports list
  const [newNursery, setNewNursery] = useState(MAP_ORDER[0] || '')
  const [newComputerNum, setNewComputerNum] = useState('')
  const [newAfdeling, setNewAfdeling] = useState('')
  const [newInsideTemp, setNewInsideTemp] = useState('')
  const [newOutsideTemp, setNewOutsideTemp] = useState('')
  const [newHumidity, setNewHumidity] = useState('')
  const [newLight, setNewLight] = useState('')

  // Fetch users on mount
  useEffect(() => {
    axios.get('/api/users')
      .then(res => {
        const scoutsOnly = res.data.filter(user => user.role === 'scout')
        setAllUsers(scoutsOnly)
      })
      .catch(err => console.error(err))
  }, [])

  // Fetch roof reports dynamically based on selection filter
  useEffect(() => {
    axios.get(`/api/reports/roof?location=${selectedFilter}`)
      .then(res => {
        setRoofReports(res.data)
      })
      .catch(err => console.error(err))
  }, [selectedFilter])

  // Fetch climate reports dynamically based on selection filter
  useEffect(() => {
    axios.get(`/api/reports/climate?location=${selectedClimateFilter}`)
      .then(res => {
        setClimateReports(res.data)
      })
      .catch(err => console.error(err))
  }, [selectedClimateFilter])

  // Sanitize the input to prevent injections and remove harmful characters
  const sanitizeInput = (text) => {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[$\\/|`~]/g, '')
      .trim()
  }

  // Format new roof report submission
  const handleSubmitReport = (e) => {
    e.preventDefault()

    const cleanDescription = sanitizeInput(newDescription)
    const cleanDate = sanitizeInput(newDate)

    const newReport = {
      location: newLocation,
      activity: activity,
      status: status,
      description: cleanDescription, // Optional field description
      date: cleanDate || new Date().toISOString().split('T')[0]
    }

    axios.post('/api/reports/roof', newReport)
      .then(() => {
        setNewDescription('')
        setNewDate('')

        // Dynamic re-fetch or switch fallback to let the new entry show immediately
        if (selectedFilter === 'All' || selectedFilter === newLocation) {
          axios.get(`/api/reports/roof?location=${selectedFilter}`)
            .then(res => setRoofReports(res.data))
        } else {
          setSelectedFilter('All')
        }
      })
      .catch(err => console.error(err))
  }

  // Format new climate report submission
  const handleSubmitClimateReport = (e) => {
    e.preventDefault()

    const cleanComputerNum = sanitizeInput(newComputerNum)
    const cleanAfdeling = sanitizeInput(newAfdeling)

    if (!cleanComputerNum || !cleanAfdeling) {
      alert(t("ReportsAdmin.InvalidClimateInputs"))
      return
    }

    const inside = parseFloat(newInsideTemp)
    const outside = parseFloat(newOutsideTemp)
    const humid = parseFloat(newHumidity)
    const lightVal = parseFloat(newLight)

    // Validate numeric inputs
    if (inside < -20 || inside > 60 || outside < -20 || outside > 60) {
      alert(t("ReportsAdmin.InvalidTemperature"))
      return
    }

    if (humid < 0 || humid > 100) {
      alert(t("ReportsAdmin.InvalidHumidity"))
      return
    }

    if (lightVal < 0 || lightVal > 100000) {
      alert(t("ReportsAdmin.InvalidLight"))
      return
    }

    const newReport = {
      nursery: newNursery,
      hoogendoornnummer: cleanComputerNum,
      afdeling: cleanAfdeling,
      inside_temperature: inside,
      outside_temperature: outside,
      humidity: humid,
      light: lightVal
    }

    axios.post('/api/reports/climate', newReport)
      .then(() => {
        setNewComputerNum('')
        setNewAfdeling('')
        setNewInsideTemp('')
        setNewOutsideTemp('')
        setNewHumidity('')
        setNewLight('')

        // Dynamic re-fetch strategy for climate reporting context view tracking
        if (selectedClimateFilter === 'All' || selectedClimateFilter === newNursery) {
          axios.get(`/api/reports/climate?location=${selectedClimateFilter}`)
            .then(res => setClimateReports(res.data))
        } else {
          setSelectedClimateFilter('All')
        }
      })
      .catch(err => console.error(err))
  }

  // Change employee status (fire or rehire)
  const handleFireEmployee = (userId, currentStatus) => {
    const nextStatus = !currentStatus;

    axios.post(`/api/users/${userId}/employment`, { is_employed: nextStatus })
      .then(() => {
        // Update local state dynamically
        setAllUsers(allUsers.map(user =>
          user.uid === userId ? { ...user, is_employed: nextStatus } : user
        ))
      })
      .catch(err => console.error(err));
  };

  // Helper mapping helper to assist dynamic fallback rendering
  const getLabel = (key, fallback) => t(`ReportsAdmin.${key}`) || fallback;

  const filteredWorkers = allUsers.filter(worker => {
    // If the list is hidden, don't show any workers
    if (!activeTab) return false;
    const matchesSearch = worker.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'active' ? worker.is_employed : !worker.is_employed;
    return matchesSearch && matchesTab;
  });

  return (
    <AdminLayout title={t("ReportsAdmin.Title")}>
      <div className="reports-admin-vireo-container">
        {/* Admin dashboard button */}
        <div className="reports-admin-dashboard-card">
          <div>
            <h3 className="reports-admin-dashboard-title">{t("ReportsAdmin.ViewSubmittedScoutReports")}</h3>
            <p className="reports-admin-dashboard-text">
              {t("ReportsAdmin.ViewSubmittedScoutReportsDescription")}
            </p>
          </div>
          <button
            className="reports-admin-dashboard-btn"
            onClick={() => navigate('/maps/admin_dashboard')}
          >
            {t("Mapview.AdminDashboard")}
          </button>
        </div>

        {/* Employment Management System */}
        <div className="reports-admin-vireo-section reports-admin-vireo-fullwidth">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">{t("ReportsAdmin.EmploymentManagement")}</h3>

            {/* Search Bar */}
            <div className="reports-admin-vireo-input-group" style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder={t("ReportsAdmin.SearchByUsername") || "Search by username..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="reports-admin-vireo-input"
              />
            </div>

            {/* Tab Toggles */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                type="button"
                className={`reports-admin-dashboard-btn ${activeTab === 'active' ? 'active-tab' : ''}`}
                style={{ padding: '6px 12px', background: activeTab === 'active' ? '#4CAF50' : '#ccc', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => setActiveTab('active')}
              >
                {t("ReportsAdmin.ActiveEmployees") || "Active Employees"}
              </button>
              <button
                type="button"
                className={`reports-admin-dashboard-btn ${activeTab === 'fired' ? 'active-tab' : ''}`}
                style={{ padding: '6px 12px', background: activeTab === 'fired' ? '#f44336' : '#ccc', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => setActiveTab('fired')}
              >
                {t("ReportsAdmin.FiredEmployees") || "Fired/Inactive"}
              </button>
              <button
                type="button"
                className={`reports-admin-dashboard-btn ${activeTab === null ? 'active-tab' : ''}`}
                style={{ padding: '6px 12px', background: activeTab === null ? '#777' : '#ccc', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => setActiveTab(null)}
              >
                {t("ReportsAdmin.HideEmployees") || "Hide"}
              </button>
            </div>

            {/* Worker List Display - Only renders if a tab is actively selected */}
            {activeTab && (
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                {filteredWorkers.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center' }}>{t("ReportsAdmin.NoWorkersFound") || "No workers found."}</p>
                ) : (
                  filteredWorkers.map(worker => (
                    <div key={worker.uid} className="reports-admin-vireo-employment-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <span className="reports-admin-vireo-employment-text">
                        <strong>{worker.username}</strong> ({worker.email || t("ReportsAdmin.NoEmail") || "No email"})
                      </span>
                      <button
                        type="button"
                        className="reports-admin-vireo-submit-btn"
                        style={{ marginTop: 0, padding: '4px 10px', background: worker.is_employed ? '#f44336' : '#4CAF50' }}
                        onClick={() => handleFireEmployee(worker.uid, worker.is_employed)}
                      >
                        {worker.is_employed ? t("ReportsAdmin.Fire") : t("ReportsAdmin.Rehire")}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="reports-admin-vireo-divider" />

        <div className="reports-admin-vireo-section">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">{t("ReportsAdmin.CreateNewRoofReport")}</h3>
            <form onSubmit={handleSubmitReport} className="reports-admin-vireo-form">

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Location")}:</label>
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  {MAP_ORDER.map((greenhouse) => (
                    <option key={greenhouse} value={greenhouse}>
                      {greenhouse}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Activity")}:</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  <option value="Painting">{t("ReportsAdmin.Painting")}</option>
                  <option value="Cleaning">{t("ReportsAdmin.Cleaning")}</option>
                  <option value="PaintingAndCleaning">{t("ReportsAdmin.PaintingAndCleaning")}</option>
                </select>
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Status")}:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  <option value="Done">{t("ReportsAdmin.Done")}</option>
                  <option value="ToBeDone">{t("ReportsAdmin.ToBeDone")}</option>
                </select>
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.DateOptional")}:</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.DescriptionOptional")}:</label>
                <textarea
                  placeholder={t("ReportsAdmin.DescriptionPlaceholder")}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="reports-admin-vireo-textarea"
                />
              </div>

              <button type="submit" className="reports-admin-vireo-submit-btn">
                {t("ReportsAdmin.SubmitRoofReport")}
              </button>
            </form>
          </div>

          <div className="reports-admin-vireo-list-container">
            <h3 className="reports-admin-vireo-list-title">{t("ReportsAdmin.ActiveRoofStatusReports")}</h3>

            {/* Map Filter Selector Dropdown */}
            <div className="reports-admin-vireo-input-group" style={{ marginBottom: '15px' }}>
              <label className="reports-admin-vireo-label">{t("ReportsAdmin.FilterByMap") || "Filter by Map"}:</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="reports-admin-vireo-select"
              >
                <option value="All">{t("ReportsAdmin.All") || "All"}</option>
                {MAP_ORDER.map((greenhouse) => (
                  <option key={greenhouse} value={greenhouse}>
                    {greenhouse}
                  </option>
                ))}
              </select>
            </div>

            {roofReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">{t("ReportsAdmin.NoReportsAvailable")}</p>
                <span className="reports-admin-vireo-empty-subtitle">{t("ReportsAdmin.NoRoofReports")}</span>
              </div>
            ) : (
              roofReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">{t("ReportsAdmin.Location")}: {report.location}</h4>
                  <p className="reports-admin-vireo-card-text">
                    <strong>{t("ReportsAdmin.Activity") || "Activity"}:</strong> {getLabel(report.activity, report.activity)}
                  </p>
                  <p className="reports-admin-vireo-card-text">
                    <strong>{t("ReportsAdmin.Status") || "Status"}:</strong> {getLabel(report.status, report.status)}
                  </p>
                  {report.description && (
                    <p className="reports-admin-vireo-card-text">
                      <strong>{t("ReportsAdmin.Description")}:</strong> {report.description}
                    </p>
                  )}
                  <p className="reports-admin-vireo-card-date">{t("ReportsAdmin.ReportedOn")}: {report.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="reports-admin-vireo-divider" />

        <div className="reports-admin-vireo-section">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">{t("ReportsAdmin.CreateNewClimateComputerReport")}</h3>
            <form onSubmit={handleSubmitClimateReport} className="reports-admin-vireo-form">

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Nursery")}:</label>
                <select
                  value={newNursery}
                  onChange={(e) => setNewNursery(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  {MAP_ORDER.map((greenhouse) => (
                    <option key={greenhouse} value={greenhouse}>
                      {greenhouse}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.ClimateComputerNumber")}:</label>
                <input
                  type="text"
                  placeholder={t("ReportsAdmin.ComputerPlaceholder")}
                  value={newComputerNum}
                  onChange={(e) => setNewComputerNum(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Department")}:</label>
                <input
                  type="text"
                  placeholder={t("ReportsAdmin.DepartmentPlaceholder")}
                  value={newAfdeling}
                  onChange={(e) => setNewAfdeling(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.InsideTemperature")}:</label>
                <input
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder={t("ReportsAdmin.TemperaturePlaceholder")}
                  value={newInsideTemp}
                  onChange={(e) => setNewInsideTemp(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.OutsideTemperature")}:</label>
                <input
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder={t("ReportsAdmin.TemperaturePlaceholder")}
                  value={newOutsideTemp}
                  onChange={(e) => setNewOutsideTemp(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Humidity")}:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder={t("ReportsAdmin.HumidityPlaceholder")}
                  value={newHumidity}
                  onChange={(e) => setNewHumidity(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Light")}:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100000"
                  placeholder={t("ReportsAdmin.LightPlaceholder")}
                  value={newLight}
                  onChange={(e) => setNewLight(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <button type="submit" className="reports-admin-vireo-submit-btn">
                {t("ReportsAdmin.SubmitClimateReport")}
              </button>
            </form>
          </div>

          <div className="reports-admin-vireo-list-container">
            <h3 className="reports-admin-vireo-list-title">{t("ReportsAdmin.ActiveClimateComputerReports")}</h3>

            {/* Climate Map Filter Selector Dropdown */}
            <div className="reports-admin-vireo-input-group" style={{ marginBottom: '15px' }}>
              <label className="reports-admin-vireo-label">{t("ReportsAdmin.FilterByMap") || "Filter by Map"}:</label>
              <select
                value={selectedClimateFilter}
                onChange={(e) => setSelectedClimateFilter(e.target.value)}
                className="reports-admin-vireo-select"
              >
                <option value="All">{t("ReportsAdmin.All") || "All"}</option>
                {MAP_ORDER.map((greenhouse) => (
                  <option key={greenhouse} value={greenhouse}>
                    {greenhouse}
                  </option>
                ))}
              </select>
            </div>

            {climateReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">{t("ReportsAdmin.NoClimateDataAvailable")}</p>
                <span className="reports-admin-vireo-empty-subtitle">{t("ReportsAdmin.NoClimateReports")}</span>
              </div>
            ) : (
              climateReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">{t("ReportsAdmin.Nursery")}: {report.nursery} ({t("ReportsAdmin.ClimateComputerNumber")}: {report.hoogendoornnummer})</h4>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.Department")}:</strong> {report.afdeling}</p>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.InsideTemperature")}:</strong> {report.inside_temperature} C | <strong>{t("ReportsAdmin.OutsideTemperature")}:</strong> {report.outside_temperature} C</p>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.Humidity")}:</strong> {report.humidity}% | <strong>{t("ReportsAdmin.Light")}:</strong> {report.light}</p>
                  <p className="reports-admin-vireo-card-date">{t("ReportsAdmin.LoggedOn")}: {report.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

export default ReportsAdmin