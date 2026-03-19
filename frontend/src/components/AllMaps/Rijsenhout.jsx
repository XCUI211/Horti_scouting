import React, { useState, useEffect } from 'react';
import mapData from './rijsenhout.json';
import './MapStyles.css';
import ScoutReportModal from './Forms/ScoutReportModal';

const RijsenhoutMap = ({ focusedReport }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellStatuses, setCellStatuses] = useState({});

  const staticCells = ["Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4"];

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

  // if parent passes a report open it
  useEffect(() => {
    if (focusedReport) setSelectedCell(focusedReport);
  }, [focusedReport]);

  const getCellSpan = (row, col, label) => {
    let width = 1, height = 1;
    while (col + width < mapData[row].length && mapData[row][col + width] === label) width++;
    while (row + height < mapData.length && mapData[row + height][col] === label) height++;
    return { width, height };
  };

  const renderGrid = () => {
    const rendered = new Set();
    const cells = [];

    mapData.forEach((row, r) => {
      row.forEach((label, c) => {
        if (rendered.has(`${r}-${c}`) || !label || typeof label === 'number') return;

        const { width, height } = getCellSpan(r, c, label);

        // mark all covered cells 
        for (let i = r; i < r + height; i++)
          for (let j = c; j < c + width; j++)
            rendered.add(`${i}-${j}`);

        const isStatic = staticCells.includes(label);
        const status = cellStatuses[label];

        cells.push(
          <div
            key={`${r}-${c}`}
            className={`grid-cell merged-block ${isStatic ? 'static-block' : 'clickable-block'} ${status || ''} ${selectedCell?.cell_name === label ? 'selected' : ''}`}            style={{ gridRow: `span ${height}`, gridColumn: `span ${width}` }}
            onClick={isStatic ? null : () => setSelectedCell({ cell_name: label })}
          >
            {label}
          </div>
        );
      });
    });

    return cells;
  };

  return (
    <div className="map-container">
      <h2>Rijsenhout - Scouting Map</h2>
      <div
        className="merged-grid-container"
        style={{ gridTemplateColumns: `repeat(${mapData[0].length}, minmax(70px, 1fr))` }}
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

export default RijsenhoutMap;