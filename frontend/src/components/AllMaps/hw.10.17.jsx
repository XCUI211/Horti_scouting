import React, { useState, useEffect } from 'react';
import mapData from './hw10.17.json'; 
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const HW1017Map = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const staticCells = ["Deur naar 1600", "Deur "];

  useEffect(() => {
    fetch('http://localhost:8000/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') return;
        const statuses = {};
        data.data.forEach(report => {
          if (report.status === 'approved' || !statuses[report.cell_name]) {
            statuses[report.cell_name] = report.status;
          }
        });
        setCellStatuses(statuses);
      });
  }, []);

  useEffect(() => {
    if (focusedReport) setSelectedCell(focusedReport);
  }, [focusedReport]);

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    if (!label) return { width, height };
    
    while (col + width < mapData[row].length && mapData[row][col + width] === label) width++;
    while (row + height < mapData.length && mapData[row + height][col] === label) height++;
    return { width, height };
  };

  const renderGrid = () => {
    const rendered = new Set();
    const cells = [];

    mapData.forEach((row, r) => {
      row.forEach((label, c) => {
        if (rendered.has(`${r}-${c}`) || label === null || label === "") return;

        const { width, height } = getCellSpan(r, c, label);

        for (let i = r; i < r + height; i++)
          for (let j = c; j < c + width; j++)
            rendered.add(`${i}-${j}`);

        const labelStr = String(label);
        const isStatic = staticCells.includes(labelStr);
        const status = cellStatuses[labelStr];

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${status || ''} ${selectedCell?.cell_name === labelStr ? 'selected' : ''}`}
            style={{ 
              gridRow: `span ${height}`, 
              gridColumn: `span ${width}`,
              backgroundColor: typeof label === 'number' && !isStatic ? '#e8f5e9' : undefined 
            }}
            onClick={isStatic ? null : () => setSelectedCell({ cell_name: labelStr })}
          >
            {labelStr}
          </div>
        );
      });
    });

    return cells;
  };

  return (
    <div className="map-container">
      <h2>HW10.17 - Scouting Map</h2>
      <div
        className="merged-grid-container"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${mapData[0].length}, minmax(40px, 1fr))` 
        }}
      >
        {renderGrid()}
      </div>

      <ScoutReportModal
        isOpen={!!selectedCell}
        cellInfo={selectedCell}
        reportData={focusedReport?.cell_name === selectedCell?.cell_name ? focusedReport : null}
        onClose={() => setSelectedCell(null)}
      />
    </div>
  );
};

export default HW1017Map;