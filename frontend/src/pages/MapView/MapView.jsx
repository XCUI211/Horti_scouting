import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { MAP_ORDER } from '../../constants/mapOrder';
import RijsenhoutMap from '../../components/AllMaps/Rijsenhout';
import HW53Map from '../../components/AllMaps/hw.53';
import HW1012Map from '../../components/AllMaps/hw.10.12';
import HW1015Map from '../../components/AllMaps/hw.10.15';
import HW1016Map from '../../components/AllMaps/hw.10.16';
import HW1017Map from '../../components/AllMaps/hw.10.17';
import HW15Map from '../../components/AllMaps/hw.15';
import Leg from '../../components/AllMaps/Leg';
import Plattergrond13 from '../../components/AllMaps/Plattergrond13';
import Plattergrond29 from '../../components/AllMaps/Plattergrond29';
import './MapView.css';
import { useTranslation } from "react-i18next";

const MAPS = {
  'Rijsenhout': RijsenhoutMap,
  'HW 53': HW53Map,
  'HW 10.12': HW1012Map,
  'HW 10.15': HW1015Map,
  'HW 10.16': HW1016Map,
  'HW 15': HW15Map,
  'HW 10.17': HW1017Map,
  'Legmeerdijk': Leg,
  'HW 13': Plattergrond13,
  'HW 29': Plattergrond29,
};

// Stores the last selected map in session storage so that when the admin navigates away and comes back to the MapView
// page, it will show the same map they were on before instead of defaulting back to Rijsenhout. This is stored in
// session storage so if the user closes the browser and opens it again, it will reset back to the first one (Rijsenhout).
const MAP_STORAGE_KEY = 'hortihorti:lastSelectedMap';
function MapView() {
  const [currentMap, setCurrentMap] = useState(() => {
    if (typeof window === 'undefined') return 'Rijsenhout';

    const storedMap = window.sessionStorage.getItem(MAP_STORAGE_KEY);
    return storedMap && MAPS[storedMap] ? storedMap : 'Rijsenhout';
  });
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSwitchMap = (name) => {
    setCurrentMap(name);
    window.sessionStorage.setItem(MAP_STORAGE_KEY, name);
  };

  const CurrentMap = MAPS[currentMap];

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
