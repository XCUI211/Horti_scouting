import React, { useState, useEffect } from 'react';
import mapData from './hw10.17.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const HW1017Map = ({ focusedReport, mapName = "HW 10.17" }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const staticCells = ['Deur naar 1600', 'Deur '];

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
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
          if (String(mapData[r][c]) === focusedReport.cell_name) {
            const bounds = getMergedBounds(r, c, mapData[r][c]);
            setSelectedGroup(bounds);
            setViewingReport(focusedReport);
            return;
          }
        }
      }
    }
  }, [focusedReport]);

  const getMergedBounds = (r, c, label) => {
    if (label === null || label === '') return null;
    let maxR = r;
    let maxC = c;
    while (maxC + 1 < mapData[r].length && mapData[r][maxC + 1] === label) { maxC++; }
    while (maxR + 1 < mapData.length) {
      const nextRowMatches = Array.from({ length: maxC - c + 1 }, (_, i) =>
        mapData[maxR + 1][c + i] === label
      ).every(Boolean);
      if (!nextRowMatches) break;
      maxR++;
    }
    return { label: String(label), startRow: r, startCol: c, width: maxC - c + 1, height: maxR - r + 1 };
  };

  const getNullSpan = (row, col) => {
    let width = 1;
    while (
      col + width < mapData[row].length &&
      (mapData[row][col + width] === null || mapData[row][col + width] === '')
    ) {
      width++;
    }
    let height = 1;
    while (row + height < mapData.length) {
      const matches = Array.from({ length: width }, (_, i) =>
        mapData[row + height][col + i] === null || mapData[row + height][col + i] === ''
      ).every(Boolean);
      const noExtraLeft =
        col === 0 ||
        (mapData[row + height][col - 1] !== null && mapData[row + height][col - 1] !== '');
      const noExtraRight =
        col + width >= mapData[row].length ||
        (mapData[row + height][col + width] !== null && mapData[row + height][col + width] !== '');
      if (!matches || !noExtraLeft || !noExtraRight) break;
      height++;
    }
    return { width, height };
  };

  const renderedCells = new Set();
  const gridElements = [];

  mapData.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (renderedCells.has(`${rIdx}-${cIdx}`)) return;

      // NULL / empty → transparent corridor block
      if (cell === null || cell === '') {
        const { width, height } = getNullSpan(rIdx, cIdx);
        for (let i = rIdx; i < rIdx + height; i++)
          for (let j = cIdx; j < cIdx + width; j++)
            renderedCells.add(`${i}-${j}`);
        gridElements.push(
          <div
            key={`${rIdx}-${cIdx}`}
            className="grid-cell corridor-cell"
            style={{ gridRow: `span ${height}`, gridColumn: `span ${width}` }}
            aria-hidden="true"
          />
        );
        return;
      }

      const bounds = getMergedBounds(rIdx, cIdx, cell);
      if (!bounds) {
        renderedCells.add(`${rIdx}-${cIdx}`);
        return;
      }

      for (let i = rIdx; i < rIdx + bounds.height; i++)
        for (let j = cIdx; j < cIdx + bounds.width; j++)
          renderedCells.add(`${i}-${j}`);

      const isUnclickable = staticCells.includes(bounds.label);

      let statusClass = '';
      if (cellStatuses[bounds.label] === 'pending') statusClass = 'status-pending';
      if (cellStatuses[bounds.label] === 'approved') statusClass = 'status-approved';

      gridElements.push(
        <div
          key={`${rIdx}-${cIdx}`}
          className={`grid-cell merged-block ${isUnclickable ? 'static-block' : 'clickable-block'} ${selectedGroup?.label === bounds.label ? 'selected' : ''} ${statusClass}`}
          style={{
            gridRow: `span ${bounds.height}`,
            gridColumn: `span ${bounds.width}`,
          }}
          onClick={isUnclickable ? null : () => {
            setSelectedGroup(bounds);
            setViewingReport(null);
          }}
        >
          {bounds.label}
        </div>
      );
    });
  });

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>HW10.17 - Scouting Map</h2>
        <p className="mobile-hint">Drag your finger to move the map • Tap a section to report</p>
      </div>
      <div className="map-viewport">
        <div
          className="merged-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${mapData[0].length}, minmax(22px, 1fr))`,
            gridAutoRows: 'minmax(45px, auto)',
          }}
        >
          {gridElements}
        </div>
      </div>
      <ScoutReportModal
        isOpen={!!selectedGroup}
        onClose={() => { setSelectedGroup(null); setViewingReport(null); }}
        cellInfo={selectedGroup}
        reportData={viewingReport}
        mapName={mapName}
      />
    </div>
  );
};

export default HW1017Map;