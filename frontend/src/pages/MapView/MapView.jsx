import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import RijsenhoutMap from '../../components/AllMaps/Rijsenhout';
import HW53Map from '../../components/AllMaps/hw.53';
import HW1012Map from '../../components/AllMaps/hw.10.12';
import HW1015Map from '../../components/AllMaps/hw.10.15';
import HW1016Map from '../../components/AllMaps/hw.10.16';
import HW1017Map from '../../components/AllMaps/hw.10.17';
import HW15Map from '../../components/AllMaps/hw.15';
import AdminDashboard from '../AdminDashboard/AdminDashboard';
import './MapView.css';

const MAPS = {
  'Rijsenhout': RijsenhoutMap,
  'HW 53': HW53Map,
  'HW 10.12': HW1012Map,
  'HW 10.15': HW1015Map,
  'HW 10.16': HW1016Map,
  'HW 15': HW15Map,
  'HW 10.17': HW1017Map,
};

function MapView() {
  const [view, setView] = useState('map');
  const [currentMap, setCurrentMap] = useState('Rijsenhout');
  const [focusedReport, setFocusedReport] = useState(null);

  const handleLocate = (report) => {
    if (report.map_id && MAPS[report.map_id]) {
      setCurrentMap(report.map_id);
    }
    setFocusedReport(report);
    setView('map');
  };

  const handleSwitchMap = (name) => {
    setCurrentMap(name);
    setFocusedReport(null);
  };

  const CurrentMap = MAPS[currentMap];

  return (
    <AdminLayout title={view === 'map' ? `Maps: ${currentMap}` : 'Maps'}>
      <div className="mapview-toolbar">
        <div className="mapview-tabs">
          <button
            className={`mapview-tab ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            Map View
          </button>
          <button
            className={`mapview-tab ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
          >
            Admin Dashboard
          </button>
        </div>
        {view === 'map' && (
          <select
            className="mapview-select"
            value={currentMap}
            onChange={(e) => handleSwitchMap(e.target.value)}
          >
            {Object.keys(MAPS).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mapview-content">
        {view === 'map' ? (
          <CurrentMap focusedReport={focusedReport} />
        ) : (
          <AdminDashboard onLocate={handleLocate} />
        )}
      </div>
    </AdminLayout>
  );
}

export default MapView;
