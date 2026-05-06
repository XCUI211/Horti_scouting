import React, { useState, useEffect } from 'react';
import mapData from './rijsenhout.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal'; 

const RijsenhoutMap = ({ focusedReport, mapName = "Rijsenhout" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  
  const [cellStatuses, setCellStatuses] = useState({});

  const unclickableLabels = [
    "Rijsenhout", "Oppotruimte", "Raap plein", 
    "Magazijn", "KAS 2", "KAS 3", "KAS 4"
  ];

  useEffect(() => {
    fetch(`http://localhost:5000/api/reports?map_id=${mapName}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const statusMap = {};
          data.data.forEach(report => {
            const currentStatus = statusMap[report.cell_name];
            if (report.status === 'approved') {
              statusMap[report.cell_name] = 'approved';
            } else if (report.status === 'pending' && currentStatus !== 'approved') {
              statusMap[report.cell_name] = 'pending';
            }
          });
          setCellStatuses(statusMap);
        }
      })
      .catch(err => console.error("Failed to fetch map statuses:", err));
  }, []);

  useEffect(() => {
    if (focusedReport) {
      for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
          if (mapData[r][c] === focusedReport.cell_name) {
            const bounds = getMergedBounds(r, c, focusedReport.cell_name);
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport]);

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
        
        let statusClass = '';
        if (cellStatuses[bounds.label] === 'pending') statusClass = 'status-pending';
        if (cellStatuses[bounds.label] === 'approved') statusClass = 'status-approved';

        gridElements.push(
          <div
            key={`${rIdx}-${cIdx}`}
            className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${selectedGroup?.label === bounds.label ? 'selected' : ''} ${statusClass}`}
            style={{
              gridRow: `span ${bounds.height}`,
              gridColumn: `span ${bounds.width}`
            }}
            onClick={isUnclickable ? null : () => {
              setSelectedGroup(bounds);
              setViewingReport(null);
            }}
          >
            {bounds.label}
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
        <h2>Rijsenhout - Scouting Map</h2>
        <p className="mobile-hint">Drag your finger to move the map • Tap a section to report</p>
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
