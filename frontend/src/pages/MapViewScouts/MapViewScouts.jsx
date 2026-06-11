import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import { useTranslation } from 'react-i18next';
import { MAP_ORDER } from '../../constants/mapOrder';
import { MAP_COMPONENTS } from '../../constants/mapRegistry';
import './MapViewScouts.css';

const MAP_STORAGE_KEY = 'hortihorti:scout:lastSelectedMap';

function MapViewScouts() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assignedOrder, setAssignedOrder] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    Promise.all([
      axios.get('http://localhost:5000/api/maps'),
      axios.get(`http://localhost:5000/api/users/${user.uid}/maps`)
    ])
      .then(([allMapsRes, assignedRes]) => {
        const assignedMids = assignedRes.data;

        const nameToMid = {};
        allMapsRes.data.forEach(m => { nameToMid[m.name] = m.mid; });

        const filtered = MAP_ORDER.filter(
          name => MAP_COMPONENTS[name] && nameToMid[name] && assignedMids.includes(nameToMid[name])
        );

        setAssignedOrder(filtered);

        const stored = window.sessionStorage.getItem(MAP_STORAGE_KEY);
        setCurrentMap(stored && filtered.includes(stored) ? stored : filtered[0] || null);
      })
      .catch(err => console.error('Error fetching maps:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSwitchMap = (name) => {
    setCurrentMap(name);
    window.sessionStorage.setItem(MAP_STORAGE_KEY, name);
  };

  if (loading) return <ScoutLayout title="Maps"><p>{t("MapViewScouts.Loading")}</p></ScoutLayout>;
  if (!currentMap) return <ScoutLayout title="Maps"><p>{t("MapViewScouts.NoMaps")}</p></ScoutLayout>;

  const CurrentMap = MAP_COMPONENTS[currentMap];

  return (
    <ScoutLayout title={`${t("MapViewScouts.Maps")}: ${currentMap}`}>
      <div className="mapview-toolbar">
        <div className="mapview-tabs">
          <span className="mapview-tab active" aria-current="page">
            {t("MapViewScouts.Maps")}
          </span>
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
