import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next"
import { MAP_ORDER } from '../../constants/mapOrder'
import axios from 'axios'
import './ReportsAdmin.css'

const ReportsAdmin = ({ userData }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [roofReports, setRoofReports] = useState([])
  const [newLocation, setNewLocation] = useState(MAP_ORDER[0] || '')
  const [newCondition, setNewCondition] = useState('Needs to be painted')
  const [newDate, setNewDate] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const [climateReports, setClimateReports] = useState([])
  const [newNursery, setNewNursery] = useState(MAP_ORDER[0] || '')
  const [newComputerNum, setNewComputerNum] = useState('')
  const [newAfdeling, setNewAfdeling] = useState('')
  const [newInsideTemp, setNewInsideTemp] = useState('')
  const [newOutsideTemp, setNewOutsideTemp] = useState('')
  const [newHumidity, setNewHumidity] = useState('')
  const [newLight, setNewLight] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Fetch existing roof reports
  useEffect(() => {
    axios.get('http://localhost:5000/api/reports/roof')
      .then(res => {
        setRoofReports(res.data)
      })
      .catch(err => console.error(err))

    axios.get('http://localhost:5000/api/reports/climate')
      .then(res => {
        setClimateReports(res.data)
      })
      .catch(err => console.error(err))
  }, [])

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

    if (!cleanDescription) {
      alert(t("ReportsAdmin.InvalidDescription"))
      return
    }

    const newReport = {
      location: newLocation,
      condition: newCondition,
      description: cleanDescription,
      date: cleanDate || new Date().toLocaleDateString()
    }

    axios.post('http://localhost:5000/api/reports/roof', newReport)
      .then(() => {
        setRoofReports([...roofReports, { ...newReport, id: Date.now() }])
        setNewDescription('')
        setNewDate('')
      })
      .catch(err => console.error(err))
  }

  // Formet new roof report
  const handleSubmitClimateReport = (e) => {
    e.preventDefault()

    const cleanComputerNum = sanitizeInput(newComputerNum)
    const cleanAfdeling = sanitizeInput(newAfdeling)
    const cleanNotes = sanitizeInput(newNotes)

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
      computer_number: cleanComputerNum,
      afdeling: cleanAfdeling,
      inside_temperature: inside,
      outside_temperature: outside,
      humidity: humid,
      light: lightVal,
      notes: cleanNotes,
      date: new Date().toLocaleDateString()
    }

    axios.post('http://localhost:5000/api/reports/climate', newReport)
      .then(() => {
        setClimateReports([...climateReports, { ...newReport, id: Date.now() }])
        setNewComputerNum('')
        setNewAfdeling('')
        setNewInsideTemp('')
        setNewOutsideTemp('')
        setNewHumidity('')
        setNewLight('')
        setNewNotes('')
      })
      .catch(err => console.error(err))
  }

  // Fire reporter (or rehire if already fired)
  // CONNECT TO THE SERVER!!
  const handleFireEmployee = (userId) => {
    axios.post(`http://localhost:5000/api/users/${userId}/fire`)
      .then(() => {
        window.location.reload();
      })
      .catch(err => console.error(err));
  };

  const getRoofConditionLabel = (condition) => ({
    'Needs to be painted': t("ReportsAdmin.NeedsToBePainted"),
    'Needs to be cleaned': t("ReportsAdmin.NeedsToBeCleaned"),
    'Was already painted': t("ReportsAdmin.WasAlreadyPainted"),
  }[condition] || condition);

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

        {/* Employment Management Integration */}
        <div className="reports-admin-vireo-section reports-admin-vireo-fullwidth">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">{t("ReportsAdmin.EmploymentManagement")}</h3>
            <div className="reports-admin-vireo-employment-row">
              <span className="reports-admin-vireo-employment-text">
                {userData?.name || t("ReportsAdmin.Employee")} ({t("ReportsAdmin.Status")}: {userData?.is_employed ? t("ReportsAdmin.Employed") : t("ReportsAdmin.Fired")})
              </span>
              <button
                className="reports-admin-vireo-submit-btn"
                style={{ marginTop: 0, padding: '6px 12px' }}
                onClick={() => handleFireEmployee(userData?.uid)}
              >
                {userData?.is_employed ? t("ReportsAdmin.Fire") : t("ReportsAdmin.Rehire")}
              </button>
            </div>
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
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Status")}:</label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  <option value="Needs to be painted">{t("ReportsAdmin.NeedsToBePainted")}</option>
                  <option value="Needs to be cleaned">{t("ReportsAdmin.NeedsToBeCleaned")}</option>
                  <option value="Was already painted">{t("ReportsAdmin.WasAlreadyPainted")}</option>
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
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Description")}:</label>
                <textarea
                  placeholder={t("ReportsAdmin.DescriptionPlaceholder")}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
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
            {roofReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">{t("ReportsAdmin.NoReportsAvailable")}</p>
                <span className="reports-admin-vireo-empty-subtitle">{t("ReportsAdmin.NoRoofReports")}</span>
              </div>
            ) : (
              roofReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">{t("ReportsAdmin.Location")}: {report.location}</h4>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.RoofCondition")}:</strong> {getRoofConditionLabel(report.condition)}</p>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.Description")}:</strong> {report.description}</p>
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

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">{t("ReportsAdmin.Notes")}:</label>
                <textarea
                  placeholder={t("ReportsAdmin.NotesPlaceholder")}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="reports-admin-vireo-textarea"
                />
              </div>

              <button type="submit" className="reports-admin-vireo-submit-btn">
                {t("ReportsAdmin.SubmitClimateReport")}
              </button>
            </form>
          </div>

          <div className="reports-admin-vireo-list-container">
            <h3 className="reports-admin-vireo-list-title">{t("ReportsAdmin.ActiveClimateComputerReports")}</h3>
            {climateReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">{t("ReportsAdmin.NoClimateDataAvailable")}</p>
                <span className="reports-admin-vireo-empty-subtitle">{t("ReportsAdmin.NoClimateReports")}</span>
              </div>
            ) : (
              climateReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">{t("ReportsAdmin.Nursery")}: {report.nursery} ({t("ReportsAdmin.Computer")}: {report.computer_number})</h4>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.Department")}:</strong> {report.afdeling}</p>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.InsideTemp")}:</strong> {report.inside_temperature} C | <strong>{t("ReportsAdmin.OutsideTemp")}:</strong> {report.outside_temperature} C</p>
                  <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.HumidityLabel")}:</strong> {report.humidity}% | <strong>{t("ReportsAdmin.LightLevel")}:</strong> {report.light}</p>
                  {report.notes && <p className="reports-admin-vireo-card-text"><strong>{t("ReportsAdmin.Notes")}:</strong> {report.notes}</p>}
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



