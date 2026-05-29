import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { useTranslation } from "react-i18next"
import { MAP_ORDER } from '../../constants/mapOrder'
import axios from 'axios'

const ReportsAdmin = () => {
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

  return (
    <AdminLayout title="System Reports">
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#152974' }}>Create New Roof Report</h3>
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Location:</label>
                <select 
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {MAP_ORDER.map((greenhouse) => (
                    <option key={greenhouse} value={greenhouse}>
                      {greenhouse}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Status:</label>
                <select 
                  value={newCondition} 
                  onChange={(e) => setNewCondition(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Needs to be painted">Needs to be painted</option>
                  <option value="Needs to be cleaned">Needs to be cleaned</option> // Added as a wish from the client 
                  <option value="Was already painted">Was already painted</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Date (Optional):</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Description:</label>
                <textarea 
                  placeholder="Description..." 
                  value={newDescription} 
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }}
                />
              </div>

              <button type="submit" style={{ background: '#57b021', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
                Submit Roof Report
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0', color: '#152974' }}>Active Roof Status Reports</h3>
            {roofReports.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>No reports available</p>
                <span style={{ fontSize: '13px', display: 'block' }}>No roof reports to display.</span>
              </div>
            ) : (
              roofReports.map((report) => (
                <div key={report.id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#152974' }}>Location: {report.location}</h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Roof Condition:</strong> {report.condition}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Description:</strong> {report.description}</p>
                  <p style={{ margin: '5px 0', fontSize: '11px', color: '#666' }}>Reported on: {report.date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <hr style={{ border: '0', height: '1px', background: '#ddd', margin: '20px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#152974' }}>Create New Climaat Computer Report</h3>
            <form onSubmit={handleSubmitClimateReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Nursery:</label>
                <select 
                  value={newNursery} 
                  onChange={(e) => setNewNursery(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {MAP_ORDER.map((greenhouse) => (
                    <option key={greenhouse} value={greenhouse}>
                      {greenhouse}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Climaat Computer nummer:</label>
                <input 
                  type="text"
                  placeholder="e.g. Computer 1"
                  value={newComputerNum} 
                  onChange={(e) => setNewComputerNum(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Afdeling:</label>
                <input 
                  type="text"
                  placeholder="e.g. Section A"
                  value={newAfdeling} 
                  onChange={(e) => setNewAfdeling(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Inside temperature (per afdeling):</label>
                <input 
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder="°C (-20 to 60)"
                  value={newInsideTemp} 
                  onChange={(e) => setNewInsideTemp(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Outside temperature:</label>
                <input 
                  type="number"
                  step="0.01"
                  min="-20"
                  max="60"
                  placeholder="°C (-20 to 60)"
                  value={newOutsideTemp} 
                  onChange={(e) => setNewOutsideTemp(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Humidity (per afdeling):</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="% (0 to 100)"
                  value={newHumidity} 
                  onChange={(e) => setNewHumidity(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Light (per afdeling):</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100000"
                  placeholder="Lux / W/m² (0 to 100000)"
                  value={newLight} 
                  onChange={(e) => setNewLight(e.target.value)}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>Notes:</label>
                <textarea 
                  placeholder="Additional observations or notes..." 
                  value={newNotes} 
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }}
                />
              </div>

              <button type="submit" style={{ background: '#57b021', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
                Submit Climate Report
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0', color: '#152974' }}>Active Climaat Computer Reports</h3>
            {climateReports.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '20px', color: '#888', background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>No climate data available</p>
                <span style={{ fontSize: '13px', display: 'block' }}>No climaat computer reports to display.</span>
              </div>
            ) : (
              climateReports.map((report) => (
                <div key={report.id} style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#152974' }}>Nursery: {report.nursery} (Computer: {report.computer_number})</h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Afdeling:</strong> {report.afdeling}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Inside Temp:</strong> {report.inside_temperature}°C | <strong>Outside Temp:</strong> {report.outside_temperature}°C</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Humidity:</strong> {report.humidity}% | <strong>Light Level:</strong> {report.light}</p>
                  {report.notes && <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Notes:</strong> {report.notes}</p>}
                  <p style={{ margin: '5px 0', fontSize: '11px', color: '#666' }}>Logged on: {report.date}</p>
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