import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { MAP_ORDER } from '../../constants/mapOrder';
import { MAP_COMPONENTS } from '../../constants/mapRegistry';
import './MapView.css';
import { useTranslation } from "react-i18next";

// Stores the last selected map in session storage so that when the admin navigates away and comes back to the MapView
// page, it will show the same map they were on before instead of defaulting back to Rijsenhout. This is stored in
// session storage so if the user closes the browser and opens it again, it will reset back to the first one (Rijsenhout).
const MAP_STORAGE_KEY = 'hortihorti:lastSelectedMap';
function MapView() {
  const [currentMap, setCurrentMap] = useState(() => {
    if (typeof window === 'undefined') return 'Rijsenhout';

    const storedMap = window.sessionStorage.getItem(MAP_STORAGE_KEY);
    return storedMap && MAP_COMPONENTS[storedMap] ? storedMap : 'Rijsenhout';
  });
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSwitchMap = (name) => {
    setCurrentMap(name);
    window.sessionStorage.setItem(MAP_STORAGE_KEY, name);
  };

  const CurrentMap = MAP_COMPONENTS[currentMap];

  return (
    <AdminLayout title={`${t("Mapview.Maps")}: ${currentMap}`}>
      <div className="mapview-toolbar">
        <div className="mapview-tabs">

          {/*Naviagte to the maps URL when the map button is clicked*/}
          <button
            className="mapview-tab active"
            onClick={() => navigate('/maps')}
          >
            {t("Mapview.Maps")}
          </button>

          {/*Gave the Admin Dashboard its own page since there were bugs with navigating the pages*/}
          <button
            className="mapview-tab"
            onClick={() => navigate('/maps/admin_dashboard')}
          >
            {t("Mapview.AdminDashboard")}
          </button>
        </div>
        <select
          className="mapview-select"
          value={currentMap}
          onChange={(e) => handleSwitchMap(e.target.value)}
        >
          {/*Uses mapOrder.js to maintain same map order across the app*/}
          {MAP_ORDER.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="mapview-content">
        <CurrentMap />
      </div>
    </AdminLayout>
  );
}

export default MapView;
