import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import { useTranslation } from 'react-i18next';
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
import './MapViewScouts.css';

const ALL_MAPS = {
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

const MAP_STORAGE_KEY = 'hortihorti:scout:lastSelectedMap';

function MapViewScouts() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assignedMaps, setAssignedMaps] = useState({});
  const [assignedOrder, setAssignedOrder] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;

    Promise.all([
      axios.get('http://localhost:5000/api/maps'),
      axios.get(`http://localhost:5000/api/users/${user.uid}/maps`)
    ])
      .then(([allMapsRes, assignedRes]) => {
        const assignedMids = assignedRes.data.map(r => r.mid);

        const nameToMid = {};
        allMapsRes.data.forEach(m => { nameToMid[m.name] = m.mid; });

        const filtered = MAP_ORDER.filter(
          name => nameToMid[name] && assignedMids.includes(nameToMid[name])
        );

        const filteredMaps = {};
        filtered.forEach(name => { filteredMaps[name] = ALL_MAPS[name]; });

        setAssignedMaps(filteredMaps);
        setAssignedOrder(filtered);

        const stored = window.sessionStorage.getItem(MAP_STORAGE_KEY);
        setCurrentMap(stored && filteredMaps[stored] ? stored : filtered[0] || null);
      })
      .catch(err => console.error('Error fetching maps:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSwitchMap = (name) => {
    setCurrentMap(name);
    window.sessionStorage.setItem(MAP_STORAGE_KEY, name);
  };

  if (loading) return <ScoutLayout title="Maps"><p>{t("MapviewScouts.Loading")}</p></ScoutLayout>;
  if (!currentMap) return <ScoutLayout title="Maps"><p>{t("MapviewScouts.NoMaps")}</p></ScoutLayout>;

  const CurrentMap = assignedMaps[currentMap];

  return (
    <ScoutLayout title={`${t('MapviewScouts.Maps')}: ${currentMap}`}>
      <div className="mapview-toolbar">
        <div className="mapview-tabs">

          {/*Naviagte to the maps URL when the map button is clicked*/}
          <button
            className="mapview-tab active"
            onClick={() => navigate('/scout_maps')}
          >
            {t("MapviewScouts.Maps")}
          </button>
        </div>
        {assignedOrder.length > 1 && (
          <select
            className="mapview-select"
            value={currentMap}
            onChange={(e) => handleSwitchMap(e.target.value)}
          >
            {assignedOrder.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="mapview-content">
        <CurrentMap />
      </div>
    </ScoutLayout>
  );
}

export default MapViewScouts;