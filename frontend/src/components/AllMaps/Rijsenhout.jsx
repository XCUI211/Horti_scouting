import React, { useState, useEffect } from 'react';
import mapData from './rijsenhout.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';
import { useTranslation } from "react-i18next";

const RijsenhoutMap = ({ focusedReport, mapName = "Rijsenhout" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const { t, i18n } = useTranslation(); //i18n for local language
  
  const unclickableLabels = [
    "Rijsenhout", "Oppotruimte", "Raap plein", 
    "Magazijn", "KAS 2", "KAS 3", "KAS 4"
  ];

  const getDisplayLabel = (label) => {
    const translations = {
      "Oppotruimte": t("Rijsenhout.Potting"),
      "Raap plein": t("Rijsenhout.Square"),
      "Magazijn": t("Rijsenhout.Stockroom"),
      "KAS 2": `${t("Rijsenhout.Greenhouse")} 2`,
      "KAS 3": `${t("Rijsenhout.Greenhouse")} 3`,
      "KAS 4": `${t("Rijsenhout.Greenhouse")} 4`,
    };

    return translations[label] || label;
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/reports?map_id=${mapName}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const statusMap = {};
          data.data.forEach(report => {
            const key = report.block_key || report.cell_name;
            const currentStatus = statusMap[key];
            if (report.status === 'approved') {
              statusMap[key] = 'approved';
            } else if (report.status === 'pending' && currentStatus !== 'approved') {
              statusMap[key] = 'pending';
            }
          });
          setCellStatuses(statusMap);
        }
      })
      .catch(err => console.error("Failed to fetch map statuses:", err));
  }, [mapName]);

  useEffect(() => {
    if (focusedReport) {
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          if (mapData[r][c] === focusedReport.cell_name) {
            const currentBlockKey = `${mapName}::${mapData[r][c]}::${r}:${c}`;
            
            if (focusedReport.block_key && focusedReport.block_key !== currentBlockKey) {
              continue;
            }

            const bounds = getMergedBounds(r, c, focusedReport.cell_name);
            bounds.block_key = focusedReport.block_key || currentBlockKey;
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport, mapName]);

  const getMergedBounds = (r, c, label) => {
    if (!label || typeof label === 'number') return null;
    let maxR = r; let maxC = c;
    while (maxC + 1 < mapData[r].length && mapData[r][maxC + 1] === label) { maxC++; }
    while (maxR + 1 < mapData.length && mapData[maxR + 1][c] === label) { maxR++; }
    return { label, startRow: r, startCol: c, width: maxC - c + 1, height: maxR - r + 1 };
  };

  const renderedCells = new Set();
  const gridElements = [];

  mapData.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (renderedCells.has(`${rIdx}-${cIdx}`)) return;
      const bounds = getMergedBounds(rIdx, cIdx, cell);

      if (bounds) {
        for (let i = rIdx; i < rIdx + bounds.height; i++) {
          for (let j = cIdx; j < cIdx + bounds.width; j++) { renderedCells.add(`${i}-${j}`); }
        }

        const isUnclickable = unclickableLabels.includes(bounds.label);
        const blockKey = `${mapName}::${bounds.label}::${rIdx}:${cIdx}`;
        
        let statusClass = '';
        const currentStatus = cellStatuses[blockKey] || cellStatuses[bounds.label];
        if (currentStatus === 'pending') statusClass = 'status-pending';
        if (currentStatus === 'approved') statusClass = 'status-approved';

        const isSelected = selectedGroup?.block_key === blockKey || 
                          (!selectedGroup?.block_key && selectedGroup?.label === bounds.label && selectedGroup?.startRow === rIdx && selectedGroup?.startCol === cIdx);

        gridElements.push(
          <div
            key={`${rIdx}-${cIdx}`}
            className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${isSelected ? 'selected' : ''} ${statusClass}`}
            style={{
              gridRow: `span ${bounds.height}`,
              gridColumn: `span ${bounds.width}`
            }}
            onClick={isUnclickable ? null : () => {
              setSelectedGroup({ ...bounds, block_key: blockKey });
              setViewingReport(null);
            }}
          >
            {getDisplayLabel(bounds.label)}
          </div>
        );
      } else {
        renderedCells.add(`${rIdx}-${cIdx}`);
        gridElements.push(<div key={`${rIdx}-${cIdx}`} className="grid-cell empty">{cell}</div>);
      }
    });
  });

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>{t("Rijsenhout.Header")}</h2>
        <p className="mobile-hint">{t("Rijsenhout.MobileHint")}</p>
      </div>
      <div className="map-viewport">
        <div className="merged-grid-container" style={{ display: 'grid', gridTemplateColumns: `repeat(${mapData[0].length}, minmax(70px, 1fr))`, gridAutoRows: 'minmax(45px, auto)' }}>
          {gridElements}
        </div>
      </div>
      <ScoutReportModal isOpen={!!selectedGroup} onClose={() => { setSelectedGroup(null); setViewingReport(null); }} cellInfo={selectedGroup} reportData={viewingReport} mapName={mapName} />
    </div>
  );
};

export default RijsenhoutMap;