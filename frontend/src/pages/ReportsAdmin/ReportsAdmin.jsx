import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { useTranslation } from "react-i18next"
import { MAP_ORDER } from '../../constants/mapOrder'
import axios from 'axios'
import './ReportsAdmin.css'

const ReportsAdmin = ({ userData }) => {
  const { t } = useTranslation()

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
      alert('Please enter a valid description without harmful characters.')
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
      alert('Please check your text inputs for invalid or harmful characters.')
      return
    }

    const inside = parseFloat(newInsideTemp)
    const outside = parseFloat(newOutsideTemp)
    const humid = parseFloat(newHumidity)
    const lightVal = parseFloat(newLight)

    // Validate numeric inputs
    if (inside < -20 || inside > 60 || outside < -20 || outside > 60) {
      alert('Temperature values must be between -20°C and 60°C.')
      return
    }

    if (humid < 0 || humid > 100) {
      alert('Humidity must be between 0% and 100%.')
      return
    }

    if (lightVal < 0 || lightVal > 100000) {
      alert('Light levels must be between 0 and 100,000.')
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

  return (
    <AdminLayout title="System Reports">
      <div className="reports-admin-vireo-container">

        {/* Employment Management Integration */}
        <div className="reports-admin-vireo-section reports-admin-vireo-fullwidth">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">Employment Management</h3>
            <div className="reports-admin-vireo-employment-row">
              <span className="reports-admin-vireo-employment-text">
                {userData?.name || 'Employee'} (Status: {userData?.is_employed ? 'Employed' : 'Fired'})
              </span>
              <button
                className="reports-admin-vireo-submit-btn"
                style={{ marginTop: 0, padding: '6px 12px' }}
                onClick={() => handleFireEmployee(userData?.uid)}
              >
                {userData?.is_employed ? 'Fire' : 'Rehire'}
              </button>
            </div>
          </div>
        </div>

        <hr className="reports-admin-vireo-divider" />

        <div className="reports-admin-vireo-section">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">Create New Roof Report</h3>
            <form onSubmit={handleSubmitReport} className="reports-admin-vireo-form">

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Location:</label>
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
                <label className="reports-admin-vireo-label">Status:</label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="reports-admin-vireo-select"
                >
                  <option value="Needs to be painted">Needs to be painted</option>
                  <option value="Needs to be cleaned">Needs to be cleaned</option> // Added as a wish from the client
                  <option value="Was already painted">Was already painted</option>
                </select>
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Date (Optional):</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Description:</label>
                <textarea
                  placeholder="Description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  className="reports-admin-vireo-textarea"
                />
              </div>

              <button type="submit" className="reports-admin-vireo-submit-btn">
                Submit Roof Report
              </button>
            </form>
          </div>

          <div className="reports-admin-vireo-list-container">
            <h3 className="reports-admin-vireo-list-title">Active Roof Status Reports</h3>
            {roofReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">No reports available</p>
                <span className="reports-admin-vireo-empty-subtitle">No roof reports to display.</span>
              </div>
            ) : (
              roofReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">Location: {report.location}</h4>
                  <p className="reports-admin-vireo-card-text"><strong>Roof Condition:</strong> {report.condition}</p>
                  <p className="reports-admin-vireo-card-text"><strong>Description:</strong> {report.description}</p>
                  <p className="reports-admin-vireo-card-date">Reported on: {report.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="reports-admin-vireo-divider" />

        <div className="reports-admin-vireo-section">
          <div className="reports-admin-vireo-form-card">
            <h3 className="reports-admin-vireo-form-title">Create New Climaat Computer Report</h3>
            <form onSubmit={handleSubmitClimateReport} className="reports-admin-vireo-form">

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Nursery:</label>
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
                <label className="reports-admin-vireo-label">Climaat Computer nummer:</label>
                <input
                  type="text"
                  placeholder="e.g. Computer 1"
                  value={newComputerNum}
                  onChange={(e) => setNewComputerNum(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Afdeling:</label>
                <input
                  type="text"
                  placeholder="e.g. Section A"
                  value={newAfdeling}
                  onChange={(e) => setNewAfdeling(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Inside temperature (per afdeling):</label>
                <input
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder="°C (-20 to 60)"
                  value={newInsideTemp}
                  onChange={(e) => setNewInsideTemp(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Outside temperature:</label>
                <input
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder="°C (-20 to 60)"
                  value={newOutsideTemp}
                  onChange={(e) => setNewOutsideTemp(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Humidity (per afdeling):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="% (0 to 100)"
                  value={newHumidity}
                  onChange={(e) => setNewHumidity(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Light (per afdeling):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100000"
                  placeholder="Lux / W/m² (0 to 100000)"
                  value={newLight}
                  onChange={(e) => setNewLight(e.target.value)}
                  required
                  className="reports-admin-vireo-input"
                />
              </div>

              <div className="reports-admin-vireo-input-group">
                <label className="reports-admin-vireo-label">Notes:</label>
                <textarea
                  placeholder="Additional observations or notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="reports-admin-vireo-textarea"
                />
              </div>

              <button type="submit" className="reports-admin-vireo-submit-btn">
                Submit Climate Report
              </button>
            </form>
          </div>

          <div className="reports-admin-vireo-list-container">
            <h3 className="reports-admin-vireo-list-title">Active Climaat Computer Reports</h3>
            {climateReports.length === 0 ? (
              <div className="reports-admin-vireo-empty-state">
                <p className="reports-admin-vireo-empty-title">No climate data available</p>
                <span className="reports-admin-vireo-empty-subtitle">No climaat computer reports to display.</span>
              </div>
            ) : (
              climateReports.map((report) => (
                <div key={report.id} className="reports-admin-vireo-report-card">
                  <h4 className="reports-admin-vireo-card-title">Nursery: {report.nursery} (Computer: {report.computer_number})</h4>
                  <p className="reports-admin-vireo-card-text"><strong>Afdeling:</strong> {report.afdeling}</p>
                  <p className="reports-admin-vireo-card-text"><strong>Inside Temp:</strong> {report.inside_temperature}°C | <strong>Outside Temp:</strong> {report.outside_temperature}°C</p>
                  <p className="reports-admin-vireo-card-text"><strong>Humidity:</strong> {report.humidity}% | <strong>Light Level:</strong> {report.light}</p>
                  {report.notes && <p className="reports-admin-vireo-card-text"><strong>Notes:</strong> {report.notes}</p>}
                  <p className="reports-admin-vireo-card-date">Logged on: {report.date}</p>
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